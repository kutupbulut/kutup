// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from '@/i18n'
import type { Collection, DecryptedFile } from '@/types/drive'
import DetailsPanel from './DetailsPanel'

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

const file: DecryptedFile = {
  id: 'file-1',
  collectionId: 'folder-1',
  metadataEnvelope: 'encrypted-metadata',
  fileKeyEnvelope: 'encrypted-key',
  keyEpoch: 1,
  metadataRevision: 1,
  encryptedSizeBytes: 2048,
  createdAt: '2026-08-20T12:00:00.000Z',
  decryptedName: 'Roadmap.pdf',
  decryptedMimeType: 'application/pdf',
  decryptedSize: 1024,
}

describe('DetailsPanel', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('presents file metadata in a complementary inspector and supports Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<DetailsPanel item={file} canDelete onClose={onClose} />)

    const inspector = screen.getByRole('complementary', { name: 'Details' })
    expect(inspector).toHaveFocus()
    expect(screen.getByText('Roadmap.pdf')).toBeInTheDocument()
    expect(screen.getByText('1.0 KB')).toBeInTheDocument()
    expect(screen.getByText('application/pdf')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('exposes folder actions and localized color controls', async () => {
    const user = userEvent.setup()
    const onColor = vi.fn()
    const onEnter = vi.fn()
    render(
      <DetailsPanel
        item={folder}
        canDelete
        onClose={vi.fn()}
        onColor={onColor}
        onEnter={onEnter}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Set folder color to Ice' }))
    expect(onColor).toHaveBeenCalledWith(folder, 'purple')

    await user.click(screen.getByRole('button', { name: 'Open folder' }))
    expect(onEnter).toHaveBeenCalledWith(folder)
  })
})
