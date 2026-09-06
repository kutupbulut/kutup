// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'

import i18n from '@/i18n'
import DriveTopBar from './DriveTopBar'

function renderTopBar(overrides: Partial<ComponentProps<typeof DriveTopBar>> = {}) {
  const props: ComponentProps<typeof DriveTopBar> = {
    searchValue: '',
    onSearchChange: vi.fn(),
    canUpload: true,
    onShowHelp: vi.fn(),
    onUpload: vi.fn(),
    onUploadFolder: vi.fn(),
    onNewFolder: vi.fn(),
    onNewNote: vi.fn(),
    onNewOffice: vi.fn(),
    onAddRemote: vi.fn(),
    newMenuOpen: false,
    onNewMenuOpenChange: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<DriveTopBar {...props} />) }
}

describe('DriveTopBar', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('exposes Files, folder-scoped search, creation, upload, and help actions', () => {
    renderTopBar()

    expect(screen.getByRole('heading', { level: 1, name: 'Files' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search the current folder' })).toHaveAttribute(
      'placeholder',
      'Search this folder…',
    )
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument()
    expect(screen.getByTestId('upload-folder-button')).toHaveAccessibleName('Upload folder')
    expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
  })

  it('updates search and hides upload actions in read-only folders', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    renderTopBar({ canUpload: false, onSearchChange })

    await user.type(screen.getByRole('searchbox', { name: 'Search the current folder' }), 'plan')

    expect(onSearchChange).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('upload-folder-button')).not.toBeInTheDocument()
  })

  it('replaces search and creation with contextual selection actions', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    const onDelete = vi.fn()
    renderTopBar({
      selection: {
        totalCount: 3,
        fileCount: 2,
        folderCount: 1,
        onClear,
        onDelete,
        onDownloadFiles: vi.fn(),
        onDownloadFolders: vi.fn(),
      },
    })

    expect(screen.getByRole('status')).toHaveTextContent('3 items selected')
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'New' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download 2 files' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download folder as ZIP' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Move to Trash' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onClear).toHaveBeenCalledOnce()
  })
})
