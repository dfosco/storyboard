/**
 * Generic mount utility for React plugin components.
 *
 * Provides a framework-agnostic way to mount React components into any
 * DOM target.  Handles shared style injection (idempotent) and returns
 * a destroy handle for cleanup.
 *
 * Usage:
 *   import { mountSveltePlugin } from '@dfosco/storyboard-core/svelte-plugin-ui'
 *   import MyComponent from './MyComponent.jsx'
 *
 *   const handle = mountSveltePlugin(document.body, MyComponent, { someProp: 'value' })
 *   // later: handle.destroy()
 */

import { createElement, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const STYLE_ID = 'sb-svelte-ui-styles'

let stylesInjected = false

/**
 * Check whether the shared base styles are already present in the document
 * (e.g. bundled by Vite's CSS code-splitting for the ui-entry chunk).
 */
function stylesAlreadyLoaded(): boolean {
  if (typeof document === 'undefined') return false
  // Check for an existing sb- custom property which is defined in the
  // base stylesheet. If any <style> or <link> already defines it, the
  // styles are present and we can skip dynamic injection.
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--sb--bg')
    if (val && val.trim()) return true
  } catch { /* SSR or non-standard env — fall through */ }
  return false
}

/**
 * Inject shared base styles (Tachyons + sb-* tokens) into <head>.
 * Idempotent — only injects once per page. Returns a promise that
 * resolves when the stylesheet is ready.
 */
export function injectStyles(): Promise<void> {
  if (stylesInjected) return Promise.resolve()
  if (typeof document === 'undefined') return Promise.resolve()
  if (document.getElementById(STYLE_ID)) {
    stylesInjected = true
    return Promise.resolve()
  }

  // If Vite already bundled the styles into the page, skip the <link>.
  if (stylesAlreadyLoaded()) {
    stylesInjected = true
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const link = document.createElement('link')
    link.id = STYLE_ID
    link.rel = 'stylesheet'
    link.href = new URL('../styles/tailwind.css', import.meta.url).href
    link.onload = () => resolve()
    link.onerror = () => resolve() // resolve anyway so the UI still appears
    document.head.appendChild(link)
    stylesInjected = true
  })
}

export interface PluginHandle {
  /** Remove the component and its wrapper from the DOM */
  destroy: () => void
  /** The wrapper element containing the React component */
  element: HTMLElement
  /** Resolves when all styles are loaded and the component is ready to show */
  ready: Promise<void>
}

/**
 * Mount a React component into a DOM target.
 *
 * @param target - DOM element to append the component wrapper to
 * @param ComponentClass - React component
 * @param props - Props to pass to the component
 * @returns Handle with destroy() method and a `ready` promise
 */
export function mountSveltePlugin<T extends Record<string, unknown>>(
  target: HTMLElement,
  ComponentClass: ComponentType<T>,
  props?: T,
): PluginHandle {
  const stylesReady = injectStyles()

  const wrapper = document.createElement('div')
  wrapper.classList.add('sb-plugin-root')
  wrapper.style.display = 'contents'
  target.appendChild(wrapper)

  const root: Root = createRoot(wrapper)
  root.render(createElement(ComponentClass, props ?? ({} as T)))

  return {
    element: wrapper,
    ready: stylesReady,
    destroy() {
      root.unmount()
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
