// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from '@/i18n'
import { ThemeSelector } from './ThemeSelector'

describe('ThemeSelector', () => {
  beforeEach(async () => {
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.style.colorScheme = ''
    await i18n.changeLanguage('en')
  })

  it('exposes and persists light, dark, and system preferences', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    const light = screen.getByRole('radio', { name: 'Light' })
    const dark = screen.getByRole('radio', { name: 'Dark' })
    const system = screen.getByRole('radio', { name: 'System' })

    expect(system).toHaveAttribute('aria-checked', 'true')

    await user.click(dark)
    expect(localStorage.getItem('kutup-theme')).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(dark).toHaveAttribute('aria-checked', 'true')

    await user.click(light)
    expect(localStorage.getItem('kutup-theme')).toBe('light')
    expect(document.documentElement).toHaveClass('light')
    expect(light).toHaveAttribute('aria-checked', 'true')

    await user.click(system)
    expect(localStorage.getItem('kutup-theme')).toBe('system')
    expect(system).toHaveAttribute('aria-checked', 'true')
  })

  it('supports radiogroup arrow-key navigation', async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    const system = screen.getByRole('radio', { name: 'System' })
    system.focus()
    await user.keyboard('{ArrowRight}')

    const light = screen.getByRole('radio', { name: 'Light' })
    expect(light).toHaveFocus()
    expect(light).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{End}')
    expect(system).toHaveFocus()
    expect(system).toHaveAttribute('aria-checked', 'true')
  })
})
