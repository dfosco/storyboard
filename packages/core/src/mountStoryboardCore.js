/**
 * mountStoryboardCore — single entry point for consumer apps.
 *
 * Initializes all storyboard systems (URL state, history, comments, devtools)
 * and mounts the compiled Svelte UI. Consumers call this once at app startup.
 *
 * Usage:
 *   import { mountStoryboardCore } from '@dfosco/storyboard-core'
 *   import storyboardConfig from '../storyboard.config.json'
 *   mountStoryboardCore(storyboardConfig, { basePath: import.meta.env.BASE_URL })
 */

import { installHideParamListener } from './interceptHideParams.js'
import { installHistorySync } from './hideMode.js'
import { installBodyClassSync } from './bodyClasses.js'
import { initCommentsConfig, isCommentsEnabled } from './comments/config.js'
import { initFeatureFlags } from './featureFlags.js'
import { initPlugins } from './plugins.js'
import { initUIConfig } from './uiConfig.js'

let _mounted = false

/**
 * Apply the saved theme to Primer CSS attributes immediately, before
 * React or Svelte mount. This prevents a flash of wrong-theme content.
 * Reads the same `sb-color-scheme` localStorage key used by themeStore.
 */
function applyEarlyTheme() {
  if (typeof document === 'undefined') return

  const stored =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('sb-color-scheme')
      : null
  const theme = stored || 'system'
  const el = document.documentElement

  // Resolve "system" to an actual theme for data-sb-theme
  let resolved = theme
  if (theme === 'system') {
    resolved =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
  }

  el.setAttribute('data-sb-theme', resolved)

  if (theme === 'system') {
    el.setAttribute('data-color-mode', 'auto')
    el.setAttribute('data-light-theme', 'light')
    el.setAttribute('data-dark-theme', 'dark')
  } else if (resolved.startsWith('dark')) {
    el.setAttribute('data-color-mode', 'dark')
    el.setAttribute('data-dark-theme', resolved)
    el.setAttribute('data-light-theme', 'light')
  } else {
    el.setAttribute('data-color-mode', 'light')
    el.setAttribute('data-light-theme', resolved)
    el.setAttribute('data-dark-theme', 'dark')
  }
}

/**
 * Inject the compiled UI stylesheet if not already present.
 */
async function injectUIStyles() {
  if (document.querySelector('[data-storyboard-ui-css]')) return

  try {
    // Dynamic import of CSS — Vite handles this as a side-effect import.
    // In consumer repos: loads dist/storyboard-ui.css
    // In source repo: Vite injects component styles via HMR
    await import('@dfosco/storyboard-core/ui-runtime/style.css')
  } catch {
    // Graceful fallback — CSS may already be loaded by other means
  }
}

/**
 * Mount the full storyboard core system.
 *
 * @param {object} [config={}] - Contents of storyboard.config.json
 * @param {object} [options={}]
 * @param {string} [options.basePath='/'] - Base URL path (e.g. import.meta.env.BASE_URL)
 * @param {HTMLElement} [options.container=document.body] - Where to mount devtools
 */
export async function mountStoryboardCore(config = {}, options = {}) {
  if (_mounted) return
  _mounted = true

  const basePath = options.basePath || '/'

  // Apply saved theme to DOM immediately — before Svelte/React mount
  applyEarlyTheme()

  // Initialize framework-agnostic systems
  installHideParamListener()
  installHistorySync()
  installBodyClassSync()

  // Initialize config-driven systems
  if (config.featureFlags) {
    initFeatureFlags(config.featureFlags)
  }

  if (config.plugins) {
    initPlugins(config.plugins)
  }

  if (config.ui) {
    initUIConfig(config.ui)
  }

  // Initialize comments config (framework-agnostic)
  if (config.comments) {
    initCommentsConfig(config, { basePath })
  }

  // Inject compiled UI styles
  injectUIStyles()

  // Load and merge toolbar config.
  // Core defaults come from toolbar.config.json (bundled).
  // Client can provide overrides via config.toolbar or a toolbar.config.json at repo root.
  const { deepMerge } = await import('./loader.js')
  const defaultConfig = (await import('../toolbar.config.json')).default
  let toolbarConfig = config.toolbar
    ? deepMerge(defaultConfig, config.toolbar)
    : { ...defaultConfig }

  // Inject repository URL from storyboard.config.json into the command menu
  if (config.repository?.owner && config.repository?.name) {
    const repoUrl = `https://github.com/${config.repository.owner}/${config.repository.name}`
    const commandMenu = toolbarConfig.menus?.command
    if (commandMenu?.actions) {
      const repoAction = commandMenu.actions.find(a => a.id === 'core/repository')
      if (repoAction) repoAction.url = repoUrl
    }
  }

  // Dynamically import the compiled UI bundle.
  // Uses the package self-reference so resolution differs by context:
  //   Source repo: Vite alias overrides to src/ui-entry.js (source, HMR)
  //   Consumer repos: package.json exports resolve to dist/storyboard-ui.js (compiled)
  const ui = await import('@dfosco/storyboard-core/ui-runtime')

  // Mount devtools (CoreUIBar)
  await ui.mountDevTools({
    container: options.container,
    basePath,
    toolbarConfig,
  })

  // Mount comments system if configured
  if (isCommentsEnabled()) {
    ui.mountComments()
  }

  // Show pending workshop notifications (e.g. canvas created before Vite reload)
  showPendingNotification(basePath)
}

/**
 * Check sessionStorage for a pending workshop creation notification.
 * Vite does a full-reload when new files are created, so the create form's
 * success message is lost. This shows a temporary toast with the link.
 */
function showPendingNotification(basePath) {
  const KEYS = ['sb-canvas-created', 'sb-prototype-created', 'sb-flow-created']
  for (const key of KEYS) {
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) continue
      sessionStorage.removeItem(key)
      const { success: message, route } = JSON.parse(raw)
      if (!message) continue
      showToast(message, route, basePath)
      return
    } catch {}
  }
}

function showToast(message, route, basePath) {
  const toast = document.createElement('div')
  Object.assign(toast.style, {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: '10001',
    padding: '0.875rem 1.125rem',
    borderRadius: '0.5rem',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '0.8125rem',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    opacity: '0',
    transition: 'opacity 0.2s ease',
    maxWidth: '320px',
  })

  const href = route?.startsWith('/') ? (basePath.replace(/\/$/, '') + route) : route
  toast.innerHTML = `<span>✓ ${message.replace(/</g, '&lt;')}</span>`
    + (href ? `<a href="${href}" style="color:#58a6ff;text-decoration:underline;font-weight:500">Open canvas</a>` : '')

  document.body.appendChild(toast)
  requestAnimationFrame(() => { toast.style.opacity = '1' })

  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, 8000)
}
