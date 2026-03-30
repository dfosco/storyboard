/**
 * UI entry point — compiled into dist/storyboard-ui.js via Vite library build.
 *
 * This file is the entry for the pre-compiled Svelte UI bundle.
 * It re-exports all UI mount functions that depend on Svelte.
 * Consumers never import this directly — they use mountStoryboardCore()
 * which dynamically imports this bundle at runtime.
 */

// CoreUIBar (floating toolbar)
export { mountDevTools, unmountDevTools } from './devtools.js'

// Comments UI (Svelte-based comment pins, windows, drawers)
export { mountComments } from './comments/ui/mount.js'
