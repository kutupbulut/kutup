import { Folder, MessageCircle, ShieldCheck, Trash2, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { KutupFacetDestination } from '@/components/KutupFacet'

export interface AppNavigationItem {
  id: 'files' | 'shared' | 'trash' | 'messages' | 'admin'
  to: string
  labelKey: string
  Icon: LucideIcon
  requiresChat?: boolean
  isActive: (pathname: string) => boolean
}

/**
 * Navigation is a product contract, not incidental page markup. Routes,
 * capability visibility, icons, and active matching live together so desktop
 * and future responsive navigation cannot quietly disagree.
 */
export const PRIMARY_NAVIGATION: readonly AppNavigationItem[] = [
  {
    id: 'files',
    to: '/drive',
    labelKey: 'nav.files',
    Icon: Folder,
    isActive: pathname => isFilesSubview(pathname, 'myfiles'),
  },
  {
    id: 'shared',
    to: '/drive/shared',
    labelKey: 'nav.sharedWithMe',
    Icon: Users,
    isActive: pathname => isFilesSubview(pathname, 'shared'),
  },
  {
    id: 'trash',
    to: '/drive/trash',
    labelKey: 'nav.trash',
    Icon: Trash2,
    isActive: pathname => isFilesSubview(pathname, 'trash'),
  },
  {
    id: 'messages',
    to: '/chat',
    labelKey: 'nav.messages',
    Icon: MessageCircle,
    requiresChat: true,
    isActive: pathname => pathname === '/chat' || pathname.startsWith('/chat/'),
  },
]

export const ADMIN_NAVIGATION: AppNavigationItem = {
  id: 'admin',
  to: '/admin',
  labelKey: 'nav.admin',
  Icon: ShieldCheck,
  isActive: pathname => pathname === '/admin' || pathname.startsWith('/admin/'),
}

export function visiblePrimaryNavigation(chatSupported: boolean): readonly AppNavigationItem[] {
  return PRIMARY_NAVIGATION.filter(item => !item.requiresChat || chatSupported)
}

export function activeWorkspaceForPath(pathname: string): KutupFacetDestination {
  if (pathname === '/chat' || pathname.startsWith('/chat/')) return 'messages'
  if (
    pathname === '/settings' ||
    pathname.startsWith('/settings/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/drive/account')
  ) {
    return 'account'
  }
  return 'files'
}

export function isFilesSubview(
  pathname: string,
  view: 'myfiles' | 'shared' | 'trash',
): boolean {
  if (view === 'shared') {
    return pathname === '/drive/shared' || pathname.startsWith('/drive/shared/')
  }
  if (view === 'trash') {
    return pathname === '/drive/trash' || pathname.startsWith('/drive/trash/')
  }
  return pathname === '/drive' || (
    pathname.startsWith('/drive/') &&
    !pathname.startsWith('/drive/shared') &&
    !pathname.startsWith('/drive/trash') &&
    !pathname.startsWith('/drive/account')
  )
}
