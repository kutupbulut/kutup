import { describe, expect, it } from 'vitest'

import {
  ADMIN_NAVIGATION,
  activeWorkspaceForPath,
  isFilesSubview,
  visiblePrimaryNavigation,
} from './navigation'

describe('workspace route navigation', () => {
  it.each([
    ['/drive', 'files'],
    ['/drive/shared', 'files'],
    ['/drive/trash', 'files'],
    ['/chat', 'messages'],
    ['/settings', 'account'],
    ['/admin', 'account'],
    ['/drive/account/security', 'account'],
  ] as const)('maps %s to %s', (path, workspace) => {
    expect(activeWorkspaceForPath(path)).toBe(workspace)
  })

  it('distinguishes contextual file views from the main Files route', () => {
    expect(isFilesSubview('/drive/shared', 'shared')).toBe(true)
    expect(isFilesSubview('/drive/shared', 'myfiles')).toBe(false)
    expect(isFilesSubview('/drive/trash', 'trash')).toBe(true)
    expect(isFilesSubview('/drive/trash', 'myfiles')).toBe(false)
    expect(isFilesSubview('/drive', 'myfiles')).toBe(true)
  })

  it('declares capability-aware primary destinations in one model', () => {
    expect(visiblePrimaryNavigation(true).map(item => item.id)).toEqual([
      'files',
      'shared',
      'trash',
      'messages',
    ])
    expect(visiblePrimaryNavigation(false).map(item => item.id)).toEqual([
      'files',
      'shared',
      'trash',
    ])
    expect(ADMIN_NAVIGATION.isActive('/admin/users')).toBe(true)
  })
})
