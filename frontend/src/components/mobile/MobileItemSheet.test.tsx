// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import i18n from '@/i18n'
import type { Collection } from '@/types/drive'
import { MobileItemSheet } from './MobileItemSheet'

const folder: Collection = {
  id: 'folder-1',
  ownerUserId: 'user-1',
  nameEnvelope: 'encrypted-name',
  keyEpoch: 1,
  nameRevision: 1,
  epochStatement: 'statement',
  epochStatementHash: 'hash',
  parentCollectionId: null,
  color: null,
  decryptedName: 'Project North',
}

describe('MobileItemSheet', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('wires owned-folder download, share, rename, and delete actions', () => {
    const onDownloadFolder = vi.fn()
    const onShare = vi.fn()
    render(
      <MobileItemSheet
        item={folder}
        onClose={vi.fn()}
        onDownloadFolder={onDownloadFolder}
        onShare={onShare}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Download as ZIP' }))
    expect(onDownloadFolder).toHaveBeenCalledWith(folder)
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move to Trash' })).toBeInTheDocument()
  })

  it('treats a remote folder as a removable share without owner actions', () => {
    render(
      <MobileItemSheet
        item={{ ...folder, isRemote: true, remoteShareId: 'remote-1' }}
        onClose={vi.fn()}
        onShare={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove share' })).toBeInTheDocument()
  })
})
