// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import i18n from '@/i18n'
import { store } from '@/store'
import { logout, setAuth } from '@/store/authSlice'
import Admin from './Admin'

vi.mock('@/api/hooks/useAdmin', () => ({
  useAdminUsers: () => ({ data: [], isLoading: false }),
  useAdminStats: () => ({ data: undefined, isLoading: false }),
}))

vi.mock('@/components/admin/AdminOverviewTab', () => ({
  AdminOverviewTab: () => <div data-testid="admin-overview">Overview content</div>,
}))
vi.mock('@/components/admin/AdminUsersTab', () => ({
  AdminUsersTab: () => <div data-testid="admin-users">Users content</div>,
}))
vi.mock('@/components/admin/AdminSettingsTab', () => ({
  AdminSettingsTab: () => <div data-testid="admin-settings">Settings content</div>,
}))
vi.mock('@/components/admin/AdminCreateUserDialog', () => ({
  AdminCreateUserDialog: () => null,
}))

function renderAdmin(initialEntry = '/admin') {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/admin/:section?" element={<Admin />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('Admin', () => {
  beforeEach(async () => {
    store.dispatch(logout())
    store.dispatch(setAuth({
      userId: 'admin-user',
      email: 'admin@kutup.test',
      username: 'admin',
      accessToken: 'test-token',
      masterKey: new Uint8Array(32),
      privateKey: new Uint8Array(32),
      publicKey: 'test-public-key',
      isAdmin: true,
      storageQuotaBytes: 10_000,
      storageUsedBytes: 2_500,
    }))
    await i18n.changeLanguage('en')
  })

  it('uses one dedicated administration sidebar and switches durable sections', async () => {
    const user = userEvent.setup()
    renderAdmin()

    expect(screen.getAllByRole('complementary')).toHaveLength(1)
    const adminNavigation = screen.getByRole('navigation', { name: 'Admin' })
    expect(adminNavigation).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Admin Overview' })).toBeInTheDocument()
    expect(screen.getByTestId('admin-overview')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Users' }))
    expect(screen.getByRole('button', { name: 'Users' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 2, name: 'Users' })).toBeInTheDocument()
    expect(screen.getByTestId('admin-users')).toBeInTheDocument()
  })

  it('opens a durable Admin section URL directly', () => {
    renderAdmin('/admin/settings')

    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 2, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByTestId('admin-settings')).toBeInTheDocument()
  })
})
