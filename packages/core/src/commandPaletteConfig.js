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
  console.log('[devlog] initCommandPaletteConfig called with:', JSON.stringify(config)?.slice(0, 200), new Error().stack?.split('\n').slice(1, 4).join(' ← '))
  _config = { sections: [], ...config }
}

/**
 * Get the current command palette config.
 * Falls back to the unified config store if the legacy store has no sections.
 * @returns {{ sections: Array }}
 */
export function getCommandPaletteConfig() {
  if (_config.sections.length === 0) {
    const uc = getConfig('commandPalette')
    if (uc?.sections?.length > 0) {
      console.log('[devlog] getCommandPaletteConfig: legacy store empty, using configStore fallback with', uc.sections.length, 'sections')
      _config = { sections: [], ...uc }
    }
  }
  return _config
}
