import { Activity, Settings, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AdminSectionId = 'overview' | 'users' | 'settings'

export interface AdminSection {
  id: AdminSectionId
  path: string
  labelKey: string
  fallbackLabel: string
  Icon: LucideIcon
}

/** The local information architecture behind the global Admin destination. */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
  {
    id: 'overview',
    path: '/admin',
    labelKey: 'mobile.admin.tabs.overview',
    fallbackLabel: 'Overview',
    Icon: Activity,
  },
  {
    id: 'users',
    path: '/admin/users',
    labelKey: 'mobile.admin.tabs.users',
    fallbackLabel: 'Users',
    Icon: Users,
  },
  {
    id: 'settings',
    path: '/admin/settings',
    labelKey: 'mobile.admin.tabs.settings',
    fallbackLabel: 'Settings',
    Icon: Settings,
  },
]

export function parseAdminSection(section: string | undefined): AdminSectionId | null {
  if (section == null || section === '') return 'overview'
  return ADMIN_SECTIONS.some(item => item.id === section)
    ? section as AdminSectionId
    : null
}

export function adminSectionPath(section: AdminSectionId): string {
  return ADMIN_SECTIONS.find(item => item.id === section)?.path ?? '/admin'
}
