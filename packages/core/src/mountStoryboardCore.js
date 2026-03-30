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
import { initPlugins, isPluginEnabled } from './plugins.js'
import { initUIConfig } from './uiConfig.js'

let _mounted = false

/**
 * Inject the compiled UI stylesheet if not already present.
 * In the source repo (dev mode), CSS is handled by Vite's HMR pipeline
 * so this is a no-op. In consumer repos, it injects the compiled CSS.
 */
function injectUIStyles() {
  if (document.querySelector('[data-storyboard-ui-css]')) return

  // Try to resolve the CSS URL relative to the UI bundle.
  // In consumer builds, the CSS is at dist/storyboard-ui.css.
  try {
    const cssUrl = new URL('./storyboard-ui.css', import.meta.url).href
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssUrl
    link.setAttribute('data-storyboard-ui-css', '')
    document.head.appendChild(link)
  } catch {
    // Source repo / dev mode — CSS is injected by Vite plugins
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
  let toolbarConfig = undefined
  if (config.toolbar) {
    const { deepMerge } = await import('./loader.js')
    const defaultConfig = (await import('../toolbar.config.json')).default
    toolbarConfig = deepMerge(defaultConfig, config.toolbar)
  }

  // Dynamically import the compiled UI bundle.
  // In the source repo, Vite aliases resolve this to source (for HMR).
  // In consumer repos, this resolves to dist/storyboard-ui.js (pre-compiled).
  const ui = await import('./ui-entry.js')

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
}
