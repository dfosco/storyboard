/**
 * Svelte UI exports for the comments system.
 *
 * These require a SvelteKit environment (Svelte peer dep + $lib/ alias).
 * Import from '@dfosco/storyboard-core/comments/svelte'.
 */

// Mount
export { mountComments } from './mount.js'

// Comment window
export { showCommentWindow, closeCommentWindow } from './commentWindow.js'

// Comments drawer
export { openCommentsDrawer, closeCommentsDrawer } from './commentsDrawer.js'
