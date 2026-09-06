// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from '@/i18n'
import type { DecryptedFile } from '@/types/drive'
import FileTable, { formatModified } from './FileTable'

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

function renderTable() {
  const onSelect = vi.fn()
  const onToggleSelect = vi.fn()
  render(
    <FileTable
      files={[file]}
      canDelete
      selectedIds={new Set()}
      onSelect={onSelect}
      onToggleSelect={onToggleSelect}
      onToggleSelectAll={vi.fn()}
      onDownload={vi.fn()}
      onDelete={vi.fn()}
      onDetails={vi.fn()}
      onRename={vi.fn()}
    />,
  )
  return { onSelect, onToggleSelect }
}

describe('FileTable', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('announces sort state and exposes distinct open, select, and action controls', async () => {
    const user = userEvent.setup()
    const { onSelect, onToggleSelect } = renderTable()

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )

    await user.click(screen.getByRole('button', { name: 'Open file Roadmap.pdf' }))
    expect(onSelect).toHaveBeenCalledWith(file)

    await user.click(screen.getByRole('checkbox', { name: 'Select file Roadmap.pdf' }))
    expect(onToggleSelect).toHaveBeenCalledWith('file-1')

    expect(screen.getByRole('button', { name: 'Actions for file Roadmap.pdf' })).toBeInTheDocument()
  })

  it('shows an unambiguous modified date through minutes', () => {
    renderTable()

    const timestamp = document.querySelector('time')
    expect(timestamp).toHaveAttribute('datetime', file.createdAt)
    expect(timestamp).toHaveTextContent(formatModified(file.createdAt))
    expect(formatModified(file.createdAt, 'en-US')).toMatch(/Aug 20, 2026.*\d{1,2}:00\s[AP]M/)
  })
})
