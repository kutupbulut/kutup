import { test, expect, type Page } from '@playwright/test'
import { signInOrBootstrap } from '../fixtures/auth'

// Drive rename + editor-navbar inline rename.
// The rename endpoint is E2EE-blind: the metadata blob is re-encrypted
// client-side and PUT to /files/:id. Backend only sees ciphertext.

async function enterMyFiles(page: Page) {
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
    await navigation.getByRole('link', { name: 'My Files', exact: true }).click()
    await expect(page).toHaveURL(/\/drive(?:\?.*)?$/)
}

async function createNote(page: Page, name: string) {
    const editorPromise = page.context().waitForEvent('page', { timeout: 30_000 })
    await page.getByRole('button', { name: 'New', exact: true }).click()
    await page.getByRole('menuitem', { name: /^Note/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('textbox').fill(name)
    await dialog.getByRole('button', { name: 'Create & open', exact: true }).click()

    const editor = await editorPromise
    await editor.waitForLoadState('domcontentloaded')
    await editor.close()
    await expect(page.locator('tr', { hasText: name }).first()).toBeVisible({ timeout: 15_000 })
}

test('drive: rename a note via the dropdown menu, name persists', async ({ context }) => {
    const page = await signInOrBootstrap(context)
    await enterMyFiles(page)

    const originalName = `rename-source-${Date.now()}.md`
    await createNote(page, originalName)
    const row = page.locator('tr', { hasText: originalName }).first()
    await expect(row).toBeVisible({ timeout: 10_000 })
    const newBase = `renamed-${Date.now()}`

    // Open the row's "..." dropdown menu and click Rename.
    await row.locator('button[aria-haspopup="menu"], button:has(svg)').last().click()
    await page.getByRole('menuitem', { name: 'Rename', exact: true }).click()

    // Dialog opens with the basename (extension is locked + shown grayed).
    const dialog = page.getByRole('dialog')
    const input = dialog.getByRole('textbox')
    await expect(input).toBeVisible()
    await input.fill(newBase)
    await dialog.getByRole('button', { name: 'Rename', exact: true }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    // Reload Drive and assert the server-backed encrypted metadata persists.
    await page.reload()
    await expect(page.locator('tr', { hasText: `${newBase}.md` }).first()).toBeVisible({ timeout: 15_000 })
})

test('editor: inline-rename a note from the navbar, name persists across reload', async ({ context }) => {
    const page = await signInOrBootstrap(context)
    await enterMyFiles(page)

    const originalName = `inline-source-${Date.now()}.md`
    await createNote(page, originalName)

    // Open the note created by this test in a new editor tab.
    const editorPromise = context.waitForEvent('page', { timeout: 30_000 })
    const noteRow = page.locator('tr', { hasText: originalName }).first()
    await expect(noteRow).toBeVisible()
    await noteRow.locator('td').nth(1).dblclick()
    const editor = await editorPromise
    await editor.waitForLoadState('domcontentloaded')

    // Click the filename in the navbar to enter edit mode. The
    // EditableFilename renders the basename inside a <button> while
    // unfocused; clicking it swaps to an <input> showing only the base
    // (the .md is locked alongside, grayed out).
    const navBtn = editor.locator('header button[title$=".md"]').first()
    await expect(navBtn).toHaveAttribute('title', originalName, { timeout: 15_000 })
    await navBtn.click()

    const newBase = `inline-${Date.now()}`
    const input = editor.locator('header input').first()
    await expect(input).toBeVisible()
    await input.fill(newBase)
    await editor.keyboard.press('Enter')
    await expect(editor.locator(`header button[title="${newBase}.md"]`).first()).toBeVisible({
        timeout: 15_000,
    })

    // Reload the editor page; navbar should show the new name.
    await editor.reload()
    await expect(editor.locator(`header button[title="${newBase}.md"]`).first()).toBeVisible({
        timeout: 15_000,
    })
})
