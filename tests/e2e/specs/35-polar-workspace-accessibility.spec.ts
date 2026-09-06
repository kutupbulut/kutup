import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { signInOrBootstrap } from '../fixtures/auth'

type ThemePreference = 'light' | 'dark' | 'system'

async function setTheme(page: Page, preference: ThemePreference) {
  await page.evaluate((value) => localStorage.setItem('kutup-theme', value), preference)
  await page.reload()
  await page.waitForLoadState('domcontentloaded')
}

async function setLanguage(page: Page, language: 'en' | 'tr') {
  await page.evaluate((value) => localStorage.setItem('kutup-lang', value), language)
  await page.reload()
  await page.waitForLoadState('domcontentloaded')
}

async function expectOneMainWithoutPageOverflow(page: Page) {
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )).toBe(true)
}

async function expectNoSeriousAxeViolations(page: Page, checkpoint: string) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const violations = result.violations.filter(({ impact }) =>
    impact === 'serious' || impact === 'critical')
  const diagnostics = violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    nodeCount: nodes.length,
  }))

  if (diagnostics.length > 0 && process.env.KUTUP_E2E_AXE_DIAGNOSTICS === '1') {
    console.log(`AXE DIAGNOSTIC checkpoint=${checkpoint} findings=${JSON.stringify(diagnostics)}`)
  }

  expect(
    diagnostics,
    `${checkpoint} contains serious or critical accessibility violations`,
  ).toEqual([])
}

test.describe('Polar Workspace responsive and accessibility gate', () => {
  test('authentication is accessible in both themes at phone and desktop widths', async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error('base URL is required')
    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await setTheme(page, 'dark')
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'phone-login-dark')

    await page.setViewportSize({ width: 430, height: 932 })
    await setLanguage(page, 'tr')
    await setTheme(page, 'light')
    await expect(page.getByRole('heading', { name: 'Giriş yap' })).toBeVisible()
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'phone-login-turkish-light')

    await page.setViewportSize({ width: 768, height: 1024 })
    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' })
    await setTheme(page, 'system')
    await expectOneMainWithoutPageOverflow(page)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' })
    await setLanguage(page, 'en')
    await setTheme(page, 'light')
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'desktop-login-light')

    for (const [path, heading, checkpoint] of [
      ['/register', /create account|registration disabled/i, 'desktop-register-light'],
      ['/recover', /recover account/i, 'desktop-recovery-light'],
      ['/server-select', /connect to your kutup server/i, 'desktop-server-select-light'],
    ] as const) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await expectOneMainWithoutPageOverflow(page)
      await expectNoSeriousAxeViolations(page, checkpoint)
    }

    await context.close()
  })

  test('authenticated workspaces survive responsive transitions and pass axe', async ({ context }) => {
    const page = await signInOrBootstrap(context)
    let collectionsRequests = 0
    page.on('request', request => {
      if (new URL(request.url()).pathname === '/api/collections/') collectionsRequests += 1
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/drive')
    await expect(page.getByTestId('app-sidebar')).toBeVisible()
    await expect(page.getByRole('heading', { name: /^files$/i })).toBeVisible()
    await expect(
      page.getByRole('navigation', { name: /folder path/i })
        .getByRole('button', { name: /my files/i }),
    ).toBeVisible()
    await setTheme(page, 'light')
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'desktop-files-light')
    const requestsBeforeResize = collectionsRequests

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page).toHaveURL(/\/drive$/)
    await expect(page.getByRole('navigation', { name: /primary navigation/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /my files/i })).toBeVisible()
    await expect.poll(() => collectionsRequests).toBe(requestsBeforeResize)
    await setTheme(page, 'dark')
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'phone-files-dark')

    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: /appearance/i })).toBeVisible()
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'phone-settings-dark')

    await page.setViewportSize({ width: 430, height: 932 })
    await page.goto('/drive/account')
    await expect(page.getByRole('heading', { name: /account/i })).toBeVisible()
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'phone-account-dark')

    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page).toHaveURL(/\/settings$/)
    await expect(page.getByTestId('app-sidebar')).toBeVisible()
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'compact-settings-dark')

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /admin overview/i })).toBeVisible()
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'desktop-admin-dark')

    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/chat')
    await expect(page.getByTestId('chat-sidebar-title')).toBeVisible()
    await expectOneMainWithoutPageOverflow(page)
    const deviceStatus = await page.getByTestId('chat-device-status').textContent()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByTestId('chat-device-status')).toHaveText(deviceStatus ?? '')
    await expect(page).toHaveURL(/\/chat$/)
    await expectOneMainWithoutPageOverflow(page)
    await expectNoSeriousAxeViolations(page, 'phone-messages-dark')
  })
})
