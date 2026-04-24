# `packages/core/src/loader.js`

<!--
source: packages/core/src/loader.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

The data loading engine for all storyboard content. Manages a module-level data index (flows, objects, records, prototypes, folders, canvases, stories) seeded at startup via `init()`. Provides functions to load flows with `$global`/`$ref` resolution, load objects and records, resolve scoped names within prototypes, and query metadata for prototypes, folders, canvases, and stories.

This is the heart of the storyboard data system — every piece of data consumed by pages passes through this module. It is framework-agnostic with zero npm dependencies.

## Composition

**Initialization:**
```js
export function init(index) // Seed dataIndex with { flows, objects, records, prototypes, folders, canvases, stories }
```

**Flow loading (with $global/$ref resolution):**
```js
export function loadFlow(flowName = 'default')  // Load + resolve a flow
export function listFlows()                      // All registered flow names
export function flowExists(flowName)             // Case-insensitive existence check
export function getFlowsForPrototype(proto)      // Flows scoped to a prototype
```

**Object & record loading:**
```js
export function loadObject(objectName, scope)    // Load object with optional prototype scope
export function loadRecord(recordName)           // Load record array
export function findRecord(recordName, id)       // Find single record entry by id
```

**Scoped name resolution:**
```js
export function resolveFlowName(scope, name)
export function resolveRecordName(scope, name)
export function resolveObjectName(scope, name)
```

**Metadata queries:**
```js
export function listPrototypes() / getPrototypeMetadata(name)
export function listFolders() / getFolderMetadata(name)
export function listCanvases() / getCanvasData(name)
export function listStories() / getStoryData(name)
```

**Internal helpers:** `deepMerge(target, source)` — deep-merges objects (arrays replaced, not concatenated). `resolveRefs(node, seen, scope)` — recursively resolves `$ref` objects with circular reference detection.

## Dependencies

None (zero npm dependencies). Uses only `structuredClone` (browser built-in).

## Dependents

- [`index.js`](./index.js.md) — re-exports all public APIs
- [`configStore.js`](./configStore.js.md) — imports `deepMerge`
- `toolbarConfigStore.js` — imports `deepMerge`
- `viewfinder.js`, `sceneDebug.js`, `paletteProviders.js` — import load/list functions
- `loader.test.js`, `viewfinder.test.js`

## Notes

- `loadFlow` uses `structuredClone` at both ingestion and return to prevent consumer mutation of the data index.
- Case-insensitive fallback exists for flow lookup — if exact match fails, a lowercased scan is attempted.
- Deprecated aliases: `loadScene`, `listScenes`, `sceneExists`.
