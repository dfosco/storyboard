/**
 * Command Palette Config — runtime store for commandPalette config.
 * Framework-agnostic (zero npm dependencies).
 */

import { getConfig } from './configStore.js'

let _config = { sections: [] }

/**
 * Initialize the command palette config.
 * @param {object} config - The commandPalette object from storyboard.config.json
 */
export function initCommandPaletteConfig(config) {
  console.log('[devlog] initCommandPaletteConfig called:', { sectionsCount: config?.sections?.length || 0, keys: Object.keys(config || {}) })
  _config = { sections: [], ...config }
}

/**
 * Get the current command palette config.
 * Falls back to the unified config store if the legacy store wasn't initialized.
 * @returns {{ sections: Array }}
 */
export function getCommandPaletteConfig() {
  if (_config.sections.length === 0) {
    const uc = getConfig('commandPalette')
    console.log('[devlog] getCommandPaletteConfig fallback:', { ucSections: uc?.sections?.length || 0, localSections: _config.sections.length })
    if (uc?.sections?.length > 0) {
      _config = { sections: [], ...uc }
    }
  }
  return _config
}
