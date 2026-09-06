// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from '@/i18n'
import { MobileFilesPage } from './MobileFilesPage'

function renderPage(overrides: Partial<Parameters<typeof MobileFilesPage>[0]> = {}) {
  const props: Parameters<typeof MobileFilesPage>[0] = {
    folders: [],
    files: [],
    currentFolder: null,
    isAtRoot: true,
    viewMode: 'myfiles',
    usedBytes: 10,
    quotaBytes: 100,
    canCreate: true,
    onOpenFolder: vi.fn(),
    onOpenFile: vi.fn(),
    onBack: vi.fn(),
    onViewModeChange: vi.fn(),
    onOpenTrash: vi.fn(),
    onItemMore: vi.fn(),
    onUploadFiles: vi.fn(),
    onUploadFolder: vi.fn(),
    onNewFolder: vi.fn(),
    onNewNote: vi.fn(),
    onNewWhiteboard: vi.fn(),
    onPasteEncryptedLink: vi.fn(),
    ...overrides,
  }

  return { props, ...render(<MobileFilesPage {...props} />) }
}

describe('MobileFilesPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('keeps My files, Shared with me, and Trash inside the Files workspace', async () => {
    const user = userEvent.setup()
    const { props } = renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Files' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Files views' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'My Files' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Shared with me' }))
    expect(props.onViewModeChange).toHaveBeenCalledWith('shared')

    await user.click(screen.getByRole('button', { name: 'Trash' }))
    expect(props.onOpenTrash).toHaveBeenCalledOnce()
  })

  it('does not expose create actions in a read-only shared view', () => {
    renderPage({ viewMode: 'shared', canCreate: false })

    expect(screen.queryByRole('button', { name: 'Add to Kutup' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Nothing shared yet')
    expect(screen.queryByText(/categories|Recent|Photos/)).not.toBeInTheDocument()
  })

  it('keeps item open and overflow actions as sibling controls', () => {
    const { container } = renderPage({
      folders: [{ id: 'folder-1', decryptedName: 'Projects', color: null } as never],
      files: [{ id: 'file-1', decryptedName: 'Notes.md', createdAt: new Date().toISOString() } as never],
    })

    expect(screen.getByRole('button', { name: 'Open folder Projects' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open file Notes.md' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'More actions' })).toHaveLength(2)
    expect(container.querySelector('[role="button"] button, button button')).toBeNull()
  })
})
