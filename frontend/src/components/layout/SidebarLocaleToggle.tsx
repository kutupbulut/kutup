import { useTranslation } from 'react-i18next'

/** Compact locale switch placed beside the theme control in sidebar chrome. */
export function SidebarLocaleToggle() {
  const { t, i18n } = useTranslation()
  const next = i18n.language.startsWith('tr') ? 'en' : 'tr'

  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(next)}
      aria-label={t('nav.switchLanguage', { language: next.toUpperCase() })}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-sidebar-border px-1.5 text-[11px] font-semibold text-sidebar-muted transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      {next.toUpperCase()}
    </button>
  )
}
