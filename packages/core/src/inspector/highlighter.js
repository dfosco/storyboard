/**
 * Lightweight shiki highlighter for the inspector panel.
 *
 * Uses shiki/core with only the four languages the inspector needs,
 * avoiding the full shiki bundle that registers 200+ lazy-loaded
 * language chunks (which break in deployed/static environments).
 */
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'

export async function createInspectorHighlighter() {
  const [tsx, jsx, javascript, typescript, githubDark, wasm] =
    await Promise.all([
      import('shiki/dist/langs/tsx.mjs'),
      import('shiki/dist/langs/jsx.mjs'),
      import('shiki/dist/langs/javascript.mjs'),
      import('shiki/dist/langs/typescript.mjs'),
      import('shiki/dist/themes/github-dark.mjs'),
      import('shiki/wasm'),
    ])

  return createHighlighterCore({
    themes: [githubDark.default],
    langs: [tsx.default, jsx.default, javascript.default, typescript.default],
    engine: createOnigurumaEngine(wasm),
  })
}
