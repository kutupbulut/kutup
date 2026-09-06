import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon, ICONS, type IconName } from '@/components/mobile/Icon'
import { KutupLogo } from '@/components/KutupLogo'
import { MobileShell } from '@/components/mobile/MobileShell'
import { MobilePageHeader } from '@/components/mobile/MobilePageHeader'
import { Surface } from '@/components/ui/surface'
import { PressableRow } from '@/components/ui/pressable-row'
import { StorageCard } from '@/components/ui/storage-card'
import { useIsMobile } from '@/hooks/useIsMobile'
import { ThemeSelector } from '@/components/theme/ThemeSelector'
import { useAppSelector, useAppDispatch } from '@/store'
import { logout } from '@/store/authSlice'
import { broadcastLogout } from '@/lib/sessionSync'
import * as sessionVault from '@/lib/sessionVault'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

/** Mobile account hub. Desktop account management lives at `/settings`. */
export default function MobileAccountPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isMobile = useIsMobile()
  const auth = useAppSelector((s) => s.auth)
  const [signOutOpen, setSignOutOpen] = useState(false)

  useEffect(() => {
    if (!isMobile) navigate('/settings', { replace: true })
  }, [isMobile, navigate])

  if (!isMobile) return null

  async function handleLogout() {
    broadcastLogout()
    try {
      await sessionVault.clear()
    } catch {
      // best-effort; logout proceeds regardless
    }
    dispatch(logout())
    navigate('/login')
  }

  const username = auth.username ?? auth.email ?? ''
  const email = auth.email ?? ''
  const initial = (username || '?').slice(0, 1).toUpperCase()

  type Row = {
    icon: IconName
    label: string
    sub?: string
    onClick?: () => void
    danger?: boolean
  }

  const groups: Row[][] = [
    [
      {
        icon: 'user',
        label: t('mobile.account.profile', 'Profile'),
        sub: auth.username && auth.email ? `${auth.username} · ${auth.email}` : username,
        onClick: () => navigate('/drive/account/profile'),
      },
      {
        icon: 'key',
        label: t('mobile.account.encryptionKeys', 'Encryption keys'),
        sub: t('mobile.account.encryptionKeys.sub', 'Recovery and encryption information'),
        onClick: () => navigate('/drive/account/encryption-keys'),
      },
      {
        icon: 'shield',
        label: t('mobile.account.security', 'Security'),
        onClick: () => navigate('/drive/account/security'),
      },
    ],
    [
      {
        icon: 'globe',
        label: t('mobile.account.language', 'Language'),
        onClick: () => navigate('/drive/account/language'),
      },
    ],
    [
      ...(auth.isAdmin
        ? [
            {
              icon: 'shield' as const,
              label: t('mobile.account.admin', 'Admin'),
              onClick: () => navigate('/drive/account/admin'),
            },
          ]
        : []),
      {
        icon: 'info',
        label: t('mobile.account.about', 'About Kutup'),
        onClick: () => navigate('/drive/account/about'),
      },
      {
        icon: 'logout',
        label: t('mobile.account.signOut', 'Sign out'),
        danger: true,
        onClick: () => setSignOutOpen(true),
      },
    ],
  ]

  return (
    <MobileShell>
      <MobilePageHeader title={t('nav.account', 'Account')} large />
      <div className="flex-1 overflow-auto px-3.5 pt-2 pb-24">
        <div className="flex items-center gap-3.5 p-3.5 bg-surface border border-border-light rounded-[var(--radius-lg)] mb-4">
          <div className="w-13 h-13 rounded-full bg-primary flex items-center justify-center text-[20px] font-bold text-white shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-text-primary truncate">
              {username}
            </div>
            {email && username !== email && (
              <div className="text-[12.5px] text-text-tertiary truncate">{email}</div>
            )}
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-primary-faint rounded-[10px]">
              <Icon d={ICONS.shield} size={10} color="var(--primary)" />
              <span className="text-[10.5px] text-primary font-semibold">
                {auth.isAdmin
                  ? t('mobile.account.adminPlan', 'Admin')
                  : t('mobile.account.member', 'Member')}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <StorageCard
            used={auth.storageUsedBytes}
            quota={auth.storageQuotaBytes}
          />
        </div>

        <Surface className="mb-3.5 p-3.5">
          <div className="mb-3">
            <div className="text-sm font-medium text-text-primary">
              {t('theme.label')}
            </div>
            <div className="mt-0.5 text-[12px] text-text-tertiary">
              {t('theme.description')}
            </div>
          </div>
          <ThemeSelector className="w-full" />
        </Surface>

        {groups.map((group, gi) => (
          <div key={gi} className="mb-3.5">
            <Surface>
              {group.map((row, i) => (
                <PressableRow
                  key={row.label}
                  onClick={row.onClick}
                  last={i === group.length - 1}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0',
                      row.danger
                        ? 'bg-destructive-faint text-destructive'
                        : 'bg-surface-sunken text-text-secondary',
                    )}
                    aria-hidden="true"
                  >
                    <Icon d={ICONS[row.icon]} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-sm font-medium',
                        row.danger ? 'text-destructive' : 'text-text-primary',
                      )}
                    >
                      {row.label}
                    </div>
                    {row.sub && (
                      <div className="text-[12px] text-text-tertiary mt-0.5">{row.sub}</div>
                    )}
                  </div>
                  <Icon
                    d={ICONS.chevronRight}
                    size={16}
                    color="var(--text-tertiary)"
                  />
                </PressableRow>
              ))}
            </Surface>
          </div>
        ))}

        <div className="text-center pt-2 pb-6 flex flex-col items-center gap-1">
          <KutupLogo size={20} />
          <div className="text-[11px] text-text-tertiary">
            {t('mobile.account.tagline', 'Kutup · End-to-end encrypted workspace')}
          </div>
        </div>
      </div>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('nav.signOutConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('nav.signOutConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              {t('nav.signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileShell>
  )
}
