# `packages/core/src/devtools-consumer.js`

<!--
source: packages/core/src/devtools-consumer.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Consumer-safe proxy for the devtools mount/unmount functions. Delegates to the compiled UI bundle (`@dfosco/storyboard-core/ui-runtime`) so consumer apps don't need Svelte installed as a dependency. The real `mountDevTools` in `devtools.js` imports Svelte directly and is only usable in the source repo or via the compiled UI bundle — this module provides a lazy-loaded bridge.

## Composition

**`mountDevTools(options?)`** — Dynamically imports `@dfosco/storyboard-core/ui-runtime` and delegates to its `mountDevTools`.

**`unmountDevTools()`** — Dynamically imports the UI runtime and delegates to its `unmountDevTools`.

```js
export async function mountDevTools(options = {}) {
  const ui = await import('@dfosco/storyboard-core/ui-runtime')
  return ui.mountDevTools(options)
}

export async function unmountDevTools() {
  const ui = await import('@dfosco/storyboard-core/ui-runtime')
  return ui.unmountDevTools()
}
```

**`mountFlowDebug(options?)`** / **`mountSceneDebug(options?)`** — Deprecated aliases for `mountDevTools`.

## Dependencies

- `@dfosco/storyboard-core/ui-runtime` — Compiled Svelte UI bundle (dynamically imported)

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `mountDevTools` for the public API

## Notes

- All imports are dynamic (`import()`) to avoid pulling Svelte into consumer bundles at compile time.
- In the source repo, Vite alias overrides `@dfosco/storyboard-core/ui-runtime` to the source entry for HMR. In consumer repos, it resolves to the compiled `dist/storyboard-ui.js`.
