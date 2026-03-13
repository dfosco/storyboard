# `packages/core/src/loader.js`

<!--
source: packages/core/src/loader.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

The loader is the heart of the storyboard data system. It manages a module-level data index (flows, objects, records, prototypes) that is seeded at app startup via `init()`, and provides functions to load and resolve flow data with `$ref` and `$global` references. Flows are the primary data context for pages — they compose objects into a complete data shape that components consume.

The loader is framework-agnostic with zero npm dependencies. It supports case-insensitive flow lookup, circular `$ref` detection, deep merging of `$global` data, scoped name resolution for prototypes, and returns `structuredClone`d data to prevent consumer mutation of the index.

## Composition

**`init(index)`** — Seeds the data index. Called once at startup by the Vite data plugin's virtual module.

```js
export function init(index) {
  dataIndex = {
    flows: index.flows || index.scenes || {},
    objects: index.objects || {},
    records: index.records || {},
    prototypes: index.prototypes || {},
  }
}
```

**`loadFlow(flowName)`** — Loads a flow and resolves `$global` (root-level merges) and `$ref` (inline object replacement). Returns a `structuredClone` to prevent mutation. Provides helpful error messages with suggestions for scoped flow names.

```js
export function loadFlow(flowName = 'default') {
  // loads flow, handles $global merge, resolves $ref, clones
  return structuredClone(flowData)
}
```

**`loadScene`** — Deprecated alias for `loadFlow`.

**`deepMerge(target, source)`** — Deep merges two objects. Source wins conflicts; arrays are replaced, not concatenated.

**`flowExists(flowName)`** — Case-insensitive check for flow existence.

**`listFlows()`** — Returns all registered flow names. `listScenes()` is a deprecated alias.

**`loadRecord(recordName)`** / **`findRecord(recordName, id)`** — Load record collections (arrays) and find individual entries by id. Both return clones.

**`loadObject(objectName)`** — Loads an object data file, resolves nested `$ref` references, returns a deep clone.

**`resolveFlowName(scope, name)`** — Resolves a flow name within a prototype scope. Tries `{scope}/{name}` first, falls back to the plain name.

**`resolveRecordName(scope, name)`** — Same as `resolveFlowName` but for records.

**`listPrototypes()`** — Returns all registered prototype names.

**`getPrototypeMetadata(name)`** — Returns metadata from a `.prototype.json` file.

Internal helpers:
- `loadDataFile(name, type)` — Resolves a data file from the index with case-insensitive fallback for flows
- `resolveRefs(node, seen)` — Recursively resolves `$ref` objects with circular dependency detection

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
- `$global` entries that fail to load are silently warned (not thrown), allowing partial scene resolution.
