# `packages/tiny-canvas/src/Canvas.jsx`

<!--
source: packages/tiny-canvas/src/Canvas.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Canvas container that wraps children in [`Draggable`](Draggable.jsx.md) components. Reads initial positions and drag handles from `data-tc-*` attributes on children, generates stable drag IDs, and renders a `<main>` element with optional dot grid background.

## Composition

```jsx
function Canvas({ children, dotted, grid, gridSize, snapGrid, colorMode, locked, boundaryPad, onDragStart, onDrag, onDragEnd })
```

Iterates `Children.map`, wrapping each child in a `Draggable` with:
- `dragId` from `findDragId(child)` or `generateDragId(child, index)`
- `initialPosition` from `data-tc-x`/`data-tc-y` props
- `handle` from `data-tc-handle` prop

Supports CSS custom properties for grid sizing (`--tc-grid-size`, `--tc-dot-radius`).

## Dependencies

- [`./Draggable.jsx`](Draggable.jsx.md)
- [`./utils.js`](utils.js.md) — `findDragId`, `generateDragId`

## Dependents

- [`./index.js`](index.js.md) — re-exports as `Canvas`
