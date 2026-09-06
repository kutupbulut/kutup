// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import i18n from '@/i18n'
import { store } from '@/store'
import { logout, setAuth } from '@/store/authSlice'
import MobileAccountPage from './MobileAccountPage'
import MobileEncryptionKeysPage from './account/MobileEncryptionKeysPage'

vi.mock('@/hooks/useIsMobile', () => ({ useIsMobile: () => true }))
vi.mock('@/components/mobile/MobileBottomNav', () => ({ MobileBottomNav: () => null }))

function withApp(component: ReactNode) {
  return render(
    <Provider store={store}>
      <MemoryRouter>{component}</MemoryRouter>
    </Provider>,
  )
}

describe('mobile Account', () => {
  beforeEach(async () => {
    store.dispatch(logout())
    store.dispatch(setAuth({
      userId: 'mobile-user',
      email: 'mobile@kutup.test',
      username: 'mobile',
      accessToken: 'test-token',
      masterKey: new Uint8Array(32),
      privateKey: new Uint8Array(32),
      publicKey: 'test-public-key',
      isAdmin: false,
      storageQuotaBytes: 1_000,
      storageUsedBytes: 100,
    }))
    await i18n.changeLanguage('en')
  })

  it('shows only supported destinations and the full theme preference', () => {
    withApp(<MobileAccountPage />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Appearance' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('progressbar', { name: 'Storage' })).toHaveAttribute('aria-valuenow', '10')
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /upgrade/i })).not.toBeInTheDocument()
  })

  it('describes account recovery without claiming phrase viewing or rotation', () => {
    withApp(<MobileEncryptionKeysPage />)

    expect(screen.getByRole('button', { name: 'Recover an account' })).toBeInTheDocument()
    expect(screen.queryByText('View recovery phrase')).not.toBeInTheDocument()
    expect(screen.queryByText('Rotate recovery phrase')).not.toBeInTheDocument()
  })
})
