# `packages/react/src/hooks/useUndoRedo.test.js`

<!--
source: packages/react/src/hooks/useUndoRedo.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useUndoRedo`](./useUndoRedo.js.md). Verifies return shape, initial state, and undo/redo navigation through a snapshot history.

## Composition

- Returns `{ undo, redo, canUndo, canRedo }` with correct types
- `canUndo` and `canRedo` are false initially
- After pushing snapshots: can undo at end, can redo after undoing, cannot undo at start, round-trips correctly

## Dependencies

- [`useUndoRedo.js`](./useUndoRedo.js.md), test-utils, `@dfosco/storyboard-core` (pushSnapshot)

## Dependents

None (test file).
