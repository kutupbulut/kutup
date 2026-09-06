import { describe, expect, it } from 'vitest'

import { ADMIN_SECTIONS, adminSectionPath, parseAdminSection } from './navigation'

describe('admin section navigation', () => {
  it('declares durable paths for every local section', () => {
    expect(ADMIN_SECTIONS.map(item => [item.id, item.path])).toEqual([
      ['overview', '/admin'],
      ['users', '/admin/users'],
      ['settings', '/admin/settings'],
    ])
    expect(adminSectionPath('settings')).toBe('/admin/settings')
  })

  it('defaults the index to overview and rejects unknown sections', () => {
    expect(parseAdminSection(undefined)).toBe('overview')
    expect(parseAdminSection('users')).toBe('users')
    expect(parseAdminSection('unknown')).toBeNull()
  })
})
