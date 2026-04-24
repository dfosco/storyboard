# `packages/tiny-canvas/src/useResetCanvas.js`

<!--
source: packages/tiny-canvas/src/useResetCanvas.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Hook that returns a memoized callback to clear all saved canvas positions from localStorage. Optionally reloads the page after clearing.

## Composition

```js
export function useResetCanvas({ reload = false } = {})
```

Removes the `tiny-canvas-queue` localStorage key. When `reload: true`, calls `window.location.reload()` after clearing.

## Dependencies

None (only React's `useCallback`).

## Dependents

- [`./index.js`](index.js.md) — re-exports as `useResetCanvas`
