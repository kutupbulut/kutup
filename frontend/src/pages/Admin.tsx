import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { selectIsLoggedIn, selectIsAdmin } from '@/store/authSlice'
import { useAdminUsers, useAdminStats } from '@/api/hooks/useAdmin'
import { Icon, ICONS } from '@/components/mobile/Icon'
import { Button } from '@/components/ui/button'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab'
import { AdminUsersTab } from '@/components/admin/AdminUsersTab'
import { AdminSettingsTab } from '@/components/admin/AdminSettingsTab'
import { AdminCreateUserDialog } from '@/components/admin/AdminCreateUserDialog'
import { adminSectionPath, parseAdminSection, type AdminSectionId } from '@/components/admin/navigation'

/**
 * Admin uses its own dedicated navigation so the workspace and administration
 * rails never stack beside one another. Section URLs remain durable.
 */
export default function Admin() {
  const isLoggedIn = useAppSelector(selectIsLoggedIn)
  const isAdmin = useAppSelector(selectIsAdmin)

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/drive" replace />

  return <AdminContent />
}

function AdminContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { section } = useParams<{ section?: string }>()
  const tab = parseAdminSection(section)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: users, isLoading: usersLoading } = useAdminUsers()
  const { data: stats, isLoading: statsLoading } = useAdminStats()

  if (tab == null) return <Navigate to="/admin" replace />

  const titles: Record<AdminSectionId, { title: string; subtitle: string }> = {
    overview: {
      title: t('admin.topBar.overviewTitle', 'Admin Overview'),
      subtitle: t(
        'admin.topBar.overviewSubtitle',
        'kutup · self-hosted, end-to-end encrypted',
      ),
    },
    users: {
      title: t('admin.topBar.usersTitle', 'Users'),
      subtitle: t('admin.topBar.usersSubtitle', '{{count}} accounts on this instance', {
        count: users?.length ?? 0,
      }),
    },
    settings: {
      title: t('admin.topBar.settingsTitle', 'Settings'),
      subtitle: t(
        'admin.topBar.settingsSubtitle',
        'Configure registration and storage',
      ),
    },
  }

  const action =
    tab === 'users' ? (
      <Button size="sm" className="gap-1.5 h-9" onClick={() => setCreateOpen(true)}>
        <Icon d={ICONS.userPlus} size={14} />
        {t('admin.createUser', 'Create user')}
      </Button>
    ) : tab === 'overview' ? (
      <Button size="sm" className="gap-1.5 h-9" onClick={() => setCreateOpen(true)}>
        <Icon d={ICONS.userPlus} size={14} />
        {t('admin.createUser', 'Create user')}
      </Button>
    ) : null

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        tab={tab}
        onTab={(nextTab) => navigate(adminSectionPath(nextTab))}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          title={titles[tab].title}
          subtitle={titles[tab].subtitle}
          action={action}
        />

        <div className="flex-1 overflow-auto px-8 py-6">
          {tab === 'overview' && (
            <AdminOverviewTab
              stats={stats}
              statsLoading={statsLoading}
              users={users}
              usersLoading={usersLoading}
            />
          )}
          {tab === 'users' && (
            <AdminUsersTab
              users={users}
              loading={usersLoading}
              onCreate={() => setCreateOpen(true)}
            />
          )}
          {tab === 'settings' && <AdminSettingsTab />}
        </div>
      </main>

      <AdminCreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
