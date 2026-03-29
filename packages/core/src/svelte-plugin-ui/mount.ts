/**
 * Generic mount utility for Svelte plugin components.
 *
 * Provides a framework-agnostic way to mount Svelte components into any
 * DOM target.  Handles shared style injection (idempotent) and returns
 * a destroy handle for cleanup.
 *
 * Usage:
 *   import { mountSveltePlugin } from '@dfosco/storyboard-core/svelte-plugin-ui'
 *   import MyComponent from './MyComponent.svelte'
 *
 *   const handle = mountSveltePlugin(document.body, MyComponent, { someProp: 'value' })
 *   // later: handle.destroy()
 */

import { mount, unmount, type Component } from 'svelte'

const STYLE_ID = 'sb-svelte-ui-styles'

let stylesInjected = false

/**
 * Inject shared base styles (Tachyons + sb-* tokens) into <head>.
 * Idempotent — only injects once per page.
 */
export function injectStyles(): void {
  if (stylesInjected) return
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) {
    stylesInjected = true
    return
  }

  const link = document.createElement('link')
  link.id = STYLE_ID
  link.rel = 'stylesheet'
  link.href = new URL('../styles/tailwind.css', import.meta.url).href
  document.head.appendChild(link)
  stylesInjected = true
}

export interface PluginHandle {
  /** Remove the component and its wrapper from the DOM */
  destroy: () => void
  /** The wrapper element containing the Svelte component */
  element: HTMLElement
}

/**
 * Mount a Svelte component into a DOM target.
 *
 * @param target - DOM element to append the component wrapper to
 * @param ComponentClass - Svelte component constructor
 * @param props - Props to pass to the component
 * @returns Handle with destroy() method
 */
export function mountSveltePlugin<T extends Record<string, unknown>>(
  target: HTMLElement,
  ComponentClass: Component<T>,
  props?: T,
): PluginHandle {
  injectStyles()

  const wrapper = document.createElement('div')
  wrapper.classList.add('sb-plugin-root')
  wrapper.style.display = 'contents'
  target.appendChild(wrapper)

  const instance = mount(ComponentClass, {
    target: wrapper,
    props: props ?? ({} as T),
  })

  return {
    element: wrapper,
    destroy() {
      unmount(instance)
      wrapper.remove()
    },
  }
}

/**
 * Reset style injection state. Only for use in tests.
 */
export function _resetStyles(): void {
  stylesInjected = false
  if (typeof document !== 'undefined') {
    document.getElementById(STYLE_ID)?.remove()
  }
}
