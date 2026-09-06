import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test'

const PASSWORD = 'Deneme123*MyTestPasswordIsLong'

async function captureMnemonic(page: Page): Promise<string> {
  const allText = await page.evaluate(() => document.body.innerText)
  const seen = new Map<number, string>()
  for (const match of allText.matchAll(/(?:^|\s)(\d{1,2})[.)]\s*([a-z]+)\b/gim)) {
    const index = Number(match[1])
    if (index >= 1 && index <= 24 && !seen.has(index)) seen.set(index, match[2])
  }
  const words = Array.from({ length: 24 }, (_, index) => seen.get(index + 1))
  if (words.some((word) => !word)) {
    throw new Error(`failed to capture recovery mnemonic (${seen.size}/24 words found)`)
  }
  return words.join(' ')
}

async function registerUser(
  context: BrowserContext,
  email: string,
  username: string,
): Promise<void> {
  const page = await context.newPage()
  await page.goto('/register')
  await page.locator('input[type=email]').fill(email)
  await page.getByLabel(/username/i).fill(username)
  const passwords = page.locator('input[type=password]')
  await passwords.nth(0).fill(PASSWORD)
  await passwords.nth(1).fill(PASSWORD)
  await page.locator('button[type=submit]').click()
  await expect(page.getByText(/once/i).first()).toBeVisible({ timeout: 30_000 })
  const mnemonic = await captureMnemonic(page)
  await page.getByRole('button', { name: /saved/i }).click()
  await page.locator('textarea').fill(mnemonic)
  await page.locator('button[type=submit]').click()
  await expect(page.getByRole('button', { name: /sign ?in/i })).toBeVisible({ timeout: 30_000 })
  await page.close()
}

async function login(
  context: BrowserContext,
  email: string,
  password: string,
): Promise<Page> {
  const page = await context.newPage()
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto('/login')
    await page.locator('input[type=email]').fill(email)
    await page.locator('input[type=password]').fill(password)
    await page.locator('button[type=submit]').click()
    await page.waitForFunction(
      () => location.pathname.startsWith('/drive') || document.querySelector('[role="alert"]'),
      undefined,
      { timeout: 30_000 },
    )
    if (new URL(page.url()).pathname.startsWith('/drive')) return page

    const error = (await page.getByRole('alert').textContent())?.trim() || 'Login failed'
    if (attempt === 3) throw new Error(error)
    // The production nginx auth bucket refills at 10 requests/minute. A login
    // is a preflight + credential request, so allow two slots to refill before
    // retrying after the UI's own transient-503 backoff is exhausted.
    await page.waitForTimeout(13_000)
  }
  throw new Error('unreachable login retry state')
}

async function openChat(page: Page): Promise<void> {
  const statuses: string[] = []
  const initializationErrors: string[] = []
  const onResponse = (response: import('@playwright/test').Response) => {
    const path = new URL(response.url()).pathname
    if (!path.startsWith('/api/chat/')) return
    const endpoint = path.includes('/prekeys')
      ? 'prekeys'
      : path.includes('/manifests')
        ? 'manifests'
        : path.includes('/backup')
          ? 'backup'
          : path.includes('/profile')
            ? 'profile'
            : path.includes('/devices')
              ? 'devices'
              : 'other'
    statuses.push(`${endpoint}:${response.status()}`)
  }
  const onConsole = (message: import('@playwright/test').ConsoleMessage) => {
    if (message.type() === 'error' && message.text().startsWith('Secure chat failed to initialize')) {
      initializationErrors.push(sanitizeDiagnostic(message.text()))
    }
  }
  page.on('response', onResponse)
  page.on('console', onConsole)
  await page.goto('/chat')
  await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible({ timeout: 60_000 })
  try {
    await expect(page.getByTestId('chat-device-status')).toHaveText(/Device \d+/, {
      timeout: 60_000,
    })
    await expect(page.getByRole('button', { name: 'Sync messages' })).toBeEnabled({
      timeout: 60_000,
    })
  } catch (error) {
    if (process.env.KUTUP_E2E_CHAT_DIAGNOSTICS === '1') {
      console.log(
        `CHAT DIAGNOSTIC openStatuses=${statuses.join(',') || 'none'}`
        + ` initializationErrors=${JSON.stringify(initializationErrors)}`,
      )
    }
    throw error
  } finally {
    page.off('response', onResponse)
    page.off('console', onConsole)
  }
}

function sanitizeDiagnostic(value: string): string {
  return value
    .replace(/[\w.+-]+@[\w.-]+/g, '<account>')
    .replace(/\b(?:chatalice|chatbob|user)-?\d+\b/gi, '<account>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, '<uuid>')
    .replace(/\b[A-Za-z0-9_-]{24,}\b/g, '<opaque>')
    .replace(/\b\d+\b/g, '<n>')
    .slice(0, 300)
}

async function cloneAuthenticatedInstall(
  browser: Browser,
  sourceContext: BrowserContext,
  sourcePage: Page,
): Promise<{ context: BrowserContext; page: Page }> {
  const session = await sourcePage.evaluate(() => sessionStorage.getItem('kutup_session'))
  if (!session) throw new Error('source install has no authenticated session')

  // Browser storageState carries the HTTP-only refresh cookie, but Playwright
  // deliberately excludes tab-scoped sessionStorage. Restore the encrypted
  // account material explicitly into a fresh context. IndexedDB is not copied,
  // so chat still creates and registers an independent linked device.
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: await sourceContext.storageState(),
  })
  await context.addInitScript((savedSession) => {
    sessionStorage.setItem('kutup_session', savedSession)
  }, session)
  return { context, page: await context.newPage() }
}

