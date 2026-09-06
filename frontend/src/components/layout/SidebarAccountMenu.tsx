import { LogOut, Settings, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppDispatch, useAppSelector } from '@/store'
import { logout } from '@/store/authSlice'
import { broadcastLogout } from '@/lib/sessionSync'
import * as sessionVault from '@/lib/sessionVault'
import { cn } from '@/lib/utils'

/** Identity, Account navigation, and sign-out as one global sidebar control. */
export function SidebarAccountMenu() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const auth = useAppSelector(state => state.auth)
  const identity = auth.username ?? auth.email ?? ''
  const initial = identity.slice(0, 1).toUpperCase() || '?'

  async function handleLogout() {
    broadcastLogout()
    try {
      await sessionVault.clear()
    } catch {
      // The OS vault is best-effort on sign-out; web has no vault to clear.
    }
    dispatch(logout())
    navigate('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="sidebar-account-menu"
          className={cn(
            'inline-flex h-8 max-w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
            pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
          )}
        >
          <User className="h-4 w-4 shrink-0 text-sidebar-muted" aria-hidden="true" />
          <span className="min-w-0 truncate font-medium">{identity}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-60">
        <div className="px-2 py-1.5">
          <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary-faint text-sm font-semibold text-primary">
            {initial}
          </div>
          <p className="truncate text-sm font-medium">{identity}</p>
          {auth.email && auth.email !== identity ? (
            <p className="truncate text-xs text-muted-foreground">{auth.email}</p>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
          <Settings aria-hidden="true" />
          {t('nav.account')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleLogout()}>
          <LogOut aria-hidden="true" />
          {t('nav.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
