// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from '@/i18n'
import type { Collection } from '@/types/drive'
import CollectionGrid from './CollectionGrid'

const folder: Collection = {
  id: 'folder-1',
  ownerUserId: 'user-1',
  nameEnvelope: 'encrypted-name',
  ownerKeyEnvelope: 'encrypted-key',
  keyEpoch: 1,
  nameRevision: 1,
  epochStatement: 'statement',
  epochStatementHash: 'hash',
  parentCollectionId: null,
  color: null,
  decryptedName: 'Project North',
}

function renderGrid() {
  const onEnter = vi.fn()
  const onToggleSelect = vi.fn()
  render(
    <CollectionGrid
      collections={[folder]}
      currentUserId="user-1"
      selectedIds={new Set()}
      onEnter={onEnter}
      onDetails={vi.fn()}
      onToggleSelect={onToggleSelect}
      onRename={vi.fn()}
      onColor={vi.fn()}
      onShare={vi.fn()}
      onPublicLink={vi.fn()}
      onDelete={vi.fn()}
      onRevoke={vi.fn()}
      onUploadTo={vi.fn()}
      onDrop={vi.fn()}
    />,
  )
  return { onEnter, onToggleSelect }
}

describe('CollectionGrid', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('exposes separate keyboard controls for opening, selecting, and folder actions', async () => {
    const user = userEvent.setup()
    const { onEnter, onToggleSelect } = renderGrid()

    await user.click(screen.getByRole('button', { name: 'Open folder Project North' }))
    expect(onEnter).toHaveBeenCalledWith(folder)

    await user.click(screen.getByRole('checkbox', { name: 'Select folder Project North' }))
    expect(onToggleSelect).toHaveBeenCalledWith('folder-1')

    expect(screen.getByRole('button', { name: 'Actions for folder Project North' })).toBeInTheDocument()
  })
})
