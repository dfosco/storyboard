/**
 * Feature flag system for Storyboard.
 *
 * Flags are defined in storyboard.config.json under "featureFlags" and
 * initialized at app startup via the Vite data plugin.
 *
 * Read priority:  URL hash → localStorage → config defaults
 * Write target:   URL hash (shareable)
 *
 * All flag keys in hash/localStorage are prefixed with "flag." to avoid
 * collisions with scene overrides.
 */

import { getParam, setParam, removeParam, getAllParams } from './session.js'
import { getLocal, setLocal, removeLocal, getAllLocal } from './localStorage.js'

const FLAG_PREFIX = 'flag.'

/** Module-level storage for config defaults */
let _defaults = {}

/**
 * Initialize the feature flag system with config defaults.
 * Seeds localStorage with defaults (doesn't overwrite existing values).
 * @param {Record<string, boolean>} defaults - Flag key → default value
 */
export function initFeatureFlags(defaults = {}) {
  _defaults = { ...defaults }
  // Seed localStorage with defaults (don't overwrite existing)
  for (const [key, value] of Object.entries(_defaults)) {
    if (getLocal(FLAG_PREFIX + key) === null) {
      setLocal(FLAG_PREFIX + key, String(value))
    }
  }
}

/**
 * Read a flag value. Priority: hash → localStorage → config default.
 * @param {string} key - Flag key (without prefix)
 * @returns {boolean}
 */
export function getFlag(key) {
  // 1. URL hash (highest priority)
  const hashVal = getParam(FLAG_PREFIX + key)
  if (hashVal !== null) return hashVal === 'true'

  // 2. localStorage
  const localVal = getLocal(FLAG_PREFIX + key)
  if (localVal !== null) return localVal === 'true'

  // 3. Config default
  return _defaults[key] ?? false
}

/**
 * Set a flag value. Writes to URL hash for shareability.
 * @param {string} key - Flag key (without prefix)
 * @param {boolean} value
 */
export function setFlag(key, value) {
  setParam(FLAG_PREFIX + key, String(value))
}

/**
 * Toggle a flag. Reads current value, writes opposite to hash.
 * @param {string} key - Flag key (without prefix)
 */
export function toggleFlag(key) {
  setFlag(key, !getFlag(key))
}

/**
 * Get all flags with their default and current (resolved) values.
 * @returns {Record<string, { default: boolean, current: boolean }>}
 */
export function getAllFlags() {
  const result = {}
  for (const key of Object.keys(_defaults)) {
    result[key] = {
      default: _defaults[key] ?? false,
      current: getFlag(key),
    }
  }
  return result
}

/**
 * Reset all flags — removes hash and localStorage overrides.
 * Flags revert to config defaults.
 */
export function resetFlags() {
  const allParams = getAllParams()
  for (const paramKey of Object.keys(allParams)) {
    if (paramKey.startsWith(FLAG_PREFIX)) {
      removeParam(paramKey)
    }
  }
  const allLocal = getAllLocal()
  for (const localKey of Object.keys(allLocal)) {
    if (localKey.startsWith(FLAG_PREFIX)) {
      removeLocal(localKey)
    }
  }
}

/**
 * Get all registered flag keys.
 * @returns {string[]}
 */
export function getFlagKeys() {
  return Object.keys(_defaults)
}
