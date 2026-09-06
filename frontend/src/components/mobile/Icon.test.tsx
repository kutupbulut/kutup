// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Icon, ICONS } from './Icon'

describe('mobile Icon compatibility adapter', () => {
  it('renders known compatibility icons through Lucide', () => {
    const { container } = render(<Icon d={ICONS.folder} size={20} />)

    expect(container.querySelector('svg')).toHaveClass('lucide-folder')
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps a path fallback for a remaining one-off compatibility glyph', () => {
    const path = 'M5 13l4 4L19 7'
    const { container } = render(<Icon d={path} />)

    expect(container.querySelector('path')).toHaveAttribute('d', path)
  })
})
