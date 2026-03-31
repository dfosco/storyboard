/**
 * UI entry point — compiled into dist/storyboard-ui.js via Vite library build.
 *
 * This file is the entry for the pre-compiled Svelte UI bundle.
 * It re-exports all UI mount functions that depend on Svelte.
 * Consumers never import this directly — they use mountStoryboardCore()
 * or the package self-reference '@dfosco/storyboard-core/ui-runtime'.
 */

// Tailwind utility + component CSS — bundled into storyboard-ui.css
import './styles/tailwind.css'

// Comments CSS
import './comments/ui/comment-layout.css'
import './comments/ui/comments.css'

// Modes CSS (design mode body classes)
import './modes.css'

// CoreUIBar (floating toolbar)
export { mountDevTools, unmountDevTools } from './devtools.js'

// Comments UI (Svelte-based comment pins, windows, drawers)
export { mountComments } from './comments/ui/mount.js'

// Viewfinder dashboard (Svelte component)
export { mountViewfinder, unmountViewfinder } from './ui/viewfinder.ts'

// Design modes (Svelte component)
export { mountDesignModesUI as mountDesignModes } from './ui/design-modes.ts'
