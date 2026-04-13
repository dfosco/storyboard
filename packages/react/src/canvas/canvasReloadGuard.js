/**
 * Client-side HMR reload guard for canvas pages.
 *
 * Prevents full-reloads AND HMR component updates from reaching the browser
 * while a canvas route is active. Without this, editing any file triggers
 * location.reload() and destroys all canvas editing state.
 *
 * Three attack vectors are guarded:
 *  1. `full-reload` message  — mutates payload.path so Vite skips reload
 *  2. `update` message       — empties payload.updates so modules stay put
 *  3. WS disconnect/reconnect — returns a never-resolving promise to block
 *                               Vite's automatic location.reload() after ping
 *
 * Opt out with ?canvas-hmr in the URL (useful for canvas UI development).
 */

let guardActive = false

export function enableCanvasGuard() {
  guardActive = true
}

export function disableCanvasGuard() {
  guardActive = false
}

export function isCanvasGuardActive() {
  return guardActive
}

if (import.meta.hot) {
  const hmrOptOut = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('canvas-hmr')

  if (!hmrOptOut) {
    // 1. Prevent full page reload.
    //    Vite's client skips reload when payload.path is an .html path
    //    that doesn't match the current page pathname.
    import.meta.hot.on('vite:beforeFullReload', (payload) => {
      if (guardActive) {
        payload.path = '/__canvas_guard_noop__.html'
        console.debug('[canvas] Suppressed full-reload while canvas is active')
      }
    })

    // 2. Prevent HMR module updates — component re-renders lose canvas state.
    import.meta.hot.on('vite:beforeUpdate', (payload) => {
      if (guardActive) {
        payload.updates = []
        console.debug('[canvas] Suppressed HMR update while canvas is active')
      }
    })

    // 3. Prevent reload on WebSocket disconnect/reconnect.
    //    Vite polls for the server then calls location.reload().
    //    A never-resolving promise blocks the reload without error.
    import.meta.hot.on('vite:ws:disconnect', () => {
      if (guardActive) {
        console.debug('[canvas] WS disconnected — suppressing automatic reload')
        return new Promise(() => {})
      }
    })
  }
}
