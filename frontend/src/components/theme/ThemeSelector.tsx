import { Monitor, Moon, Sun } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { useThemePreference } from '@/hooks/useTheme'
import type { ThemePreference } from '@/lib/theme'
import { cn } from '@/lib/utils'

const OPTIONS: Array<{
  value: ThemePreference
  labelKey: 'theme.light' | 'theme.dark' | 'theme.system'
  icon: typeof Sun
}> = [
  { value: 'light', labelKey: 'theme.light', icon: Sun },
  { value: 'dark', labelKey: 'theme.dark', icon: Moon },
  { value: 'system', labelKey: 'theme.system', icon: Monitor },
]

interface ThemeSelectorProps {
  className?: string
  compact?: boolean
  tone?: 'default' | 'sidebar'
}

/** An explicit light/dark/system preference control.
 *
 * `system` is a persisted preference, not a synonym for the currently
 * resolved theme, so it remains selected when the operating system changes.
 */
export function ThemeSelector({
  className,
  compact = false,
  tone = 'default',
}: ThemeSelectorProps) {
  const { t } = useTranslation()
  const [preference, setPreference] = useThemePreference()

  function moveSelection(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % OPTIONS.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + OPTIONS.length) % OPTIONS.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = OPTIONS.length - 1
    }

    if (nextIndex == null) return
    event.preventDefault()
    const next = OPTIONS[nextIndex]
    setPreference(next.value)
    const nextControl = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
      `[data-theme-preference="${next.value}"]`,
    )
    nextControl?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className={cn(
        'grid grid-cols-3 border',
        compact ? 'gap-0.5 rounded-md p-0.5' : 'gap-1 rounded-lg p-1',
        tone === 'sidebar'
          ? 'border-sidebar-border bg-sidebar-accent/35'
          : 'border-border-light bg-surface-sunken',
        className,
      )}
      data-testid="theme-selector"
    >
      {OPTIONS.map(({ value, labelKey, icon: Icon }, index) => {
        const selected = preference === value
        const label = t(labelKey)
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            aria-label={compact ? label : undefined}
            title={compact ? label : undefined}
            onClick={() => setPreference(value)}
            onKeyDown={(event) => moveSelection(event, index)}
            className={cn(
              'inline-flex items-center justify-center gap-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-150',
              compact ? 'h-7 w-7 rounded p-0' : 'min-h-9 rounded-md px-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1',
              tone === 'sidebar'
                ? selected
                  ? 'bg-sidebar-accent text-sidebar-foreground shadow-sm'
                  : 'text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                : selected
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground',
            )}
            data-theme-preference={value}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className={cn(compact && 'sr-only')}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
