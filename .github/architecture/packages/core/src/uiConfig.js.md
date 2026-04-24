# `packages/core/src/uiConfig.js`

<!--
source: packages/core/src/uiConfig.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`uiConfig.js` provides project-level control over which storyboard chrome elements are visible. Client repos use the `"ui"` key in `storyboard.config.json` to declaratively hide specific menus or UI elements from the CoreUIBar — for example, hiding the docs panel or comments feature in prototypes that don't need them.

The module is deliberately minimal: it stores a set of hidden item keys and exposes a simple `isMenuHidden(key)` check. This keeps the visibility logic framework-agnostic with zero npm dependencies, following the same pattern as other core stores.

## Composition

**Internal state** — A single `Set` of hidden item keys:

```js
let _hiddenItems = new Set()
```

**Initialization** — Called by the Vite data plugin's generated virtual module with the `"ui"` section of `storyboard.config.json`:

```js
export function initUIConfig(config = {}) {
  _hiddenItems = new Set(Array.isArray(config.hide) ? config.hide : [])
}
```

**Visibility check** — The primary API, used by UI components to conditionally render menus:

```js
export function isMenuHidden(key) {
  return _hiddenItems.has(key)
}
```

**Listing** — Returns all hidden keys as an array:

```js
export function getHiddenItems() {
  return Array.from(_hiddenItems)
}
```

Known menu keys include: `'docs'`, `'inspector'`, `'create'`, `'comments'`, `'command'`.

## Dependencies

None (zero npm dependencies, framework-agnostic).

## Dependents

- [`packages/core/src/mountStoryboardCore.js`](./mountStoryboardCore.js.md) — Calls `initUIConfig()` at startup
- [`packages/core/src/uiConfig.test.js`](./uiConfig.test.js.md) — Test suite
- [`packages/core/src/index.js`](./index.js.md) — Re-exports `initUIConfig`, `isMenuHidden`, `getHiddenItems`

## Notes

- Unlike other stores, `uiConfig` has no reactivity/subscription API — hidden items are set once at startup and don't change at runtime.
- Calling `initUIConfig()` again fully replaces the hidden set (no incremental merge).
- The `_resetUIConfig()` test helper clears all state for test isolation.
- Passing non-array values for `config.hide` is handled gracefully — results in an empty set.
