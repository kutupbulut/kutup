// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import i18n from '@/i18n'
import { store } from '@/store'
import { logout, setAuth } from '@/store/authSlice'
import { AppSidebar } from './AppSidebar'

const chatSupport = vi.hoisted(() => ({ enabled: true }))

vi.mock('@/chat/capabilities', () => ({
  useChatCapabilities: () => ({ data: { enabled: chatSupport.enabled } }),
  isSupportedChat: () => chatSupport.enabled,
}))

function renderSidebar(pathname: string) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[pathname]}>
        <AppSidebar />
      </MemoryRouter>
    </Provider>,
  )
}

describe('AppSidebar', () => {
  beforeEach(async () => {
    store.dispatch(logout())
    store.dispatch(setAuth({
      userId: 'test-user',
      email: 'person@kutup.test',
      username: 'person',
      accessToken: 'test-token',
      masterKey: new Uint8Array(32),
      privateKey: new Uint8Array(32),
      publicKey: 'test-public-key',
      isAdmin: true,
      storageQuotaBytes: 10_000,
      storageUsedBytes: 2_500,
    }))
    chatSupport.enabled = true
    localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('keeps Files, file views, and Messages in one calm destination list', () => {
    renderSidebar('/drive/shared')

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    const files = within(navigation).getByRole('link', { name: 'Files' })
    const shared = within(navigation).getByRole('link', { name: 'Shared with me' })

    expect(files).not.toHaveAttribute('aria-current')
    expect(shared).toHaveAttribute('aria-current', 'page')
    expect(within(navigation).getByRole('link', { name: 'Messages' })).toHaveAttribute('href', '/chat')
    expect(within(navigation).getByRole('link', { name: 'Trash' })).toHaveAttribute(
      'href',
      '/drive/trash',
    )
    expect(within(navigation).queryByText('Workspace')).not.toBeInTheDocument()
    expect(navigation.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  })

  it('links authorized users to the dedicated administration surface', () => {
    renderSidebar('/drive')

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(navigation).queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
  })

  it('gives storage usage a durable accessible name', () => {
    renderSidebar('/drive')

    expect(screen.getByRole('progressbar', { name: 'Storage' })).toHaveAttribute(
      'aria-valuenow',
      '25',
    )
    expect(screen.queryByText('Storage')).not.toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('groups identity and appearance controls in the sidebar footer', () => {
    renderSidebar('/drive')

    expect(screen.getByTestId('sidebar-account-menu')).toHaveTextContent('person')
    const preferences = screen.getByTestId('sidebar-preferences')
    expect(
      within(preferences).getByRole('button', { name: 'Switch language to TR' }),
    ).toBeInTheDocument()
    expect(
      within(preferences).getByRole('radiogroup', { name: 'Appearance' }),
    ).toBeInTheDocument()
  })

  it('omits Messages when the server does not expose a supported Chat capability', () => {
    chatSupport.enabled = false
    renderSidebar('/drive')

    expect(screen.queryByRole('link', { name: 'Messages' })).not.toBeInTheDocument()
  })
})
