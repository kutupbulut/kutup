// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import i18n from '@/i18n'
import { MobileBottomNav } from './MobileBottomNav'

vi.mock('@/chat/capabilities', () => ({
  useChatCapabilities: () => ({ data: { enabled: true } }),
  isSupportedChat: () => true,
}))

describe('MobileBottomNav', () => {
  it('contains only Files, Messages, and Account primary destinations', async () => {
    await i18n.changeLanguage('en')
    render(
      <MemoryRouter initialEntries={['/drive/shared']}>
        <MobileBottomNav />
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    const links = Array.from(navigation.querySelectorAll('a'))

    expect(links).toHaveLength(3)
    expect(links.map(link => link.textContent)).toEqual(['Files', 'Messages', 'Account'])
    expect(screen.getByRole('link', { name: 'Files' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Shared' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Trash' })).not.toBeInTheDocument()
  })

  it('keeps the full Settings route inside Account navigation', async () => {
    await i18n.changeLanguage('en')
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <MobileBottomNav />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute('aria-current', 'page')
  })
})
