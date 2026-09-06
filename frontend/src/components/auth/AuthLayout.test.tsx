// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import i18n from '@/i18n'
import { AuthLayout } from './AuthLayout'

describe('AuthLayout', () => {
  beforeEach(async () => {
    localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('provides a focused card with brand, explicit theme choice, and form content', () => {
    render(
      <MemoryRouter>
        <AuthLayout>
          <form aria-label="Example form" />
        </AuthLayout>
      </MemoryRouter>,
    )

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kutup' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('radiogroup', { name: 'Appearance' })).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Example form' })).toBeInTheDocument()
    expect(screen.getByTestId('auth-card')).toContainElement(
      screen.getByRole('form', { name: 'Example form' }),
    )
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
