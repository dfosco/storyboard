/**
 * ThemeSync — invisible React component that bridges the Svelte theme store
 * with Primer's ThemeProvider context.
 *
 * Listens for `storyboard:theme:changed` custom events dispatched by the
 * core theme store and calls setDayScheme/setNightScheme on Primer's
 * useTheme() hook accordingly.
 *
 * On mount it also reads localStorage to initialize Primer to the correct
 * scheme before the Svelte CoreUIBar has loaded.
 */

import { useEffect } from 'react'
import { useTheme } from '@primer/react'

const THEME_STORAGE_KEY = 'sb-color-scheme'
const THEME_SYNC_STORAGE_KEY = 'sb-theme-sync'

const DEFAULT_SYNC = {
  prototype: true,
  toolbar: false,
  codeBoxes: true,
}

function readSyncTargets() {
  try {
    const raw = localStorage.getItem(THEME_SYNC_STORAGE_KEY)
    if (!raw) return DEFAULT_SYNC
    return { ...DEFAULT_SYNC, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SYNC
  }
}

function applyToPrimer(setDayScheme, setNightScheme, themeValue) {
  if (themeValue === 'system' || !themeValue) {
    setDayScheme('light')
    setNightScheme('dark')
  } else {
    setDayScheme(themeValue)
    setNightScheme(themeValue)
  }
}

export default function ThemeSync() {
  const { setDayScheme, setNightScheme } = useTheme()

  // Restore saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    const syncTargets = readSyncTargets()
    const prototypeTheme = syncTargets.prototype ? saved : 'light'
    applyToPrimer(setDayScheme, setNightScheme, prototypeTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for theme changes from the Svelte CoreUIBar
  useEffect(() => {
    function handleThemeChanged(e) {
      const { prototypeTheme } = e.detail
      applyToPrimer(setDayScheme, setNightScheme, prototypeTheme)
    }
    document.addEventListener('storyboard:theme:changed', handleThemeChanged)
    return () => document.removeEventListener('storyboard:theme:changed', handleThemeChanged)
  }, [setDayScheme, setNightScheme])

  return null
}
