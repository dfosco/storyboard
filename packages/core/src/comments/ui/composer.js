/**
 * Comment composer — Svelte inline text input that appears at click position.
 *
 * Positioned absolutely within the comment overlay. Submits to the comments API.
 * Styled with Tachyons + sb-* custom classes for light/dark mode support.
 */

import { mount, unmount } from 'svelte'
import ComposerComponent from './Composer.svelte'
import { getCachedUser } from '../auth.js'

/**
 * Show the comment composer at a given position within a container.
 * @param {HTMLElement} container - The positioned container element
 * @param {number} xPct - X coordinate as percentage of container width
 * @param {number} yPct - Y coordinate as percentage of container height
 * @param {string} route - Current route path
 * @param {object} [callbacks] - Optional callbacks
 * @param {() => void} [callbacks.onCancel] - Called when composer is dismissed
 * @param {(text: string) => void} [callbacks.onSubmitOptimistic] - Called with text for optimistic submission
 * @returns {{ el: HTMLElement, destroy: () => void }}
 */
export function showComposer(container, xPct, yPct, route, callbacks = {}) {
  const user = getCachedUser()
  const composer = document.createElement('div')
  composer.className = 'sb-composer'
  composer.style.left = `${xPct}%`
  composer.style.top = `${yPct}%`
  composer.style.transform = 'translate(12px, -50%)'

  container.appendChild(composer)

  // Stop click from propagating (prevents placing another composer)
  composer.addEventListener('click', (e) => e.stopPropagation())

  let instance = null

  function destroy() {
    window.removeEventListener('keydown', onEscape, true)
    if (instance) { unmount(instance); instance = null }
    composer.remove()
  }

  // Global Escape handler for when focus is outside the composer
  function onEscape(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      destroy()
      callbacks.onCancel?.()
    }
  }
  window.addEventListener('keydown', onEscape, true)

  instance = mount(ComposerComponent, {
    target: composer,
    props: {
      user,
      route,
      onCancel: () => {
        destroy()
        callbacks.onCancel?.()
      },
      onSubmit: (text) => {
        destroy()
        callbacks.onSubmitOptimistic?.(text)
      },
    },
  })

  // Adjust position to stay within viewport
  requestAnimationFrame(() => {
    const rect = composer.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = 8
    let tx = 12
    let ty = -(rect.height / 2)

    if (rect.left + rect.width > vw - pad) {
      tx = -(rect.width + 12)
    }
    const anchorY = rect.top + rect.height / 2
    const finalBottom = anchorY + ty + rect.height
    if (finalBottom > vh - pad) {
      ty -= (finalBottom - vh + pad)
    }
    if (anchorY + ty < pad) {
      ty = pad - anchorY
    }
    composer.style.transform = `translate(${tx}px, ${ty}px)`
  })

  return { el: composer, destroy }
}
