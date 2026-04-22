/**
 * Canvas Config — project-level overrides for canvas behavior.
 *
 * Client repos use the "canvas" key in storyboard.config.json to customize
 * canvas paste rules and other canvas-level settings.
 *
 *   {
 *     "canvas": {
 *       "pasteRules": [
 *         { "pattern": "youtube\\.com/watch", "type": "link-preview", "props": { "url": "$url" } }
 *       ]
 *     }
 *   }
 *
 * Framework-agnostic (zero npm dependencies).
 */

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let _pasteRules = []
let _terminal = {}
let _agents = {}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Initialize canvas config from storyboard.config.json's "canvas" key.
 * Called by mountStoryboardCore.
 *
 * @param {{ pasteRules?: object[], terminal?: object, agents?: object }} [config]
 */
export function initCanvasConfig(config = {}) {
  _pasteRules = Array.isArray(config.pasteRules) ? config.pasteRules : []
  _terminal = config.terminal && typeof config.terminal === 'object' ? config.terminal : {}
  _agents = config.agents && typeof config.agents === 'object' ? config.agents : {}
}

/**
 * Get the configured paste rules (raw config objects).
 *
 * @returns {object[]}
 */
export function getPasteRules() {
  return _pasteRules
}

/**
 * Get terminal widget configuration.
 *
 * @returns {{ theme?: object, fontSize?: number, fontFamily?: string, prompt?: string }}
 */
export function getTerminalConfig() {
  return _terminal
}

/**
 * Get agent configurations.
 *
 * @returns {object}
 */
export function getAgentsConfig() {
  return _agents
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Reset all internal state. Only for use in tests.
 */
export function _resetCanvasConfig() {
  _pasteRules = []
  _terminal = {}
  _agents = {}
}
