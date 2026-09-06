// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import i18n from '@/i18n'
import { store } from '@/store'
import { logout, setAuth } from '@/store/authSlice'
import Settings from './Settings'

vi.mock('@/api/collab', () => ({
  listDevices: vi.fn().mockResolvedValue([]),
  revokeDevice: vi.fn(),
}))
vi.mock('@/components/mobile/MobileBottomNav', () => ({ MobileBottomNav: () => null }))

describe('Settings', () => {
  beforeEach(async () => {
    store.dispatch(logout())
    store.dispatch(setAuth({
      userId: 'settings-user',
      email: 'polar@kutup.test',
      username: 'polar',
      accessToken: 'test-token',
      masterKey: new Uint8Array(32),
      privateKey: new Uint8Array(32),
      publicKey: 'test-public-key',
      isAdmin: false,
      storageQuotaBytes: 1_000,
      storageUsedBytes: 250,
    }))
    await i18n.changeLanguage('en')
  })

  it('groups real account controls and exposes an explicit three-state theme preference', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      </Provider>,
    )

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Account' })).toBeInTheDocument()
    expect(screen.getByText('polar@kutup.test')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Storage' })).toHaveAttribute(
      'aria-valuenow',
      '25',
    )
    expect(screen.getByText('No presence color selected')).toHaveClass('sr-only')
    expect(screen.getByRole('radiogroup', { name: 'Appearance' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: /upgrade/i })).not.toBeInTheDocument()
    expect(await screen.findByText('No devices yet.')).toBeInTheDocument()
  })
})
