/**
 * Resolve the effective canvas theme from localStorage + sync settings.
 * Respects the canvas-specific theme sync toggle.
 */
export function resolveCanvasTheme() {
  if (typeof localStorage === 'undefined') return 'light'
  let sync = { prototype: true, toolbar: false, codeBoxes: true, canvas: false }
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

function normalizeTheme(value) {
  return String(value || 'light')
}

/**
 * Subscribe to canvas theme updates for embed widgets.
 * Uses three sources, in priority order:
 * 1) `storyboard:theme:changed` event detail (fast path)
 * 2) nearest `[data-sb-canvas-theme]` ancestor (source of truth in canvas DOM)
 * 3) matchMedia fallback for system theme changes
 */
export function subscribeCanvasTheme({ anchorRef, onTheme }) {
  if (typeof onTheme !== 'function') return () => {}

  let themedContainer = null
  let observer = null

  function emit(theme) {
    onTheme(normalizeTheme(theme))
  }

  function attachObserver(container) {
    if (themedContainer === container) return
    if (observer) observer.disconnect()
    themedContainer = container
    observer = null
    if (!container || typeof MutationObserver === 'undefined') return
    observer = new MutationObserver(() => {
      emit(container.getAttribute('data-sb-canvas-theme') || 'light')
    })
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['data-sb-canvas-theme'],
    })
  }

  function readFromDom() {
    const container = anchorRef?.current?.closest?.('[data-sb-canvas-theme]') || null
    attachObserver(container)
    emit(container?.getAttribute('data-sb-canvas-theme') || 'light')
  }

  function onThemeChanged(event) {
    const fromEvent = event?.detail?.canvasResolved
    if (typeof fromEvent === 'string' && fromEvent.length > 0) {
      emit(fromEvent)
    }
    // Re-read after event to avoid races with ancestor attribute updates.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(readFromDom)
    } else {
      setTimeout(readFromDom, 0)
    }
  }

  readFromDom()
  document.addEventListener('storyboard:theme:changed', onThemeChanged)

  const mediaQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null
  mediaQuery?.addEventListener?.('change', readFromDom)

  return () => {
    document.removeEventListener('storyboard:theme:changed', onThemeChanged)
    mediaQuery?.removeEventListener?.('change', readFromDom)
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
