# `packages/tiny-canvas/src/utils.js`

<!--
source: packages/tiny-canvas/src/utils.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Utility functions for drag ID generation and localStorage-based position persistence. Provides the storage layer for the tiny-canvas drag system.

## Composition

Five exports:

- **`findDragId(children)`** — Recursively searches React children for an `id` prop. Returns the first found id or `null`.
- **`generateDragId(element, index)`** — Generates a stable drag ID from a React element's structural shape using a djb2 hash of the component type tree signature. Index suffix disambiguates identical siblings.
- **`getQueue(dragId)`** — Reads stored coordinates for a specific dragId from localStorage. Returns `{ x, y }` or `{ x: 0, y: 0 }`.
- **`refreshStorage()`** — Initializes the localStorage queue if it doesn't exist.
- **`saveDrag(dragId, x, y)`** — Saves/updates position data for a draggable element.

All functions use the `tiny-canvas-queue` localStorage key, storing an array of `{ id, x, y, time }` entries.

## Dependencies

- `react` — `React.Children.forEach` for tree traversal in `findDragId` and `signature`

## Dependents

- [`./Canvas.jsx`](Canvas.jsx.md) — uses `findDragId`, `generateDragId`
- [`./Draggable.jsx`](Draggable.jsx.md) — uses `saveDrag`
- [`./index.js`](index.js.md) — re-exports all five functions
