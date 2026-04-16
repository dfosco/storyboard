/**
 * Resolve the effective canvas theme from localStorage + sync settings.
 * Respects the canvas-specific theme sync toggle.
 */
export function resolveCanvasTheme() {
  if (typeof localStorage === 'undefined') return 'light'
  let sync = { prototype: true, toolbar: false, codeBoxes: true, canvas: true }
  try {
    const rawSync = localStorage.getItem('sb-theme-sync')
    if (rawSync) sync = { ...sync, ...JSON.parse(rawSync) }
  } catch { /* ignore */ }
  if (!sync.canvas) return 'light'
  const attrTheme = document.documentElement.getAttribute('data-sb-canvas-theme')
  if (attrTheme) return attrTheme
  const stored = localStorage.getItem('sb-color-scheme') || 'system'
  if (stored !== 'system') return stored
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Subscribe to canvas theme changes for embed widget snapshot switching.
 *
 * Reads `data-sb-canvas-theme` from the nearest ancestor set by CanvasPage.
 * With canvas sync ON (the default), this attribute follows the global theme.
 * Uses MutationObserver for immediate reaction + event backup.
 */
export function subscribeCanvasTheme({ anchorRef, onTheme }) {
  if (typeof onTheme !== 'function') return () => {}

  let observed = null
  let observer = null

  function readAndEmit() {
    const el = anchorRef?.current?.closest?.('[data-sb-canvas-theme]') || null
    if (el !== observed) {
      if (observer) observer.disconnect()
      observer = null
      observed = el
      if (el && typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(readAndEmit)
        observer.observe(el, { attributes: true, attributeFilter: ['data-sb-canvas-theme'] })
      }
    }
    onTheme(el?.getAttribute('data-sb-canvas-theme') || 'light')
  }

  readAndEmit()
  document.addEventListener('storyboard:theme:changed', readAndEmit)

  return () => {
    document.removeEventListener('storyboard:theme:changed', readAndEmit)
    if (observer) observer.disconnect()
  }
}

export function getEmbedChromeVars(theme) {
  const value = String(theme || 'light')
  if (value === 'dark_dimmed') {
    return {
      '--bgColor-default': '#22272e',
      '--bgColor-muted': '#2d333b',
      '--bgColor-neutral-muted': 'rgba(99, 110, 123, 0.3)',
      '--fgColor-default': '#adbac7',
      '--fgColor-muted': '#768390',
      '--fgColor-onEmphasis': '#ffffff',
      '--borderColor-default': '#444c56',
      '--borderColor-muted': '#545d68',
      '--bgColor-accent-emphasis': '#316dca',
      '--trigger-bg': '#2d333b',
      '--trigger-bg-hover': '#373e47',
      '--trigger-border': '#444c56',
    }
  }
  if (value.startsWith('dark')) {
    return {
      '--bgColor-default': '#161b22',
      '--bgColor-muted': '#21262d',
      '--bgColor-neutral-muted': 'rgba(110, 118, 129, 0.2)',
      '--fgColor-default': '#e6edf3',
      '--fgColor-muted': '#8b949e',
      '--fgColor-onEmphasis': '#ffffff',
      '--borderColor-default': '#30363d',
      '--borderColor-muted': '#30363d',
      '--bgColor-accent-emphasis': '#2f81f7',
      '--trigger-bg': '#21262d',
      '--trigger-bg-hover': '#30363d',
      '--trigger-border': '#30363d',
    }
  }
  return {
    '--bgColor-default': '#ffffff',
    '--bgColor-muted': '#f6f8fa',
    '--bgColor-neutral-muted': '#eaeef2',
    '--fgColor-default': '#1f2328',
    '--fgColor-muted': '#656d76',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#d0d7de',
    '--borderColor-muted': '#d8dee4',
    '--bgColor-accent-emphasis': '#2f81f7',
    '--trigger-bg': '#f6f8fa',
    '--trigger-bg-hover': '#eaeef2',
    '--trigger-border': '#d0d7de',
  }
}
