# `packages/core/src/loader.test.js`

<!--
source: packages/core/src/loader.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests the core data loader — the central module that initializes, resolves, and serves flows, objects, records, folders, and stories. This is the most comprehensive test file in the core package, covering `$ref` resolution, `$global` merging, prototype scoping, circular reference detection, deprecated aliases, and error hints.

## Composition

**init** — validates input (throws on null/undefined/non-object), stores data, handles missing properties, backward-compat `scenes` key.

**loadFlow** — loads by name, resolves `$ref` and nested `$ref`, resolves `$global` (flow wins conflicts), case-insensitive lookup, returns deep clone, detects circular refs, repeated calls don't mutate index.

**flowExists / listFlows** — existence checks (case-insensitive), listing all flow names.

**Deprecated aliases** — `loadScene === loadFlow`, `sceneExists === flowExists`, `listScenes === listFlows`.

**loadRecord / findRecord** — loads arrays, throws for missing/non-array, deep clones, finds by id.

**deepMerge** — nested merge, source wins, arrays replaced not concatenated, handles null/undefined.

**loadObject** — loads by name, resolves internal `$ref`, deep clones, detects circular refs.

**resolveFlowName / resolveRecordName / resolveObjectName** — scoped resolution with global fallback, already-scoped names, error message hints.

**Scoped object loading** — `loadObject` with scope, `loadFlow` resolves `$ref`/`$global` with prototype scope.

**Error hints** — suggests scoped alternatives when unscoped name fails.

**Folders** — `listFolders`, `getFolderMetadata`.

**Stories** — `listStories`, `getStoryData`, init with stories.

```js
const flow = loadFlow('Dashboard')
expect(flow.links).toEqual(['home', 'about'])
expect(flow.nav).toBe('scene-wins') // flow wins over $global
```

## Dependencies

- `./loader.js` (`init`, `loadFlow`, `listFlows`, `flowExists`, `loadScene`, `listScenes`, `sceneExists`, `loadRecord`, `findRecord`, `loadObject`, `deepMerge`, `resolveFlowName`, `resolveRecordName`, `resolveObjectName`, `listFolders`, `getFolderMetadata`, `listStories`, `getStoryData`)

## Dependents

None (test file).
