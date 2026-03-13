# `packages/core/src/sceneDebug.js`

<!--
source: packages/core/src/sceneDebug.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides a vanilla JS debug panel that displays resolved flow data as formatted JSON. Framework-agnostic — creates DOM elements directly, no React/Vue needed. Unlike the DevTools overlay, this mounts inline (appended to a container) and is useful for embedding a flow inspector directly in a page.

## Composition

**`mountFlowDebug(container?, flowName?)`** — Creates and appends a debug panel. Returns the created `HTMLElement`.

```js
export function mountFlowDebug(container, flowName) {
  // Defaults: container = document.body, flowName = ?flow= or ?scene= param or "default"
  // Injects styles once, creates title + JSON pre element
  // Shows error UI if loadFlow throws
  return el
}
```

**`mountSceneDebug`** — Deprecated alias for `mountFlowDebug`.

- Styles are injected once via a module-level `stylesInjected` flag
- Flow name falls back to `?flow=` query param, then `?scene=` (compat), then `"default"`
- Error state renders a styled error panel instead of JSON

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — `loadFlow` for loading and resolving flow data

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `mountFlowDebug` and deprecated `mountSceneDebug`
