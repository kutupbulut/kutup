import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * SectionLabel — small uppercase divider used above grouped row-lists (e.g.
 * "FOLDERS · 6"). Optional `action` slot renders on the right.
 *
 * Uses compact uppercase text and a tertiary color for visual hierarchy.
 */
interface SectionLabelProps {
  children: ReactNode
  action?: ReactNode
  className?: string
}

export function SectionLabel({ children, action, className }: SectionLabelProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-1 pb-2',
        className,
      )}
    >
      <span
        className="text-[11.5px] font-semibold tracking-[0.06em] uppercase text-text-tertiary"
      >
        {children}
      </span>
      {action}
    </div>
  )
}
