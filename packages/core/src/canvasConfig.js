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

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Initialize canvas config from storyboard.config.json's "canvas" key.
 * Called by mountStoryboardCore.
 *
 * @param {{ pasteRules?: object[] }} [config]
 */
export function initCanvasConfig(config = {}) {
  _pasteRules = Array.isArray(config.pasteRules) ? config.pasteRules : []
}

/**
 * Get the configured paste rules (raw config objects).
 *
 * @returns {object[]}
 */
export function getPasteRules() {
  return _pasteRules
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Reset all internal state. Only for use in tests.
 */
export function _resetCanvasConfig() {
  _pasteRules = []
}
