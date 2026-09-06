import { useEffect, useState } from 'react'
import {
  type Theme,
  type ThemePreference,
  getTheme,
  getThemePreference,
  subscribeTheme,
  subscribeThemePreference,
  applyTheme,
  toggleTheme,
  isThemePreference,
} from '@/lib/theme'

// Reactive companion to lib/theme.ts. Components that read the current
// theme should use this hook so they re-render when the theme changes
// (toggled from any pane: Sidebar, FileEditorPage navbar, another tab,
// or the OS colour-scheme changing while in 'system' mode).
export function useTheme(): [Theme, () => Theme, (pref: ThemePreference) => void] {
  const [theme, setTheme] = useState<Theme>(getTheme)
  useEffect(() => {
    const unsub = subscribeTheme(setTheme)
    function onStorage(e: StorageEvent) {
      // Another tab changed the preference (could be 'system' | 'dark' |
      // 'light'). Re-apply here so this tab's <html> class + colorScheme
      // update; applyTheme also notifies subscribeTheme → setTheme runs.
      if (e.key === 'kutup-theme') {
        applyTheme(isThemePreference(e.newValue) ? e.newValue : 'system')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      unsub()
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  return [theme, toggleTheme, applyTheme]
}

/** Reactive persisted preference for explicit light/dark/system controls. */
export function useThemePreference(): [
  ThemePreference,
  (preference: ThemePreference) => void,
] {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference)

  useEffect(() => {
    const unsubscribe = subscribeThemePreference(setPreference)
    function onStorage(event: StorageEvent) {
      if (event.key === 'kutup-theme') {
        applyTheme(isThemePreference(event.newValue) ? event.newValue : 'system')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      unsubscribe()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return [preference, applyTheme]
}
