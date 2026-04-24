# `packages/react/src/hooks/useSceneData.test.js`

<!--
source: packages/react/src/hooks/useSceneData.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useFlowData`](./useSceneData.js.md), `useFlowLoading`, and deprecated aliases `useSceneData`/`useSceneLoading`. Covers flow data access, dot-notation paths, hash overrides, and error handling.

## Composition

- `useFlowData`: returns entire flow, nested value by path, deep paths, arrays, array elements by index
- Returns `{}` and warns for missing paths
- Throws outside `<StoryboardProvider>`
- Applies hash overrides (exact and child overrides on arrays)
- Returns full flow with all overrides when no path
- `useFlowLoading`: returns false when not loading, throws outside provider
- `useSceneData` === `useFlowData`, `useSceneLoading` === `useFlowLoading`

## Dependencies

- [`useSceneData.js`](./useSceneData.js.md), test-utils

## Dependents

None (test file).
