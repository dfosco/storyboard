/**
 * Paste Rules — config-driven paste routing for canvas widgets.
 *
 * Extracts the URL/text → widget-type decision logic from CanvasPage.jsx into
 * a deterministic, ordered rule engine.  Built-in rules replicate current
 * behavior; config rules from storyboard.config.json are prepended so they
 * take priority.
 *
 * Image paste and widget-ref paste remain in CanvasPage.jsx because they
 * require clipboard / canvas API access that doesn't belong here.
 */

import { isFigmaUrl, sanitizeFigmaUrl } from './figmaUrl.js'

// ---------------------------------------------------------------------------
// Branch-prefix pattern (matches /branch--<name> at start of pathname)
// ---------------------------------------------------------------------------

const BRANCH_PREFIX_RE = /^\/branch--[^/]+/

// ---------------------------------------------------------------------------
// Paste context — captures origin + base-path once per effect cycle
// ---------------------------------------------------------------------------

/**
 * Build a paste context object that URL rules can query.
 *
 * @param {string} origin  - `window.location.origin`
 * @param {string} basePath - `import.meta.env.BASE_URL` with trailing slash stripped
 * @returns {PasteContext}
 */
export function createPasteContext(origin, basePath) {
  const normalizedBase = basePath.replace(/\/$/, '')
  const baseUrl = origin + normalizedBase

  return {
    origin,
    basePath: normalizedBase,
    baseUrl,

    /**
     * Check whether a raw URL string points at the same Storyboard origin,
     * accounting for branch-deploy prefixes.
     * Uses parsed URL comparison (not string prefix) to avoid host spoofing.
     */
    isSameOrigin(text) {
      const parsed = this.parseUrl(text)
      if (!parsed || parsed.origin !== origin) return false
      const pathname = parsed.pathname
      // Exact base path or sub-path under base
      if (normalizedBase && (pathname === normalizedBase || pathname.startsWith(normalizedBase + '/'))) return true
      // Root base path — anything on the same origin qualifies
      if (!normalizedBase) return true
      // Branch deploy: /branch--<name>/...
      return BRANCH_PREFIX_RE.test(pathname)
    },

    /**
     * Strip the base path (or any branch prefix) from a pathname to produce a
     * portable prototype `src` value.
     */
    extractSrc(pathname) {
      if (normalizedBase && pathname.startsWith(normalizedBase)) {
        return pathname.slice(normalizedBase.length) || '/'
      }
      const m = pathname.match(BRANCH_PREFIX_RE)
      if (m) return pathname.slice(m[0].length) || '/'
      return pathname
    },

    /**
     * Parse text as an http(s) URL.  Returns the URL object or null.
     */
    parseUrl(text) {
      try {
        const url = new URL(text)
        return (url.protocol === 'http:' || url.protocol === 'https:') ? url : null
      } catch {
        return null
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Built-in rules (ordered — first match wins)
// ---------------------------------------------------------------------------

/** @type {PasteRule[]} */
const BUILTIN_RULES = [
  {
    name: 'figma',
    match: (text) => isFigmaUrl(text),
    resolve: (text) => ({
      type: 'figma-embed',
      props: { url: sanitizeFigmaUrl(text), width: 800, height: 450 },
    }),
  },
  {
    name: 'same-origin',
    match: (text, ctx) => ctx.isSameOrigin(text),
    resolve: (text, ctx) => {
      const url = ctx.parseUrl(text) // guaranteed non-null — match already verified
      const pathPortion = url.pathname + url.search + url.hash
      const src = ctx.extractSrc(pathPortion)
      return {
        type: 'prototype',
        props: { src: src || '/', originalSrc: src || '/', label: '', width: 800, height: 600 },
      }
    },
  },
  {
    name: 'link-preview',
    match: (text, ctx) => ctx.parseUrl(text) !== null,
    resolve: (text) => ({
      type: 'link-preview',
      props: { url: text, title: '' },
    }),
  },
  {
    name: 'markdown',
    match: () => true,
    resolve: (text) => ({
      type: 'markdown',
      props: { content: text },
    }),
  },
]

// ---------------------------------------------------------------------------
// Config rule compiler
// ---------------------------------------------------------------------------

/**
 * Compile a config rule object (from storyboard.config.json `canvas.pasteRules`)
 * into the internal `{ name, match, resolve }` shape.
 *
 * Config format:
 * ```json
 * { "pattern": "youtube\\.com/watch", "type": "link-preview", "props": { "url": "$url" } }
 * ```
 *
 * `$url` in props values is replaced with the pasted text at resolve time.
 *
 * @param {object} rule
 * @returns {PasteRule | null}  null if the rule is invalid
 */
export function compileConfigRule(rule) {
  if (!rule || typeof rule.pattern !== 'string' || typeof rule.type !== 'string') return null

  let re
  try {
    re = new RegExp(rule.pattern)
  } catch {
    console.warn(`[pasteRules] Invalid regex pattern: ${rule.pattern}`)
    return null
  }

  const propsTemplate = rule.props || {}

  return {
    name: `config:${rule.pattern}`,
    match: (text) => re.test(text),
    resolve: (text) => {
      const props = {}
      for (const [k, v] of Object.entries(propsTemplate)) {
        props[k] = typeof v === 'string' ? v.replace(/\$url/g, text) : v
      }
      return { type: rule.type, props }
    },
  }
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Resolve pasted text into a widget `{ type, props }` by running through
 * ordered rules.  Config rules (if any) run before built-in rules.
 *
 * @param {string} text            - trimmed clipboard text
 * @param {PasteContext} context    - from `createPasteContext()`
 * @param {object[]} [configRules] - raw rule objects from storyboard.config.json
 * @returns {{ type: string, props: object } | null}
 */
export function resolvePaste(text, context, configRules = []) {
  const compiled = configRules
    .map(compileConfigRule)
    .filter(Boolean)

  const rules = [...compiled, ...BUILTIN_RULES]

  for (const rule of rules) {
    if (rule.match(text, context)) {
      return rule.resolve(text, context)
    }
  }

  // Should never reach here — markdown catches everything
  return null
}

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

export { BUILTIN_RULES, BRANCH_PREFIX_RE }
