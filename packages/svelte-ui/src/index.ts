/**
 * @dfosco/storyboard-svelte-ui — Svelte component framework for core plugin UIs.
 *
 * Provides mount utilities, shared styles, and reusable components that
 * any storyboard core plugin can use, independent of the prototype app's
 * frontend framework.
 */

// Mount utility
export { mountSveltePlugin, injectStyles, type PluginHandle } from './mount.js'

// Stores
export { modeState, switchMode } from './stores/modeStore.js'

// Type re-exports
export type { ModeState } from './stores/modeStore.js'
export type { ModeConfig, ModeToolConfig } from './stores/types.js'
