import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Icon, ICONS, type IconName } from '@/components/mobile/Icon'
import { KutupLogo } from '@/components/KutupLogo'
import { useAppDispatch, useAppSelector } from '@/store'
import { logout } from '@/store/authSlice'
import { useTheme } from '@/hooks/useTheme'
import { broadcastLogout } from '@/lib/sessionSync'
import * as sessionVault from '@/lib/sessionVault'
import { cn } from '@/lib/utils'

/** Dedicated desktop navigation for the administration surface. */
export type AdminTab = 'overview' | 'users' | 'settings'

interface AdminSidebarProps {
  tab: AdminTab
  onTab: (tab: AdminTab) => void
}

export function AdminSidebar({ tab, onTab }: AdminSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)
  const [theme, toggleTheme] = useTheme()
  const isDark = theme === 'dark'

  const username = auth.username ?? auth.email ?? ''
  const email = auth.email ?? ''
  const initial = (username || '?').slice(0, 1).toUpperCase()

  async function handleLogout() {
    broadcastLogout()
    try {
      await sessionVault.clear()
    } catch {
      // Session storage cleanup is best-effort; local logout must still finish.
    }
    dispatch(logout())
    navigate('/login')
  }

  return (
    <aside
      className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-surface-sunken"
      aria-label={t('admin.page.title', 'Administration')}
    >
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <KutupLogo size={26} />
        <span className="text-[17px] font-bold tracking-[-0.3px] text-primary">Kutup</span>
      </div>
      <div className="mx-3 mb-2 h-px bg-border-light" />

      <nav className="flex flex-col gap-0.5 px-2" aria-label={t('navigation.workspace', 'Workspace')}>
        <NavRow
          icon="folder"
          label={t('admin.sidebar.drive', '← Drive')}
          onClick={() => navigate('/drive')}
        />
      </nav>

      <nav
        className="px-2 pb-1.5 pt-3.5"
        aria-label={t('admin.sidebar.adminSection', 'Admin')}
      >
        <div className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          {t('admin.sidebar.adminSection', 'Admin')}
        </div>
        <div className="flex flex-col gap-0.5">
          <NavRow
            icon="activity"
            label={t('mobile.admin.tabs.overview', 'Overview')}
            active={tab === 'overview'}
            onClick={() => onTab('overview')}
          />
          <NavRow
            icon="users"
            label={t('mobile.admin.tabs.users', 'Users')}
            active={tab === 'users'}
            onClick={() => onTab('users')}
          />
          <NavRow
            icon="settings"
            label={t('mobile.admin.tabs.settings', 'Settings')}
            active={tab === 'settings'}
            onClick={() => onTab('settings')}
          />
        </div>
      </nav>

      <div className="flex-1" />

      <div className="px-2">
        {!auth.totpEnabled && (
          <button
            type="button"
            onClick={() => navigate('/drive/account/security/totp-setup')}
            className="mb-2 flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius)] border border-border-light bg-primary-faint px-3 py-2.5 text-left transition-colors hover:bg-primary-faint/80"
          >
            <Icon d={ICONS.shield} size={16} color="var(--primary)" />
            <div className="min-w-0">
              <div className="truncate text-[11.5px] font-semibold text-primary">
                {t('admin.sidebar.signedInAs', 'Signed in as admin')}
              </div>
              <div className="mt-px truncate text-[10.5px] text-text-tertiary">
                {t('admin.sidebar.totpOff', '2FA off · enable now')}
              </div>
            </div>
          </button>
        )}

        <div className="flex items-center">
          <div className="flex-1">
            <NavRow
              icon="logout"
              label={t('mobile.account.signOut', 'Sign out')}
              onClick={handleLogout}
            />
          </div>
          <button
            type="button"
            onClick={() => toggleTheme()}
            title={
              isDark
                ? t('mobile.account.lightMode', 'Light mode')
                : t('mobile.account.darkMode', 'Dark mode')
            }
            className="mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius)] border-0 bg-transparent text-text-tertiary transition-colors hover:bg-border-light hover:text-text-primary"
          >
            <Icon d={isDark ? ICONS.sun : ICONS.moon} size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-2 pb-3.5 pt-1.5">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium text-text-primary">{username}</div>
            {email && username !== email && (
              <div className="truncate text-[11px] text-text-tertiary">{email}</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

interface NavRowProps {
  icon: IconName
  label: string
  active?: boolean
  onClick?: () => void | Promise<void>
}

function NavRow({ icon, label, active, onClick }: NavRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius)] border-0 px-2.5 py-1.5 text-left text-[13.5px] transition-colors',
        active
          ? 'bg-primary-light font-semibold text-primary'
          : 'bg-transparent text-text-secondary hover:bg-border-light hover:text-text-primary',
      )}
    >
      <Icon d={ICONS[icon]} size={16} />
      <span className="flex-1 truncate">{label}</span>
    </button>
  )
}
