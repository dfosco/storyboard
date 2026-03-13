# `packages/core/src/viewfinder.js`

<!--
source: packages/core/src/viewfinder.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides utility functions for the viewfinder feature: a deterministic hash function for seeding generative placeholders, a route resolver that maps flow names to their target routes, flow metadata extraction, and a prototype index builder. The route resolver supports three strategies: matching against known route names (case-insensitive), reading an explicit `route` key from flow data (checking top-level, `meta`, `flowMeta`, and legacy `sceneMeta`), and falling back to the root path.

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

**`resolveFlowRoute(flowName, knownRoutes?)`** — Resolves the target route path for a flow. Returns a full path with `?flow=` param when needed. If the flow name matches a known route, no query param is needed (StoryboardProvider auto-matches by page name).

**`resolveSceneRoute`** — Deprecated alias for `resolveFlowRoute`.

**`getFlowMeta(flowName)`** — Extracts metadata (title, description, author) from flow data, checking `meta`, `flowMeta`, and legacy `sceneMeta` keys.

**`getSceneMeta`** — Deprecated alias for `getFlowMeta`.

**`buildPrototypeIndex(knownRoutes?)`** — Builds a structured index grouping flows by prototype. Returns `{ prototypes, globalFlows }`. Seeds from `.prototype.json` metadata, supports `hideFlows`, `icon`, `team`, `tags`, and auto-fills `gitAuthor` from the data plugin.

```js
export function buildPrototypeIndex(knownRoutes = []) {
  // Seeds from listPrototypes() metadata
  // Groups flows by prototype prefix (e.g. "Dashboard/default")
  // Standalone flows go to globalFlows
  return { prototypes, globalFlows }
}
```

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — `loadFlow`, `listFlows`, `listPrototypes`, `getPrototypeMetadata` for data loading and prototype indexing

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `hash`, `resolveFlowRoute`, `getFlowMeta`, `buildPrototypeIndex`, and deprecated aliases
