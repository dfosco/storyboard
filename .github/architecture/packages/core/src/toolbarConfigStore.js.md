# `packages/core/src/toolbarConfigStore.js`

<!--
source: packages/core/src/toolbarConfigStore.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`toolbarConfigStore.js` is the reactive store for the merged toolbar configuration. It implements a layered override system where configuration flows from core defaults (`toolbar.config.json`) through client-repo customizations, and finally prototype-level overrides — with higher layers winning on conflicts. This lets individual prototypes customize their toolbar without affecting the rest of the app.

The store is framework-agnostic with zero npm dependencies, following the same pattern as other core stores. It provides a subscription API compatible with both Svelte stores and React's `useSyncExternalStore`, making it usable from any UI framework.

## Composition

**Internal state** — Three config layers plus a listener set:

```js
let _baseConfig = {}         // Merged core + custom config (set once at startup)
let _prototypeConfig = null  // Active prototype toolbar overrides
let _mergedConfig = {}       // Final merged config (base + prototype)
const _listeners = new Set()
let _snapshotVersion = 0
```

**Initialization** — Called once at startup by [`mountStoryboardCore`](./mountStoryboardCore.js.md):

```js
export function initToolbarConfig(config) {
  _baseConfig = config
  _prototypeConfig = null
  _recompute()
}
```

**Prototype overrides** — Set/cleared on route changes when entering/leaving prototypes with their own `toolbar.config.json`:

```js
export function setPrototypeToolbarConfig(config) {
  _prototypeConfig = config || null
  _recompute()
}

export function clearPrototypeToolbarConfig() {
  if (_prototypeConfig === null) return
  _prototypeConfig = null
  _recompute()
}
```

**Merge and notify** — Uses `deepMerge` from [`loader.js`](./loader.js.md) to combine layers, then notifies all subscribers:

```js
function _recompute() {
  _mergedConfig = _prototypeConfig
    ? deepMerge(_baseConfig, _prototypeConfig)
    : _baseConfig
  _snapshotVersion++
  for (const cb of _listeners) {
    try { cb(_mergedConfig) } catch (err) { /* logged */ }
  }
}
```

**Reactivity** — Provides `subscribeToToolbarConfig(callback)` (Svelte-compatible, calls with current value on subscribe) and `getToolbarConfigSnapshot()` (React `useSyncExternalStore` compatible).

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — `deepMerge` utility for layered config merging

## Dependents

- [`packages/core/src/mountStoryboardCore.js`](./mountStoryboardCore.js.md) — Calls `initToolbarConfig()` at startup
- [`packages/core/src/inspector/highlighter.js`](./inspector/highlighter.js.md) — Reads `getToolbarConfig()` for inspector settings
- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public APIs (`initToolbarConfig`, `setPrototypeToolbarConfig`, `clearPrototypeToolbarConfig`, `getToolbarConfig`, `subscribeToToolbarConfig`, `getToolbarConfigSnapshot`)

## Notes

- `clearPrototypeToolbarConfig()` short-circuits if no prototype config is active, avoiding unnecessary recompute/notify cycles.
- The subscriber callback receives the merged config as its argument (Svelte store convention), unlike the tool registry which notifies without arguments.
- The `_resetToolbarConfig()` test helper is exported but prefixed with underscore to signal internal-only use.
