import type { ReactNode } from 'react'

/** Title and primary action for the active administration section. */
interface AdminTopBarProps {
  title: string
  subtitle?: string
  /** Right-side action slot. Buttons / IconButtons / etc. */
  action?: ReactNode
}

export function AdminTopBar({ title, subtitle, action }: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border-light bg-surface px-8 py-4">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-[22px]">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex items-center gap-2.5 shrink-0">{action}</div>
      )}
    </header>
  )
}
