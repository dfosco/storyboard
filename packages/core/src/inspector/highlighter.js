/**
 * Lightweight shiki highlighter for the inspector panel.
 *
 * Uses shiki/core with only the four languages the inspector needs,
 * avoiding the full shiki bundle that registers 200+ lazy-loaded
 * language chunks (which break in deployed/static environments).
 *
 * Each import() has .catch(() => null) so the highlighter gracefully
 * returns null when shiki is unavailable (e.g. in consumer repos).
 * The vite.ui.config.js externalization config ensures these imports
 * remain as bare specifiers in the compiled UI bundle.
 */
export async function createInspectorHighlighter() {
  try {
    const [shikiCore, oniguruma, tsx, jsx, javascript, typescript, githubDark, wasm] =
      await Promise.all([
        import(/* @vite-ignore */ 'shiki/core').catch(() => null),
        import(/* @vite-ignore */ 'shiki/engine/oniguruma').catch(() => null),
        import(/* @vite-ignore */ 'shiki/dist/langs/tsx.mjs').catch(() => null),
        import(/* @vite-ignore */ 'shiki/dist/langs/jsx.mjs').catch(() => null),
        import(/* @vite-ignore */ 'shiki/dist/langs/javascript.mjs').catch(() => null),
        import(/* @vite-ignore */ 'shiki/dist/langs/typescript.mjs').catch(() => null),
        import(/* @vite-ignore */ 'shiki/dist/themes/github-dark.mjs').catch(() => null),
        import(/* @vite-ignore */ 'shiki/wasm').catch(() => null),
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
