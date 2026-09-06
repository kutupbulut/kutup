// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from '@/i18n'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('provides one explicit upload action for writable folders', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<EmptyState canUpload onClick={onClick} />)

    expect(screen.getByRole('heading', { name: 'This folder is empty' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Upload files' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('explains read-only empty folders without exposing a dead action', () => {
    render(<EmptyState canUpload={false} onClick={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'No files in this folder' })).toBeInTheDocument()
    expect(screen.getByText('This shared folder is read-only.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
