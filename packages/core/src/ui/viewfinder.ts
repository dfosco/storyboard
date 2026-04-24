/**
 * Viewfinder UI mount entry point.
 *
 * Call mountViewfinder() to render the prototype index dashboard.
 * Framework-agnostic — works from any JS context (React wrapper,
 * vanilla JS, etc.).
 *
 * Usage:
 *   import { mountViewfinder } from '@dfosco/storyboard-core/ui/viewfinder'
 *   const handle = mountViewfinder(document.getElementById('root'), {
 *     title: 'My Storyboard',
 *     knownRoutes: ['Dashboard', 'Settings'],
 *   })
 *   // later: handle.destroy()
 */

import { mountSveltePlugin, type PluginHandle } from '../svelte-plugin-ui/mount.js'
import Viewfinder from '../svelte-plugin-ui/components/Viewfinder.jsx'

export interface ViewfinderProps {
  title?: string
  subtitle?: string
  basePath?: string
  knownRoutes?: string[]
  showThumbnails?: boolean
  hideDefaultFlow?: boolean
}

let handle: PluginHandle | null = null

/**
 * Mount the Viewfinder dashboard into a DOM container.
 *
 * Idempotent — calling multiple times is a no-op.
 * Returns a handle with destroy() method.
 *
 * @param container - DOM element to mount into
 * @param props - Viewfinder configuration
 */
export function mountViewfinder(
  container: HTMLElement,
  props?: ViewfinderProps,
): PluginHandle {
  if (handle) return handle

  handle = mountSveltePlugin(container, Viewfinder as any, props as any)
  return handle
}

/**
 * Remove the Viewfinder from the DOM.
 */
export function unmountViewfinder(): void {
  if (handle) {
    handle.destroy()
    handle = null
  }
}