async function startConversation(page: Page, username: string): Promise<void> {
  await page.getByPlaceholder('Username').fill(username)
  await page.getByRole('button', { name: 'Start chat' }).click()
}

async function send(page: Page, text: string): Promise<void> {
  const composer = page.getByRole('main').getByRole('textbox')
  await composer.fill(text)
  await page.getByRole('button', { name: 'Send', exact: true }).click()
}

function messageBubble(page: Page, text: string) {
  return page.getByRole('main').getByText(text, { exact: true })
}

async function chatStoreCounts(page: Page): Promise<Record<string, number>> {
  return await page.evaluate(async () => {
    const database = (await indexedDB.databases())
      .find(candidate => candidate.name?.startsWith('kutup-chat-v2:'))
    if (!database?.name) return { databases: 0 }
    const connection = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(database.name!)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const counts: Record<string, number> = { databases: 1 }
    for (const store of ['sent_messages', 'messages', 'inbound', 'outbox']) {
      if (!connection.objectStoreNames.contains(store)) continue
      counts[store] = await new Promise<number>((resolve, reject) => {
        const request = connection.transaction(store).objectStore(store).count()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }
    connection.close()
    return counts
  })
}

async function syncUntilVisible(page: Page, text: string): Promise<void> {
  await syncUntilLocatorVisible(page, messageBubble(page, text))
}

async function syncUntilLocatorVisible(page: Page, target: Locator): Promise<void> {
  await expect.poll(async () => {
    if (await target.count() > 0) return true
    const sync = page.getByRole('button', { name: 'Sync messages' })
    await expect(sync).toBeEnabled()
    await sync.click()
    return await target.count() > 0
  }, { timeout: 45_000, intervals: [500, 1_000, 2_000] }).toBe(true)
}

test.describe('Signal-backed chat', () => {
  test('two accounts exchange encrypted messages and retain local history', async ({ browser }) => {
    test.slow()
    const contextA = await browser.newContext({ ignoreHTTPSErrors: true })
    const contextB = await browser.newContext({ ignoreHTTPSErrors: true })

    const tag = Date.now()
    const usernameA = `chatalice${tag % 1_000_000}`
    const emailA = `${usernameA}@kutup.local`
    const usernameB = `chatbob${tag % 1_000_000}`
    const emailB = `${usernameB}@kutup.local`
    await registerUser(contextA, emailA, usernameA)
    await registerUser(contextB, emailB, usernameB)
    const pageA = await login(contextA, emailA, PASSWORD)
    const pageB = await login(contextB, emailB, PASSWORD)

    // Opening registers each install, publishes its signed device manifest,
    // performs mailbox reconciliation, and starts the WebSocket hint channel.
    await openChat(pageA)
    await openChat(pageB)

    // A second install of Alice extends the signed device manifest. Note to
    // Self is stored locally on the sender and arrives on this linked install
    // as outgoing history via an encrypted sent transcript.
    const { context: contextA2, page: pageA2 } = await cloneAuthenticatedInstall(
      browser,
      contextA,
      pageA,
    )
    const linkedDiagnostics = {
      syncStatuses: [] as number[],
      syncEnvelopeCounts: [] as number[],
      syncStoredCounts: [] as number[],
      mailboxPageCounts: [] as number[],
      ackStatuses: [] as number[],
    }
    pageA.on('request', request => {
      if (
        request.method() === 'POST'
        && new URL(request.url()).pathname === '/api/chat/sync/messages'
      ) {
        try {
          const body = request.postDataJSON() as { envelopes?: unknown[] }
          linkedDiagnostics.syncEnvelopeCounts.push(body.envelopes?.length ?? 0)
        } catch {
          linkedDiagnostics.syncEnvelopeCounts.push(-1)
        }
      }
    })
    pageA.on('response', async response => {
      if (
        response.request().method() === 'POST'
        && new URL(response.url()).pathname === '/api/chat/sync/messages'
      ) {
        linkedDiagnostics.syncStatuses.push(response.status())
        try {
          const body = await response.json() as { stored?: number }
          linkedDiagnostics.syncStoredCounts.push(body.stored ?? -1)
        } catch {
          linkedDiagnostics.syncStoredCounts.push(-1)
        }
      }
    })
    pageA2.on('response', async response => {
      const path = new URL(response.url()).pathname
      if (response.request().method() === 'GET' && path === '/api/chat/messages') {
        try {
          const body = await response.json() as { envelopes?: unknown[] }
          linkedDiagnostics.mailboxPageCounts.push(body.envelopes?.length ?? 0)
        } catch {
          linkedDiagnostics.mailboxPageCounts.push(-1)
        }
      }
      if (response.request().method() === 'POST' && path === '/api/chat/messages/ack') {
        linkedDiagnostics.ackStatuses.push(response.status())
      }
    })
    await openChat(pageA2)
    const firstDevice = await pageA.getByTestId('chat-device-status').textContent()
    await expect(pageA2.getByTestId('chat-device-status')).not.toHaveText(firstDevice ?? '')

    // Reopen the already-running source after the linked install has committed
    // its signed manifest entry. The source then pins that exact generation
    // before it creates sent transcripts for the account's other devices.
    await openChat(pageA)
    const selfNote = `note-to-self-${tag}`
    await pageA.getByRole('button', { name: 'Note to Self' }).click()
    await send(pageA, selfNote)
    await expect(messageBubble(pageA, selfNote)).toBeVisible({ timeout: 30_000 })
    await openChat(pageA2)
    await pageA2.getByRole('button', { name: 'Note to Self' }).click()
    try {
      await syncUntilVisible(pageA2, selfNote)
    } catch (error) {
      if (process.env.KUTUP_E2E_CHAT_DIAGNOSTICS === '1') {
        console.log(
          `CHAT DIAGNOSTIC syncStatuses=${linkedDiagnostics.syncStatuses.join(',') || 'none'}`
          + ` syncEnvelopeCounts=${linkedDiagnostics.syncEnvelopeCounts.join(',') || 'none'}`
          + ` syncStoredCounts=${linkedDiagnostics.syncStoredCounts.join(',') || 'none'}`
          + ` mailboxPageCounts=${linkedDiagnostics.mailboxPageCounts.join(',') || 'none'}`
          + ` ackStatuses=${linkedDiagnostics.ackStatuses.join(',') || 'none'}`
          + ` alerts=${await pageA2.getByRole('alert').count()}`,
        )
      }
      throw error
    }
    const beforeReloadCounts = await chatStoreCounts(pageA2)
    await openChat(pageA2)
    await pageA2.getByRole('button', { name: 'Note to Self' }).click()
    try {
      await expect(messageBubble(pageA2, selfNote)).toBeVisible({ timeout: 60_000 })
    } catch (error) {
      if (process.env.KUTUP_E2E_CHAT_DIAGNOSTICS === '1') {
        const afterReloadCounts = await chatStoreCounts(pageA2)
        console.log(
          `CHAT DIAGNOSTIC beforeReloadCounts=${JSON.stringify(beforeReloadCounts)}`
          + ` afterReloadCounts=${JSON.stringify(afterReloadCounts)}`,
        )
      }
      throw error
    }

    const fromA = `from-a-${tag}`
    await startConversation(pageA, usernameB)
    await send(pageA, fromA)
    await syncUntilLocatorVisible(pageB, pageB.getByText('1 message request'))
    await pageB.getByRole('button', { name: new RegExp(usernameA) }).click()
    await expect(messageBubble(pageB, fromA)).toBeVisible({ timeout: 30_000 })
    await pageB.getByRole('button', { name: 'Reject', exact: true }).click()
    await expect(messageBubble(pageB, fromA)).toHaveCount(0)

    const afterReject = `after-reject-${tag}`
    await send(pageA, afterReject)
    await syncUntilLocatorVisible(pageB, pageB.getByText('1 message request'))
    await pageB.getByRole('button', { name: new RegExp(usernameA) }).click()
    await expect(messageBubble(pageB, afterReject)).toBeVisible({ timeout: 30_000 })
    await pageB.getByRole('button', { name: 'Accept', exact: true }).click()
    await startConversation(pageA2, usernameB)
    await expect(messageBubble(pageA2, fromA)).toBeVisible({ timeout: 30_000 })
    await openChat(pageA2)
    await startConversation(pageA2, usernameB)
    await expect(messageBubble(pageA2, fromA)).toBeVisible({ timeout: 60_000 })

    await pageB.getByRole('button', { name: 'Block', exact: true }).click()
    const whileBlocked = `while-blocked-${tag}`
    const blockedAck = pageB.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/api/chat/messages/ack') &&
        response.ok(),
      { timeout: 30_000 },
    )
    await send(pageA, whileBlocked)
    await blockedAck
    await expect(messageBubble(pageB, whileBlocked)).toHaveCount(0)
    await pageB.getByRole('button', { name: 'Unblock', exact: true }).click()
    const afterUnblock = `after-unblock-${tag}`
    await send(pageA, afterUnblock)
    await syncUntilVisible(pageB, afterUnblock)

    const fromB = `from-b-${tag}`
    await send(pageB, fromB)
    await syncUntilVisible(pageA, fromB)

    // IndexedDB is the durable source of truth; a reload must not depend on
    // redelivery from the already-acked server mailbox.
    await openChat(pageA)
    await pageA.getByRole('button', { name: new RegExp(usernameB) }).click()
    await expect(messageBubble(pageA, fromA)).toBeVisible({ timeout: 60_000 })
    await expect(messageBubble(pageA, fromB)).toBeVisible({ timeout: 60_000 })

    await contextA.close()
    await contextA2.close()
    await contextB.close()
  })
})
