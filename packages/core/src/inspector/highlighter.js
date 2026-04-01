/**
 * Lightweight highlight.js highlighter for the inspector panel.
 *
 * Uses highlight.js/core with only the languages the inspector needs
 * (javascript, typescript, xml for JSX), producing small bundles with
 * no WASM dependencies.
 *
 * Theme is configurable via toolbar.config.json's `highlighting` key:
 *   { "highlighting": { "dark": "github-dark-dimmed", "light": "github" } }
 *
 * Returns an adapter object matching the codeToHtml() call signature
 * used by InspectorPanel.svelte.
 */

import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import { getToolbarConfig } from '../toolbarConfigStore.js'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
// Aliases for JSX/TSX — highlight.js uses xml for the JSX part,
// but we map these to typescript which handles JSX well enough
hljs.registerLanguage('jsx', javascript)
hljs.registerLanguage('tsx', typescript)

/** Map of highlight.js theme name → loaded CSS text (cached). */
const _loadedThemes = new Map()

/**
 * Get the highlight.js theme name for the current context.
 * Reads highlighting config (dark/light groups) from toolbar config.
 * Uses theme sync targets to decide whether to follow global theme.
 * When code boxes are not synced (default), always uses the dark theme.
 */
function getThemeName() {
  const config = getToolbarConfig()
  const highlighting = config?.highlighting || {}
  const darkTheme = highlighting.dark || 'github-dark-dimmed'
  const lightTheme = highlighting.light || 'github'

  // Check if code boxes should follow the global theme
  let codeBoxesSynced = false
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('sb-theme-sync')
      if (raw) codeBoxesSynced = JSON.parse(raw).codeBoxes === true
    } catch {}
  }

  // When not synced, always use dark theme for code boxes
  if (!codeBoxesSynced) return darkTheme

  // When synced, follow the current resolved theme
  const sbTheme = typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-sb-theme') || 'dark'
    : 'dark'

  return sbTheme.startsWith('dark') ? darkTheme : lightTheme
}

/**
 * Ensure a highlight.js theme CSS is loaded into the document.
 * Dynamically imports the CSS file and injects a <style> tag.
 */
async function ensureThemeLoaded(themeName) {
  if (_loadedThemes.has(themeName)) return
  try {
    // Dynamic import of CSS — Vite handles this
    await import(`highlight.js/styles/${themeName}.css`)
    _loadedThemes.set(themeName, true)
  } catch {
    // Fallback: try github-dark-dimmed if the requested theme doesn't exist
    if (themeName !== 'github-dark-dimmed') {
      try {
        await import('highlight.js/styles/github-dark-dimmed.css')
        _loadedThemes.set(themeName, true)
      } catch { /* ignore */ }
    }
  }
}

/**
 * Escape HTML entities in a string.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Create the inspector highlighter.
 * Returns an object with codeToHtml() matching the Shiki API shape.
 *
 * @returns {Promise<{ codeToHtml: (code: string, options: { lang?: string, theme?: string, decorations?: Array }) => string }>}
 */
export async function createInspectorHighlighter() {
  const themeName = getThemeName()
  await ensureThemeLoaded(themeName)

  return {
    /**
     * Highlight code and return HTML string.
     *
     * @param {string} code - Source code to highlight
     * @param {object} options
     * @param {string} [options.lang] - Language identifier
     * @param {string} [options.theme] - Ignored (theme comes from config)
     * @param {Array<{ start: { line: number }, end: { line: number }, properties: { class: string } }>} [options.decorations]
     * @returns {string} HTML string with highlighted code
     */
    codeToHtml(code, options = {}) {
      const lang = options.lang || 'javascript'
      const decorations = options.decorations || []

      // Ensure current theme is loaded (non-blocking, already cached after first call)
      const currentTheme = getThemeName()
      ensureThemeLoaded(currentTheme)

      // Highlight the code
      let highlighted
      try {
        highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
      } catch {
        highlighted = escapeHtml(code)
      }

      // Split into lines and wrap each in a <span class="line">
      const lines = highlighted.split('\n')
      // Build a set of highlighted line numbers (0-indexed from decorations)
      const highlightedLines = new Set()
      for (const dec of decorations) {
        if (dec.start && dec.properties?.class) {
          for (let i = dec.start.line; i <= (dec.end?.line ?? dec.start.line); i++) {
            highlightedLines.add(i)
          }
        }
      }

      const wrappedLines = lines.map((line, i) => {
        const classes = ['line']
        if (highlightedLines.has(i)) classes.push('highlighted-line')
        return `<span class="${classes.join(' ')}">${line}</span>`
      }).join('\n')

      return `<pre class="hljs"><code>${wrappedLines}</code></pre>`
    },
  }
}
