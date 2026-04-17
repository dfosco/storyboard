/**
 * ThemeSync — invisible React component that bridges the storyboard-core
 * theme store with Primer's ThemeProvider context.
 *
 * Uses the useThemeState hook to subscribe to core theme changes and
 * applies them to Primer's setColorMode/setDayScheme/setNightScheme.
 */

import { useEffect } from 'react'
import { useTheme } from '@primer/react'
import { useThemeState } from '@dfosco/storyboard-react'

function applyToPrimer(setColorMode, setDayScheme, setNightScheme, themeValue) {
  if (themeValue === 'system' || !themeValue) {
    setColorMode('auto')
    setDayScheme('light')
    setNightScheme('dark')
  } else {
    setColorMode('day')
    setDayScheme(themeValue)
    setNightScheme(themeValue)
  }
}

export default function ThemeSync() {
  const { setColorMode, setDayScheme, setNightScheme } = useTheme()
  const { theme } = useThemeState()

  useEffect(() => {
    applyToPrimer(setColorMode, setDayScheme, setNightScheme, theme)
  }, [theme, setColorMode, setDayScheme, setNightScheme])

  return null
}
