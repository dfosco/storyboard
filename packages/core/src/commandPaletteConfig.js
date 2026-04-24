/**
 * Command Palette Config — runtime store for commandPalette config.
 * Framework-agnostic (zero npm dependencies).
 */

let _config = { sections: [] }

/**
 * Initialize the command palette config.
 * @param {object} config - The commandPalette object from storyboard.config.json
 */
export function initCommandPaletteConfig(config) {
  _config = { sections: [], ...config }
}

/**
 * Get the current command palette config.
 * @returns {{ sections: Array }}
 */
export function getCommandPaletteConfig() {
  return _config
}
