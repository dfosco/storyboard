/**
 * CodePen URL utilities — parse, validate, and convert CodePen URLs
 * to their embeddable format.
 *
 * Supported URL formats:
 *   https://codepen.io/{user}/pen/{penId}
 *   https://codepen.io/{user}/full/{penId}
 *   https://codepen.io/{user}/details/{penId}
 *   https://codepen.io/{user}/embed/{penId}
 */

const CODEPEN_RE = /^https?:\/\/codepen\.io\/([^/]+)\/(pen|full|details|embed)\/([A-Za-z0-9]+)/

/**
 * Check if a URL is a valid CodePen pen URL.
 */
export function isCodePenUrl(url) {
  if (!url) return false
  return CODEPEN_RE.test(url)
}

/**
 * Convert any CodePen pen URL to the embed format.
 * Defaults to showing the result tab with a dark theme.
 */
export function toCodePenEmbedUrl(url) {
  const m = url?.match(CODEPEN_RE)
  if (!m) return ''
  const [, user, , penId] = m
  return `https://codepen.io/${user}/embed/${penId}?default-tab=result&editable=true`
}

/**
 * Extract a human-readable title from a CodePen URL.
 * Returns the pen ID and username.
 */
export function getCodePenTitle(url) {
  const m = url?.match(CODEPEN_RE)
  if (!m) return 'CodePen'
  return `${m[1]}/${m[3]}`
}

/**
 * Extract the username from a CodePen URL.
 */
export function getCodePenUser(url) {
  const m = url?.match(CODEPEN_RE)
  return m?.[1] || ''
}
