# `packages/react/src/hooks/useObject.test.js`

<!--
source: packages/react/src/hooks/useObject.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useObject.js`](./useObject.js.md). Validates object loading by name, missing object handling, dot-notation path resolution, missing path warning, hash overrides on full objects and paths, deep clone protection against mutations, and hide mode support (shadow overrides for both full objects and specific paths).

## Composition

Two `describe` blocks: `useObject` (normal mode) and `useObject (hide mode)`. Uses `seedTestData()` and `TEST_OBJECTS` from test utilities. Hide mode tests use `activateHideMode()` and `setShadow()`.

## Dependencies

- [`packages/react/src/hooks/useObject.js`](./useObject.js.md) — Module under test
- `@testing-library/react` — `renderHook`, `act`
- `@dfosco/storyboard-core` — `activateHideMode`, `setShadow`

## Dependents

None — test file.
