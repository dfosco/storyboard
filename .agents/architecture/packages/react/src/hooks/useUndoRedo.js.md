# `packages/react/src/hooks/useUndoRedo.js`

<!--
source: packages/react/src/hooks/useUndoRedo.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Undo/redo controls for override history. Every override write (via `useOverride`) pushes a snapshot to a history stack in core. This hook exposes navigation through that stack.

## Composition

```js
export function useUndoRedo() → { undo, redo, canUndo, canRedo }
```

- Subscribes to both storage and hash changes for reactivity
- `undo()` / `redo()` delegate to core's `undo` / `redo` functions
- `canUndo` / `canRedo` read synchronously from core

## Dependencies

- `react` (useCallback, useSyncExternalStore)
- `@dfosco/storyboard-core` — undo, redo, canUndo, canRedo, subscribeToStorage, getStorageSnapshot, subscribeToHash, getHashSnapshot

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
