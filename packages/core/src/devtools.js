/**
 * Storyboard Core UI Bar — Svelte-based floating toolbar.
 *
 * Mounts the CoreUIBar Svelte component into the DOM.
 * Contains the command menu and mode-specific buttons (workshop, etc.).
 * Uses dynamic import() for the Svelte component to avoid
 * breaking non-Svelte test environments.
 *
 * Usage:
 *   import { mountDevTools } from '@dfosco/storyboard-core'
 *   mountDevTools() // call once at app startup
 */

let instance = null
let wrapper = null

/**
 * Mount the Storyboard Core UI Bar to the DOM.
 * Call once at app startup. Safe to call multiple times (no-ops after first).
 *
 * @param {object} [options]
 * @param {HTMLElement} [options.container=document.body] - Where to mount
 * @param {string} [options.basePath='/'] - Base URL path
 */
export async function mountDevTools(options = {}) {
  const container = options.container || document.body
  const basePath = options.basePath || '/'

  // Prevent double-mount
  if (wrapper) return

  const { mount } = await import('svelte')
  const { default: CoreUIBar } = await import('./CoreUIBar.svelte')

  wrapper = document.createElement('div')
  wrapper.id = 'sb-core-ui'
  container.appendChild(wrapper)

  instance = mount(CoreUIBar, {
    target: wrapper,
    props: { basePath },
  })
}

/**
 * Remove the Core UI Bar from the DOM.
 */
export async function unmountDevTools() {
  if (instance) {
    const { unmount } = await import('svelte')
    unmount(instance)
    instance = null
  }
  if (wrapper) { wrapper.remove(); wrapper = null }
}

/**
 * @deprecated Use mountDevTools instead.
 */
export function mountFlowDebug(options = {}) {
  return mountDevTools(options)
}

/**
 * @deprecated Use mountDevTools instead.
 */
export function mountSceneDebug(options = {}) {
  return mountDevTools(options)
}
