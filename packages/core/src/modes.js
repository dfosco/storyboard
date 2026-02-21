/**
 * Design Modes — mode registry, switching, and cross-plugin event bus.
 *
 * Framework-agnostic (zero npm dependencies).
 * State is stored in the ?mode= URL search param so it's shareable and bookmarkable.
 */

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const _modes = new Map()
const _listeners = new Set()
const _eventListeners = new Map()

const DEFAULT_MODE = 'prototype'

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Register a mode plugin.
 *
 * @param {string} name   Unique mode identifier (e.g. 'prototype', 'present')
 * @param {object} config Mode configuration
 * @param {string} config.label  Human-readable label for UI
 * @param {string} [config.icon] Octicon name or SVG string
 * @param {string|string[]} [config.className] Extra class(es) applied to <html> when active
 * @param {Function} [config.onActivate]   Called when mode becomes active
 * @param {Function} [config.onDeactivate] Called when leaving this mode
 * @param {Array}  [config.tools]    Tool definitions for the tools toolbar
 * @param {Array}  [config.devTools] Tool definitions for the dev toolbar
 */
export function registerMode(name, config = {}) {
  if (_modes.has(name)) {
    console.warn(`[storyboard] Mode "${name}" is already registered — overwriting.`)
  }
  _modes.set(name, { name, label: config.label ?? name, ...config })
  _notify()
}

/**
 * Remove a previously registered mode.
 */
export function unregisterMode(name) {
  if (name === DEFAULT_MODE) {
    console.warn(`[storyboard] Cannot unregister the default mode "${DEFAULT_MODE}".`)
    return
  }
  const mode = _modes.get(name)
  if (!mode) return
  // If this mode is currently active, deactivate first
  if (getCurrentMode() === name) {
    deactivateMode()
  }
  _modes.delete(name)
  _notify()
}

/**
 * Get all registered modes in insertion order.
 *
 * @returns {Array<{ name: string, label: string, icon?: string }>}
 */
export function getRegisteredModes() {
  return Array.from(_modes.values())
}

// ---------------------------------------------------------------------------
// Switching
// ---------------------------------------------------------------------------

/**
 * Read the active mode from the ?mode= URL search param.
 * Falls back to DEFAULT_MODE when the param is absent or unrecognised.
 */
export function getCurrentMode() {
  if (typeof window === 'undefined') return DEFAULT_MODE
  const url = new URL(window.location.href)
  const param = url.searchParams.get('mode')
  if (param && _modes.has(param)) return param
  return DEFAULT_MODE
}

/**
 * Switch to a registered mode.
 * Calls onDeactivate on the previous mode and onActivate on the new one.
 *
 * @param {string} name    Mode to activate
 * @param {object} [options] Passed through to onActivate
 */
export function activateMode(name, options) {
  if (!_modes.has(name)) {
    console.warn(`[storyboard] Mode "${name}" is not registered.`)
    return
  }

  const prev = getCurrentMode()
  if (prev === name) return

  // Deactivate previous
  const prevMode = _modes.get(prev)
  _removeModeClasses(prevMode)
  if (prevMode?.onDeactivate) prevMode.onDeactivate()
  emit('mode:deactivate', prev)

  // Update URL param
  const url = new URL(window.location.href)
  if (name === DEFAULT_MODE) {
    url.searchParams.delete('mode')
  } else {
    url.searchParams.set('mode', name)
  }
  window.history.replaceState(null, '', url.toString())

  // Activate new
  const newMode = _modes.get(name)
  _applyModeClasses(newMode)
  if (newMode?.onActivate) newMode.onActivate(options)
  emit('mode:activate', name, options)
  emit('mode:change', prev, name)

  _notify()
}

/**
 * Return to the default mode.
 */
export function deactivateMode() {
  activateMode(DEFAULT_MODE)
}

// ---------------------------------------------------------------------------
// Reactivity (for useSyncExternalStore)
// ---------------------------------------------------------------------------

/**
 * Subscribe to mode changes. Compatible with React's useSyncExternalStore.
 *
 * @param {Function} callback Called whenever the mode or registry changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToMode(callback) {
  _listeners.add(callback)
  // Also listen to popstate so browser back/forward syncs mode
  const onPopState = () => {
    _notify()
  }
  window.addEventListener('popstate', onPopState)
  return () => {
    _listeners.delete(callback)
    window.removeEventListener('popstate', onPopState)
  }
}

/**
 * Snapshot for useSyncExternalStore.
 * Returns a serialised string that changes when mode or registry changes.
 */
export function getModeSnapshot() {
  const mode = getCurrentMode()
  const names = Array.from(_modes.keys()).join(',')
  return `${mode}|${names}`
}

// ---------------------------------------------------------------------------
// Event bus (cross-plugin communication)
// ---------------------------------------------------------------------------

/**
 * Listen for an event.
 *
 * @param {string} event   Event name (e.g. 'mode:change', 'room:create')
 * @param {Function} callback
 */
export function on(event, callback) {
  if (!_eventListeners.has(event)) {
    _eventListeners.set(event, new Set())
  }
  _eventListeners.get(event).add(callback)
}

/**
 * Remove an event listener.
 */
export function off(event, callback) {
  const listeners = _eventListeners.get(event)
  if (listeners) listeners.delete(callback)
}

/**
 * Emit an event to all registered listeners.
 *
 * @param {string} event Event name
 * @param {...*} args     Arguments forwarded to listeners
 */
export function emit(event, ...args) {
  const listeners = _eventListeners.get(event)
  if (!listeners) return
  for (const cb of listeners) {
    try {
      cb(...args)
    } catch (err) {
      console.error(`[storyboard] Error in "${event}" listener:`, err)
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Collect all classes for a mode: the automatic `storyboard-mode-{name}`
 * plus any custom `className` string(s) from the mode config.
 */
function _getModeClasses(mode) {
  if (!mode) return []
  const classes = [`storyboard-mode-${mode.name}`]
  if (mode.className) {
    const extra = Array.isArray(mode.className) ? mode.className : mode.className.split(/\s+/)
    classes.push(...extra.filter(Boolean))
  }
  return classes
}

function _applyModeClasses(mode) {
  if (typeof document === 'undefined') return
  const classes = _getModeClasses(mode)
  if (classes.length) document.documentElement.classList.add(...classes)
}

function _removeModeClasses(mode) {
  if (typeof document === 'undefined') return
  const classes = _getModeClasses(mode)
  if (classes.length) document.documentElement.classList.remove(...classes)
}

/**
 * Apply classes for the current mode on first load.
 * Called automatically so the initial mode is reflected in the DOM.
 */
export function syncModeClasses() {
  const name = getCurrentMode()
  const mode = _modes.get(name)
  if (mode) _applyModeClasses(mode)
}

function _notify() {
  for (const cb of _listeners) {
    try {
      cb()
    } catch (err) {
      console.error('[storyboard] Error in mode subscriber:', err)
    }
  }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Reset all internal state. Only for use in tests.
 */
export function _resetModes() {
  _modes.clear()
  _listeners.clear()
  _eventListeners.clear()
}
