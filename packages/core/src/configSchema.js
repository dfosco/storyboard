/**
 * Config Schema — canonical shape and defaults for storyboard.config.json.
 *
 * Every consumer of storyboard.config.json should import `getConfig()` to get
 * a fully defaulted, validated config object. New keys added here are safe for
 * existing projects — they always have defaults.
 *
 * @module configSchema
 */

/**
 * @typedef {object} PasteRule
 * @property {string} match    — regex string tested against pasted URLs
 * @property {string} widget   — widget type to create (e.g. "figma-embed", "link-preview")
 * @property {Record<string, string>} [propsMap] — static props merged into widget props
 */

/**
 * @typedef {object} CanvasConfig
 * @property {PasteRule[]} pasteRules       — URL→widget conversion rules (evaluated in order, first match wins)
 * @property {{ embedBehavior: string, ghGuard: string }} github — GitHub-specific embed settings
 */

/**
 * @typedef {object} CommandPaletteConfig
 * @property {string[]} providers — provider IDs to enable
 * @property {string}   ranking   — result ranking strategy
 * @property {CommandPaletteSection[]} [sections] — declarative palette sections
 */

/**
 * @typedef {object} CommandPaletteSection
 * @property {string}  id       — unique section identifier
 * @property {string}  [title]  — section heading in the palette
 * @property {string}  [type]   — "tool-menu" for sub-page entries
 * @property {string}  [label]  — display label (for tool-menu entries)
 * @property {string[]} [keywords] — search keywords
 * @property {CommandPaletteSectionItem[]} [items]   — static entries
 * @property {string}  [source] — dynamic data source: "canvases" | "prototypes" | "stories"
 * @property {string}  [order]  — ordering: "recent" | "alphabetical" | "recent-changes"
 * @property {number}  [limit]  — max items from dynamic source
 * @property {CommandPaletteOption[]} [options] — sub-page options (for tool-menu type)
 */

/**
 * @typedef {object} CommandPaletteSectionItem
 * @property {string} type     — "link" | "action"
 * @property {string} label    — display text
 * @property {string} [url]    — navigation URL (for links)
 * @property {string} [action] — command action ID (for actions)
 * @property {string[]} [keywords] — search keywords
 */

/**
 * @typedef {object} CommandPaletteOption
 * @property {string} label   — display text
 * @property {string} action  — command action ID
 * @property {*}      [value] — action payload
 */

/**
 * @typedef {object} CustomerModeConfig
 * @property {boolean} enabled       — master toggle for customer mode
 * @property {boolean} hideChrome    — hides all toolbars (except canvas tools), branchbar, cmd+k, cmd+.
 * @property {boolean} hideHomepage  — removes the storyboard homepage (leaves empty page)
 * @property {string}  protoHomepage — internal /path that replaces homepage; redirects from / and /viewfinder
 */

/**
 * @typedef {object} StoryboardConfig
 * @property {string}   [customDomain]
 * @property {string}   [devDomain]
 * @property {{ owner: string, name: string }} [repository]
 * @property {{ enabled: boolean }} [modes]
 * @property {{ discussions: { category: string } }} [comments]
 * @property {Record<string, boolean>} [plugins]
 * @property {{ enabled?: boolean, features?: Record<string, boolean>, partials?: Array }} [workshop]
 * @property {Record<string, boolean>} [featureFlags]
 * @property {{ hide?: string[] }} [ui]
 * @property {object}   [toolbar]
 * @property {CanvasConfig} [canvas]
 * @property {CommandPaletteConfig} [commandPalette]
 * @property {CustomerModeConfig} [customerMode]
 */

/** Built-in paste rules shipped with storyboard. */
export const builtinPasteRules = [
  {
    id: 'figma',
    match: 'https?://(?:www\\.)?figma\\.com/',
    widget: 'figma-embed',
    propsMap: { width: 800, height: 450 },
  },
]

/** Default config values. Every key here is safe to access without null checks. */
export const configDefaults = {
  customDomain: '',
  devDomain: '',
  repository: { owner: '', name: '' },
  modes: { enabled: false },
  comments: { discussions: { category: 'Comments' } },
  plugins: {},
  workshop: {
    enabled: false,
    features: { createPrototype: true, createFlow: true, createCanvas: true },
  },
  featureFlags: {},
  ui: {},
  toolbar: {},
  canvas: {
    pasteRules: builtinPasteRules,
    github: {
      embedBehavior: 'link-preview', // "link-preview" | "rich-embed"
      ghGuard: 'copy',               // "copy" | "link" | "off"
    },
  },
  commandPalette: {
    providers: ['prototypes', 'flows', 'canvases', 'pages'],
    ranking: 'frecency',
    sections: [],
  },
  customerMode: {
    enabled: false,
    hideChrome: false,
    hideHomepage: false,
    protoHomepage: '',
  },
}

/**
 * Deep-merge helper that replaces arrays instead of concatenating.
 * Objects are recursively merged; all other values are overwritten.
 */
function mergeConfig(defaults, overrides) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return overrides ?? defaults
  }
  const result = { ...defaults }
  for (const key of Object.keys(overrides)) {
    const val = overrides[key]
    if (val === undefined) continue
    if (Array.isArray(val)) {
      // Arrays replace (e.g. pasteRules, providers) — no concat
      result[key] = val
    } else if (val && typeof val === 'object' && !Array.isArray(val) && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = mergeConfig(defaults[key], val)
    } else {
      result[key] = val
    }
  }
  return result
}

/**
 * Return a fully defaulted config by merging user-provided values over defaults.
 * Safe to call with an empty object or undefined — returns full defaults.
 *
 * @param {Partial<StoryboardConfig>} [raw={}]
 * @returns {StoryboardConfig}
 */
export function getConfig(raw = {}) {
  return mergeConfig(configDefaults, raw)
}

/**
 * Return a copy of the bare defaults (no user overrides).
 * @returns {StoryboardConfig}
 */
export function getConfigDefaults() {
  return JSON.parse(JSON.stringify(configDefaults))
}
