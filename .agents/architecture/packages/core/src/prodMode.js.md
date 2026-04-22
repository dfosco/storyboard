# `packages/core/src/prodMode.js`

<!--
source: packages/core/src/prodMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Production mode simulation. When `?prodMode` is in the URL, the UI renders as if deployed to production even on a local dev server. This allows testing production-only behavior (hidden dev tools, prod-only features) without deploying.

## Composition

- `isLocalDev()` — returns `true` when running on local dev (`window.__SB_LOCAL_DEV__` is `true` and `?prodMode` is absent)
- `isProdMode()` — returns `true` when prod-mode simulation is active (local dev + `?prodMode`)
- `toggleProdMode()` — toggles the `?prodMode` URL param and reloads

```js
import { isLocalDev, toggleProdMode } from './prodMode.js'
if (!isLocalDev()) hideDevTools()
```

## Dependencies

None (reads `window.__SB_LOCAL_DEV__` and URL params).

## Dependents

- `packages/core/src/CoreUIBar.svelte` — conditionally shows dev-only UI
- `packages/core/src/InspectorPanel.svelte` — inspector visibility
- `packages/core/src/tools/handlers/devtools.js` — devtools toggle handler
- `packages/react/src/canvas/CanvasPage.jsx` — canvas dev features
- `packages/react/src/canvas/widgets/widgetConfig.js` — widget dev config

## Notes

- `_forced` internal state allows programmatic override (currently unused externally).
- `isProdMode()` returns `true` only when `__SB_LOCAL_DEV__` is `true` AND `isLocalDev()` returns `false` — i.e., it detects the simulation, not actual production.
