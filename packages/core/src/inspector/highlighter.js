/**
 * Lightweight shiki highlighter for the inspector panel.
 *
 * Uses shiki/core with only the four languages the inspector needs,
 * avoiding the full shiki bundle that registers 200+ lazy-loaded
 * language chunks (which break in deployed/static environments).
 *
 * Each import() has .catch() so consumer bundlers (esbuild dep optimizer)
 * treat them as runtime-fallible and don't fail at build time when shiki
 * isn't installed. Returns null when shiki is unavailable.
 */
export async function createInspectorHighlighter() {
  try {
    const [shikiCore, oniguruma, tsx, jsx, javascript, typescript, githubDark, wasm] =
      await Promise.all([
        import('shiki/core').catch(() => null),
        import('shiki/engine/oniguruma').catch(() => null),
        import('shiki/dist/langs/tsx.mjs').catch(() => null),
        import('shiki/dist/langs/jsx.mjs').catch(() => null),
        import('shiki/dist/langs/javascript.mjs').catch(() => null),
        import('shiki/dist/langs/typescript.mjs').catch(() => null),
        import('shiki/dist/themes/github-dark.mjs').catch(() => null),
        import('shiki/wasm').catch(() => null),
      ])

    if (!shikiCore || !oniguruma || !tsx || !jsx || !javascript || !typescript || !githubDark || !wasm) {
      return null
    }

    return shikiCore.createHighlighterCore({
      themes: [githubDark.default],
      langs: [tsx.default, jsx.default, javascript.default, typescript.default],
      engine: oniguruma.createOnigurumaEngine(wasm),
    })
  } catch {
    return null
  }
}
