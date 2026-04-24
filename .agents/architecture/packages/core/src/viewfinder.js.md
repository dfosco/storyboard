# `packages/core/src/viewfinder.js`

<!--
source: packages/core/src/viewfinder.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Builds a structured prototype index that powers the viewfinder dashboard and command palette. Groups flows by prototype, prototypes by folder, and builds canvas entries with multi-page group support. Provides flow route resolution and metadata access. This is the primary data aggregation layer between the raw loader index and all UI that lists/navigates prototypes, canvases, and flows.

## Composition

**Route resolution:**
- `resolveFlowRoute(flowName, knownRoutes?)` — resolves a flow to a URL path (matches known routes, explicit `route` in data, `_route` from Vite plugin, or fallback `/?flow=`)
- `resolveSceneRoute` — deprecated alias

**Metadata:**
- `getFlowMeta(flowName)` — returns `meta` / `flowMeta` / `sceneMeta` from flow data
- `getSceneMeta` — deprecated alias

**Index building:**
- `buildPrototypeIndex(knownRoutes?)` — returns `{ folders, prototypes, canvases, globalFlows, sorted }` with pre-sorted variants by title and last-updated

**Utility:**
- `hash(str)` — deterministic numeric hash for seeding generative placeholders

```js
import { buildPrototypeIndex } from './viewfinder.js'
const index = buildPrototypeIndex()
// index.prototypes — ungrouped prototypes
// index.folders — folder groups with nested prototypes and canvases
// index.canvases — ungrouped canvases
// index.sorted.title.prototypes — alphabetically sorted
```

## Dependencies

- `./loader.js` — `loadFlow`, `listFlows`, `listPrototypes`, `getPrototypeMetadata`, `listFolders`, `getFolderMetadata`, `listCanvases`, `getCanvasData`

## Dependents

- [`./paletteProviders.js`](./paletteProviders.js.md) — `buildPrototypeIndex` for palette items
- `packages/react/src/Viewfinder.jsx` — renders the viewfinder dashboard
- `packages/react/src/CommandPalette/CommandPalette.jsx` — palette data source
- `packages/core/src/ui/viewfinder.ts` — Svelte viewfinder mount
- `packages/core/src/svelte-plugin-ui/index.ts` — Svelte plugin UI

## Notes

- Canvas entries support multi-page groups: when multiple canvases share a `_group`, they're collapsed into a single entry with a `pages` array, sorted by `pageOrder` from `.meta.json`.
- External prototypes (with a `url` field) appear in the index but open in new tabs.
- Pre-sorted variants (`sorted.title`, `sorted.updated`) avoid re-sorting on every render.
