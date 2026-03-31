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
}
