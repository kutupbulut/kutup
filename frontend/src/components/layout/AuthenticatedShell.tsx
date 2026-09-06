import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AppSidebar } from './AppSidebar'

/**
 * Persistent authenticated workspace frame. The sidebar is hidden with CSS on
 * phone viewports so resizing does not remount the routed workspace or its
 * upload, editor, or Chat services.
 */
export default function AuthenticatedShell() {
  const { t } = useTranslation()
  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      <div className="hidden h-full md:block">
        <AppSidebar />
      </div>
      <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <Suspense
          fallback={(
            <div className="flex h-full items-center justify-center" role="status">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="sr-only">{t('common.loading')}</span>
            </div>
          )}
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
