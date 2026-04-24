# `packages/react/src/hooks/useObject.test.js`

<!--
source: packages/react/src/hooks/useObject.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useObject`](./useObject.js.md). Covers object loading, path resolution, hash overrides, deep clone isolation, and hide-mode shadow overrides.

## Composition

- Loads object by name, returns undefined for missing objects
- Resolves dot-notation path, returns undefined for missing paths
- Applies hash overrides to full object and path-specific access
- Returns deep clones (mutations don't affect source data)
- Hide mode: reads overrides from localStorage shadow

## Dependencies

- [`useObject.js`](./useObject.js.md), test-utils, `@dfosco/storyboard-core`

## Dependents

None (test file).
