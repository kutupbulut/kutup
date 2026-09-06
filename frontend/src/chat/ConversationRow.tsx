import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ConversationRowProps {
  active: boolean
  avatar: ReactNode
  badge?: ReactNode
  meta?: string
  onClick: () => void
  preview?: ReactNode
  secondaryIdentity?: string
  testId?: string
  title: ReactNode
  tone?: 'default' | 'request'
}

export function ConversationRow({
  active,
  avatar,
  badge,
  meta,
  onClick,
  preview,
  secondaryIdentity,
  testId,
  title,
  tone = 'default',
}: ConversationRowProps) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar',
        active
          ? tone === 'request'
            ? 'bg-warning-faint text-foreground'
            : 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/65',
      )}
      data-testid={testId}
    >
      <span className="shrink-0" aria-hidden="true">{avatar}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</span>
          {meta && (
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {meta}
            </span>
          )}
        </span>
        {secondaryIdentity && (
          <span className="block truncate font-mono text-[10px] text-muted-foreground">
            {secondaryIdentity}
          </span>
        )}
        {(preview || badge) && (
          <span className="mt-0.5 flex min-w-0 items-center gap-2">
            {preview && (
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {preview}
              </span>
            )}
            {badge}
          </span>
        )}
      </span>
    </button>
  )
}
