// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import i18n from '@/i18n'
import api from '@/api/client'
import PublicShare from './PublicShare'

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
}))

vi.mock('@/crypto', () => ({
  decryptStream: vi.fn(),
  fromBase64: vi.fn(() => new Uint8Array(32)),
  openPublicLinkCollectionKeyV1: vi.fn().mockResolvedValue(new Uint8Array(32)),
  openFileRecordV1: vi.fn().mockResolvedValue({
    fileKey: new Uint8Array(32),
    metadata: { name: 'Strategy.pdf', mimeType: 'application/pdf', size: 1_024 },
  }),
}))

describe('PublicShare', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('en')
    window.history.replaceState({}, '', '/s/demo#key=test-key')
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/share/demo') {
        return { data: {
          targetId: 'collection-1',
          ownerUserId: 'owner-1',
          collectionKeyEpoch: 1,
          collectionKeyEnvelope: 'envelope',
        } } as never
      }
      if (url === '/share/demo/files') {
        return { data: [{
          id: 'file-1',
          collectionId: 'collection-1',
          metadataEnvelope: 'metadata',
          fileKeyEnvelope: 'file-key',
          keyEpoch: 1,
          metadataRevision: 1,
          encryptedSizeBytes: 1_128,
          createdAt: '2026-08-20T12:00:00.000Z',
        }] } as never
      }
      throw new Error(`Unexpected URL: ${url}`)
    })
  })

  it('uses branded public chrome, explicit theming, and a responsive decrypted file list', async () => {
    render(
      <MemoryRouter initialEntries={['/s/demo']}>
        <Routes>
          <Route path="/s/:token" element={<PublicShare />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Strategy.pdf')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Shared with you' })).toBeInTheDocument()
    expect(screen.getByText('1.0 KB')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Appearance' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled()
  })
})
