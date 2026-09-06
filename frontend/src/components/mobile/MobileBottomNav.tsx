import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon, ICONS, type IconName } from '@/components/mobile/Icon'
import { cn } from '@/lib/utils'
import { isSupportedChat, useChatCapabilities } from '@/chat/capabilities'

/**
 * MobileBottomNav — the three primary workspace destinations anchored to the
 * bottom of the viewport. Shared with me and Trash stay inside Files rather
 * than competing with Files and Messages as global destinations.
 *
 * Tabs are route-driven (active state via `useLocation()`). Each tab supports
 * an optional badge (red dot with count, e.g. for Shared invitations or Trash
 * item count).
 *
 * The translucent surface and safe-area padding keep labels clear of mobile
 * browser and operating-system controls.
 */

export interface BottomNavTab {
  id: 'files' | 'chat' | 'account'
  to: string
  icon: IconName
  label: string
  badge?: number | null
}

interface MobileBottomNavProps {
  /** Override the badge map (e.g. inject Trash item count). */
  badges?: Partial<Record<BottomNavTab['id'], number | null>>
}

export function MobileBottomNav({ badges }: MobileBottomNavProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const chatCapabilities = useChatCapabilities()

  const tabs: BottomNavTab[] = [
    { id: 'files', to: '/drive', icon: 'folder', label: t('nav.files', 'Files') },
    ...(isSupportedChat(chatCapabilities.data)
      ? [{ id: 'chat' as const, to: '/chat', icon: 'message' as const, label: t('nav.messages') }]
      : []),
    { id: 'account', to: '/drive/account', icon: 'user', label: t('nav.account', 'Account') },
  ]

  return (
    <nav
      aria-label={t('nav.primary', 'Primary navigation')}
      className={cn(
        'fixed inset-x-0 bottom-0 z-30',
        'bg-surface/95 border-t border-border-light',
        'backdrop-blur-xl backdrop-saturate-150',
        'pb-safe',
      )}
    >
      <div
        className="grid pt-1.5 pb-1.5 px-1"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
      >
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab)
          const badge = badges?.[tab.id] ?? tab.badge
          return (
            <Link
              key={tab.id}
              to={tab.to}
              replace
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-tap',
                'transition-colors no-underline',
                active ? 'text-primary' : 'text-text-tertiary',
              )}
            >
              <div className="relative">
                <Icon
                  d={ICONS[tab.icon]}
                  size={22}
                  strokeWidth={active ? 2 : 1.7}
                />
                {badge != null && badge > 0 && (
                  <div
                    className={cn(
                      'absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-lg',
                      'bg-destructive text-white text-[10px] font-bold',
                      'flex items-center justify-center border-[1.5px] border-surface',
                    )}
                  >
                    {badge > 99 ? '99+' : badge}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  'text-[10.5px] tracking-[-0.1px]',
                  active ? 'font-semibold' : 'font-medium',
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function isTabActive(pathname: string, tab: BottomNavTab): boolean {
  // Shared and Trash are Files views, so Files owns every /drive route except
  // the Account subtree. The other destinations claim their exact prefix.
  if (tab.id === 'files') {
    return pathname === '/drive' ||
      (pathname.startsWith('/drive/') && !pathname.startsWith('/drive/account'))
  }
  if (tab.id === 'account' && pathname === '/settings') return true
  return pathname === tab.to || pathname.startsWith(tab.to + '/')
}
