# `packages/core/src/loader.js`

<!--
source: packages/core/src/loader.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

The loader is the heart of the storyboard data system. It manages a module-level data index (flows, objects, records, prototypes, folders, canvases) that is seeded at app startup via `init()`, and provides functions to load and resolve flow data with `$ref` and `$global` references. Flows are the primary data context for pages — they compose objects into a complete data shape that components consume.

The loader is framework-agnostic with zero npm dependencies. It supports case-insensitive flow lookup, circular `$ref` detection, deep merging of `$global` data, prototype-scoped name resolution (for flows, records, and objects), and returns `structuredClone`d data to prevent consumer mutation of the index.

## Composition

**`init(index)`** — Seeds the data index. Called once at startup by the Vite data plugin's virtual module.

```js
export function init(index) {
  dataIndex = {
    flows: index.flows || index.scenes || {},
    objects: index.objects || {},
    records: index.records || {},
    prototypes: index.prototypes || {},
    folders: index.folders || {},
    canvases: index.canvases || {},
  }
}
```

**`loadFlow(flowName)`** — Loads a flow and resolves `$global` (root-level merges) and `$ref` (inline object replacement). Extracts prototype scope from scoped names (e.g. `"Dashboard/default"` → scope `"Dashboard"`). Returns a `structuredClone` to prevent mutation. Provides helpful error messages with suggestions for scoped flow names.

```js
export function loadFlow(flowName = 'default') {
  const scope = flowName.includes('/') ? flowName.split('/')[0] : null
  // loads flow, handles $global merge with scoped resolution, resolves $ref, clones
  return structuredClone(flowData)
}
```

**`loadScene`** — Deprecated alias for `loadFlow`.

**`deepMerge(target, source)`** — Deep merges two objects. Source wins conflicts; arrays are replaced, not concatenated.

**`flowExists(flowName)`** — Case-insensitive check for flow existence.

**`listFlows()`** — Returns all registered flow names. `listScenes()` is a deprecated alias.

**`getFlowsForPrototype(prototypeName)`** — Returns flows scoped to a specific prototype (e.g. all flows starting with `"Dashboard/"`), with resolved metadata.

**`loadRecord(recordName)`** / **`findRecord(recordName, id)`** — Load record collections (arrays) and find individual entries by id. Both return clones.

**`loadObject(objectName, scope?)`** — Loads an object data file, resolves nested `$ref` references with optional prototype scope, returns a deep clone.

**`resolveFlowName(scope, name)`** — Resolves a flow name within a prototype scope. Tries `{scope}/{name}` first, falls back to the plain name.

**`resolveRecordName(scope, name)`** — Same as `resolveFlowName` but for records.

**`resolveObjectName(scope, name)`** — Same as `resolveFlowName` but for objects.

**`listPrototypes()`** / **`getPrototypeMetadata(name)`** — Returns all registered prototype names / metadata from `.prototype.json`.

**`listFolders()`** / **`getFolderMetadata(name)`** — Returns all registered folder names / metadata from `.folder.json`.

**`listCanvases()`** / **`getCanvasData(name)`** — Returns all registered canvas names / data from `.canvas.json`.

Internal helpers:
- `loadDataFile(name, type)` — Resolves a data file from the index with case-insensitive fallback for flows
- `resolveRefs(node, seen, scope)` — Recursively resolves `$ref` objects with circular dependency detection and optional prototype scope

## Dependencies

No external dependencies. Pure JavaScript with no imports.

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public functions
- [`packages/core/src/devtools.js`](./devtools.js.md) — Imports `loadFlow` for flow info panel
- [`packages/core/src/sceneDebug.js`](./sceneDebug.js.md) — Imports `loadFlow` for debug display
- [`packages/core/src/viewfinder.js`](./viewfinder.js.md) — Imports `loadFlow`, `listFlows`, `listPrototypes`, `getPrototypeMetadata` for route resolution and prototype indexing
- [`packages/react/src/context.jsx`](../../react/src/context.jsx.md) — Imports `loadFlow`, `flowExists`, `findRecord`, `deepMerge`, `resolveFlowName`, `resolveRecordName`
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — Imports `loadRecord`, `resolveRecordName`
- [`packages/react/src/hooks/useObject.js`](../../react/src/hooks/useObject.js.md) — Imports `loadObject`

## Notes

- The `$ref` resolution looks up objects first, then falls back to searching all types. This means object names take priority.
- Circular `$ref` chains throw immediately — the `seen` Set tracks visited names during resolution.
- `$global` entries that fail to load are silently warned (not thrown), allowing partial flow resolution.
- Scoped name resolution (`resolveObjectName`, `resolveFlowName`, `resolveRecordName`) tries `{scope}/{name}` first, then falls back to the global name — this enables prototype-scoped data that shadows global data.
- `resolveRefs` passes the `scope` parameter through recursive calls, so nested `$ref`s within scoped flows also resolve scoped objects first.
