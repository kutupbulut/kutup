import type { LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { isSupportedChat, useChatCapabilities } from '@/chat/capabilities'
import { KutupLogo } from '@/components/KutupLogo'
import { ThemeSelector } from '@/components/theme/ThemeSelector'
import { Progress } from '@/components/ui/progress'
import { useAppSelector } from '@/store'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  ADMIN_NAVIGATION,
  visiblePrimaryNavigation,
} from './navigation'
import { SidebarAccountMenu } from './SidebarAccountMenu'
import { SidebarLocaleToggle } from './SidebarLocaleToggle'

interface NavLinkProps {
  active: boolean
  current?: 'location' | 'page'
  icon: LucideIcon
  label: string
  to: string
}

function AppNavLink({ active, current, icon: Icon, label, to }: NavLinkProps) {
  return (
    <Link
      to={to}
      aria-current={current}
      className={cn(
        'group relative flex min-h-10 items-center gap-3 rounded-md py-2 pl-4 pr-3 text-sm font-medium no-underline',
        'transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary'
          : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  )
}

export function AppSidebar() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const auth = useAppSelector(state => state.auth)
  const chatCapabilities = useChatCapabilities()
  const primaryNavigation = visiblePrimaryNavigation(isSupportedChat(chatCapabilities.data))
  const quotaPercent = auth.storageQuotaBytes > 0
    ? Math.min(Math.round((auth.storageUsedBytes / auth.storageQuotaBytes) * 100), 100)
    : 0
  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground"
      data-testid="app-sidebar"
    >
      <div className="flex h-14 items-center gap-2.5 px-5">
        <KutupLogo size={25} />
        <span className="font-display text-base font-bold tracking-[-0.025em]">Kutup</span>
      </div>

      <nav aria-label={t('nav.primary')} className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-0.5">
          {primaryNavigation.map(item => {
            const active = item.isActive(pathname)
            return (
            <AppNavLink
              key={item.id}
              to={item.to}
              icon={item.Icon}
              label={t(item.labelKey)}
              active={active}
              current={active ? 'page' : undefined}
            />
            )
          })}
        </div>

      </nav>

      <div className="px-4 pb-3">
        <p className="mb-2 flex items-center text-xs text-sidebar-muted">
          <span>{formatBytes(auth.storageUsedBytes)} / {formatBytes(auth.storageQuotaBytes)}</span>
          <span className="ml-auto font-mono text-[0.68rem]">{quotaPercent}%</span>
        </p>
        <Progress
          value={quotaPercent}
          className="h-2 bg-sidebar-accent"
          aria-label={t('settings.account.storage')}
        />
      </div>

      <div className="space-y-2 border-t border-sidebar-border p-3">
        {auth.isAdmin && (
          <AppNavLink
            to={ADMIN_NAVIGATION.to}
            icon={ADMIN_NAVIGATION.Icon}
            label={t(ADMIN_NAVIGATION.labelKey)}
            active={ADMIN_NAVIGATION.isActive(pathname)}
            current={ADMIN_NAVIGATION.isActive(pathname) ? 'page' : undefined}
          />
        )}
        <div className="pl-1">
          <SidebarAccountMenu />
        </div>
        <div className="flex items-center gap-1.5 pl-1" data-testid="sidebar-preferences">
          <SidebarLocaleToggle />
          <ThemeSelector compact tone="sidebar" />
        </div>
      </div>
    </aside>
  )
}
