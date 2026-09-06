// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { KutupFacet } from './KutupFacet'

describe('KutupFacet', () => {
  it('is decorative by default', () => {
    render(<KutupFacet active="messages" />)
    expect(screen.getByTestId('kutup-facet')).toHaveAttribute('aria-hidden', 'true')
    expect(document.querySelector('[data-facet="messages"]')).not.toHaveClass('opacity-20')
    expect(document.querySelector('[data-facet="files"]')).toHaveClass('opacity-20')
  })

  it('accepts an accessible label when the mark conveys meaning', () => {
    render(<KutupFacet label="Kutup protected workspace" />)
    expect(screen.getByRole('img', { name: 'Kutup protected workspace' })).toBeInTheDocument()
  })
})
