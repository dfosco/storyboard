/**
 * Lightweight shiki highlighter for the inspector panel.
 *
 * Uses shiki/core with only the four languages the inspector needs,
 * avoiding the full shiki bundle that registers 200+ lazy-loaded
 * language chunks (which break in deployed/static environments).
 *
 * Import specifiers are computed via template literals so consumer
 * bundlers (Rollup, esbuild) can't statically analyze them — they
 * skip dynamic imports with variable specifiers instead of erroring.
 * Returns null when shiki is unavailable.
 */

// Variable indirection prevents any bundler from statically resolving
const SHIKI = 'shiki'

export async function createInspectorHighlighter() {
  try {
    const [shikiCore, oniguruma, tsx, jsx, javascript, typescript, githubDark, wasm] =
      await Promise.all([
        import(/* @vite-ignore */ `${SHIKI}/core`).catch(() => null),
        import(/* @vite-ignore */ `${SHIKI}/engine/oniguruma`).catch(() => null),
        import(/* @vite-ignore */ `${SHIKI}/dist/langs/tsx.mjs`).catch(() => null),
        import(/* @vite-ignore */ `${SHIKI}/dist/langs/jsx.mjs`).catch(() => null),
        import(/* @vite-ignore */ `${SHIKI}/dist/langs/javascript.mjs`).catch(() => null),
        import(/* @vite-ignore */ `${SHIKI}/dist/langs/typescript.mjs`).catch(() => null),
        import(/* @vite-ignore */ `${SHIKI}/dist/themes/github-dark.mjs`).catch(() => null),
        import(/* @vite-ignore */ `${SHIKI}/wasm`).catch(() => null),
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
