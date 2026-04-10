/**
 * Canvas toolbar tool module — zoom, undo/redo, and fit controls.
 *
 * Provides actions via custom events (Svelte↔React bridge).
 * Uses the unique "canvas-toolbar" render type.
 */
export const id = 'canvas-toolbar'

const ZOOM_STEP = 10
const ZOOM_MIN = 25
const ZOOM_MAX = 200

export async function handler() {
  return {
    zoomIn(currentZoom) {
      const next = Math.min(ZOOM_MAX, currentZoom + ZOOM_STEP)
      document.dispatchEvent(new CustomEvent('storyboard:canvas:set-zoom', { detail: { zoom: next } }))
    },
    zoomOut(currentZoom) {
      const next = Math.max(ZOOM_MIN, currentZoom - ZOOM_STEP)
      document.dispatchEvent(new CustomEvent('storyboard:canvas:set-zoom', { detail: { zoom: next } }))
    },
    zoomReset() {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:set-zoom', { detail: { zoom: 100 } }))
    },
    zoomToFit() {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:zoom-to-fit'))
    },
    undo() {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:undo'))
    },
    redo() {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:redo'))
    },
    toggleSnap() {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:toggle-snap'))
    },
    ZOOM_MIN,
    ZOOM_MAX,
  }
}

export async function component() {
  const mod = await import('../../CanvasToolbar.svelte')
  return mod.default
}
