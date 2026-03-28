/**
 * Command Actions — config-driven registry for command menu entries.
 *
 * The command section of core-ui.config.json declares action metadata:
 *   id, label, type, hideFrom, separatorBefore
 *
 * Handler shapes by type:
 *   default:  () => void
 *   toggle:   { execute(), getState() → boolean }
 *   submenu:  { getChildren() → Array<{ id?, label, type, active?, execute }> }
 */

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let _config = { actions: {}, footer: '' }

/** @type {Map<string, any>} id → handler (function or object) */
const _handlers = new Map()

/** @type {Set<Function>} */
const _listeners = new Set()

let _snapshotVersion = 0

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Seed the registry from a menu config object.
 * Called once at app startup.
 *
 * @param {{ actions: Array, footer?: string }} config
 */
export function initCommandActions(config) {
  _config = { ...config }
  _notify()
}

// ---------------------------------------------------------------------------
// Handler registration
// ---------------------------------------------------------------------------

/**
 * Register a handler for a declared action.
 *
 * @param {string} id     Action id (e.g. "core/viewfinder")
 * @param {Function|object} handler
 *   - default type: () => void
 *   - toggle type:  { execute(), getState() }
 *   - submenu type: { getChildren() }
 */
export function registerCommandAction(id, handler) {
  _handlers.set(id, handler)
  _notify()
}

/**
 * Remove a previously registered handler.
 * @param {string} id
 */
export function unregisterCommandAction(id) {
  _handlers.delete(id)
  _notify()
}

// ---------------------------------------------------------------------------
// Dynamic actions (not in config — registered at runtime)
// ---------------------------------------------------------------------------

/** @type {Array} */
let _dynamicActions = []

/**
 * Add dynamic actions (e.g. comments menu items).
 * These are appended after config-declared actions.
 *
 * @param {string} group  Group key for bulk replacement (e.g. "comments")
 * @param {Array<{ id: string, label: string, type?: string, separatorBefore?: boolean }>} actions
 * @param {Record<string, Function|object>} [handlers]  id → handler map
 */
export function setDynamicActions(group, actions, handlers = {}) {
  // Remove previous entries for this group
  _dynamicActions = _dynamicActions.filter(a => a._group !== group)

  for (const action of actions) {
    _dynamicActions.push({ ...action, type: action.type || 'default', _group: group })
  }

  // Register handlers
  for (const [id, handler] of Object.entries(handlers)) {
    _handlers.set(id, handler)
  }

  _notify()
}

/**
 * Remove all dynamic actions for a group.
 * @param {string} group
 */
export function clearDynamicActions(group) {
  const removed = _dynamicActions.filter(a => a._group === group)
  _dynamicActions = _dynamicActions.filter(a => a._group !== group)
  for (const a of removed) {
    _handlers.delete(a.id)
  }
  _notify()
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Check if an action is visible in a given mode.
 * @param {object} action
 * @param {string} mode
 * @returns {boolean}
 */
function actionVisibleInMode(action, mode) {
  const modes = action.modes
  if (!modes) return true
  return modes.includes('*') || modes.includes(mode)
}

/**
 * Get resolved actions for a given mode.
 * Filters by each action's modes array, appends dynamic actions.
 *
 * @param {string} mode  Current mode name
 * @returns {Array<{ id, label, type, separatorBefore?, handler?, active? }>}
 */
export function getActionsForMode(mode) {
  const configActions = Array.isArray(_config.actions) ? _config.actions : []

  const all = [
    ...configActions.filter(a => actionVisibleInMode(a, mode)),
    ..._dynamicActions.filter(a => actionVisibleInMode(a, mode)),
  ]

  return all.map(a => {
    const handler = _handlers.get(a.id)
    const isToggle = a.type === 'toggle'
    const active = isToggle && handler?.getState ? handler.getState() : false

    return {
      id: a.id,
      label: a.label,
      type: a.type || 'default',
      url: a.url || null,
      handler,
      active,
    }
  })
}

/**
 * Execute an action by id.
 * @param {string} id
 */
export function executeAction(id) {
  const handler = _handlers.get(id)
  if (!handler) return
  if (typeof handler === 'function') {
    handler()
  } else if (handler.execute) {
    handler.execute()
  }
  _notify()
}

/**
 * Get submenu children for a submenu-type action.
 * @param {string} id
 * @returns {Array<{ id?, label, type, active?, execute? }>}
 */
export function getActionChildren(id) {
  const handler = _handlers.get(id)
  if (!handler?.getChildren) return []
  return handler.getChildren()
}

// ---------------------------------------------------------------------------
// Reactivity
// ---------------------------------------------------------------------------

/**
 * Subscribe to action changes. Compatible with useSyncExternalStore.
 * @param {Function} callback
 * @returns {Function} Unsubscribe
 */
export function subscribeToCommandActions(callback) {
  _listeners.add(callback)
  return () => _listeners.delete(callback)
}

/**
 * Snapshot for useSyncExternalStore.
 * @returns {string}
 */
export function getCommandActionsSnapshot() {
  return String(_snapshotVersion)
}

function _notify() {
  _snapshotVersion++
  for (const cb of _listeners) {
    try { cb() } catch (err) {
      console.error('[storyboard] Error in command action subscriber:', err)
    }
  }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Reset all state. Only for tests. */
export function _resetCommandActions() {
  _config = { actions: {}, footer: '' }
  _handlers.clear()
  _dynamicActions = []
  _listeners.clear()
  _snapshotVersion = 0
}
