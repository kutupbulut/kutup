// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConversationRow } from './ConversationRow'

describe('ConversationRow', () => {
  it('exposes one current conversation with identity, preview, and metadata', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <ConversationRow
        active
        avatar={<span>A</span>}
        title="Alice"
        secondaryIdentity="alice@a.test"
        preview="Protected history is ready"
        meta="14:32"
        onClick={onClick}
      />,
    )

    const row = screen.getByRole('button', { name: /Alice/ })
    expect(row).toHaveAttribute('aria-current', 'page')
    expect(row).toHaveTextContent('alice@a.test')
    expect(row).toHaveTextContent('Protected history is ready')
    expect(row).toHaveTextContent('14:32')

    await user.click(row)
    expect(onClick).toHaveBeenCalledOnce()
  })
})
