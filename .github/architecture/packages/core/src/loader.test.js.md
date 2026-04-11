# `packages/core/src/loader.test.js`

<!--
source: packages/core/src/loader.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/loader.js`](./loader.js.md). Covers the complete data loading pipeline: `init` (validation, error on null/undefined/string, backward compat with `{ scenes }`), `loadFlow` (basic load, `$ref` resolution, nested `$ref`, `$global` merge with conflict resolution, missing flow, case-insensitive lookup, deep clone isolation, repeated calls without index mutation, default param, circular `$ref` detection), `flowExists`, `listFlows`, deprecated aliases (`loadScene`, `sceneExists`, `listScenes`), `loadRecord` (array validation, non-array rejection, clone), `findRecord`, `deepMerge` (nested merge, source wins, array replacement, null handling), `loadObject` (basic load, `$ref` within objects, missing object, clone, circular detection), scoped name resolution (`resolveFlowName`, `resolveRecordName`, `resolveObjectName`), scoped object loading with prototype fallback, error hints for scoped data, and folder functions (`listFolders`, `getFolderMetadata`).

## Composition

Fourteen `describe` blocks organized by feature area. Uses a `makeIndex()` factory to create fresh test data for each test via `beforeEach`. Includes dedicated circular reference test cases with two objects that reference each other, scoped data tests that re-initialize the index with prototype-scoped flows/objects/records, and folder metadata tests.

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — Module under test

## Dependents

None — test file.
