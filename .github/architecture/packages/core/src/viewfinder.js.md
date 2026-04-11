# `packages/core/src/viewfinder.js`

<!--
source: packages/core/src/viewfinder.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides utility functions for the viewfinder feature: a deterministic hash function for seeding generative placeholders, a route resolver that maps flow names to their target routes, flow metadata extraction, and a prototype index builder. The route resolver supports four strategies: matching against known route names (case-insensitive), reading an explicit `route` key from flow data (checking top-level, `meta`, `flowMeta`, and legacy `sceneMeta`), using an inferred `_route` from the Vite data plugin, and falling back to the root path. Flows with `meta.default: true` omit the `?flow=` query param.

The `buildPrototypeIndex` function is the central data source for the viewfinder UI — it groups flows by prototype, prototypes by folder, includes canvas entries, and returns pre-sorted variants by title and last-updated date.

## Composition

**`hash(str)`** — Deterministic hash from a string. Returns a non-negative number.

```js
export function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}
```

**`resolveFlowRoute(flowName, knownRoutes?)`** — Resolves the target route path for a flow. Returns a full path with `?flow=` param when needed. If the flow name matches a known route, no query param is needed (StoryboardProvider auto-matches by page name). Also checks for `_route` (inferred from file path by the Vite plugin) and omits `?flow=` when `meta.default` is `true`.

```js
// Priority: known route match → explicit route/meta.route/flowMeta.route → _route → "/"
export function resolveFlowRoute(flowName, knownRoutes = []) {
  for (const route of knownRoutes) {
    if (route.toLowerCase() === flowName.toLowerCase()) return `/${route}`
  }
  // ... checks data.route, data.meta.route, data.flowMeta.route, data._route
  return `/?flow=${encodeURIComponent(flowName)}`
}
```

**`resolveSceneRoute`** — Deprecated alias for `resolveFlowRoute`.

**`getFlowMeta(flowName)`** — Extracts metadata (title, description, author) from flow data, checking `meta`, `flowMeta`, and legacy `sceneMeta` keys.

**`getSceneMeta`** — Deprecated alias for `getFlowMeta`.

**`buildPrototypeIndex(knownRoutes?)`** — Builds a structured index grouping flows by prototype, prototypes by folder, and including canvas entries. Returns `{ folders, prototypes, canvases, globalFlows, sorted }`. Seeds from `.prototype.json` metadata via `listPrototypes()`, supports `hideFlows`, `icon`, `team`, `tags`, `folder`, `isExternal`, `externalUrl`, `gitAuthor`, and `lastModified`. Folder metadata comes from `.folder.json` files. Implicit folders are created when a prototype references a folder that has no metadata file.

The `sorted` object contains pre-sorted variants:
- `sorted.title` — prototypes, canvases, and folders sorted alphabetically
- `sorted.updated` — prototypes sorted by `lastModified` (newest first), folders sorted by their most recently updated prototype

```js
export function buildPrototypeIndex(knownRoutes = []) {
  // Seeds from listPrototypes() and listFolders() metadata
  // Groups flows by prototype prefix (e.g. "Dashboard/default")
  // Partitions prototypes into folders vs ungrouped
  // Adds canvas entries from listCanvases()
  return { folders, prototypes, canvases, globalFlows, sorted }
}
```

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — `loadFlow`, `listFlows`, `listPrototypes`, `getPrototypeMetadata`, `listFolders`, `getFolderMetadata`, `listCanvases`, `getCanvasData` for data loading, prototype/folder/canvas indexing

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `hash`, `resolveFlowRoute`, `getFlowMeta`, `buildPrototypeIndex`, and deprecated aliases
