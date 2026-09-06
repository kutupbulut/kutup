import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { KutupLogo } from '@/components/KutupLogo'
import { ThemeSelector } from '@/components/theme/ThemeSelector'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: ReactNode
  className?: string
  contentWidth?: 'compact' | 'default' | 'wide'
}

const CONTENT_WIDTH = {
  compact: 'max-w-sm',
  default: 'max-w-md',
  wide: 'max-w-xl',
} as const

/** Shared pre-authentication composition with no authentication side effects. */
export function AuthLayout({
  children,
  className,
  contentWidth = 'default',
}: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-svh items-center justify-center bg-muted px-5 py-20 text-foreground sm:px-8">
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] sm:right-6">
        <ThemeSelector compact />
      </div>

      <div className={cn('flex w-full flex-col gap-6', CONTENT_WIDTH[contentWidth], className)}>
        <Link
          to="/login"
          className="mx-auto inline-flex min-h-11 items-center gap-2 text-foreground no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Kutup"
        >
          <KutupLogo size={25} />
          <span className="font-display text-lg font-bold tracking-[-0.025em]">Kutup</span>
        </Link>

        <section
          className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
          data-testid="auth-card"
        >
          {children}
        </section>
      </div>
    </main>
  )
}
