# `packages/tiny-canvas/src/Draggable.jsx`

<!--
source: packages/tiny-canvas/src/Draggable.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Drag wrapper that provides persistent, boundary-clamped dragging via `@neodrag/react`. Implements a custom drag gate (delay + distance thresholds) to distinguish clicks from drags, persists positions to localStorage, and supports handle-restricted dragging.

## Composition

```jsx
function Draggable({ children, dragId, initialPosition, onDragStart, onDrag, onDragEnd, handle, snapGrid, locked, boundaryPad })
```

**Drag gate:** Intercepts `pointerdown` in capture phase on the handle element. Both a time delay (`DRAG_DELAY_MS = 150`) and a distance threshold (`DRAG_DISTANCE_PX = 8`) must be met before re-dispatching a synthetic `pointerdown` to neodrag. This prevents accidental drags on quick clicks.

**Boundary clamping:** Uses neodrag's `transform` callback to clamp positions to `boundaryPad` minimum, avoiding one-frame flicker from React re-render lag. The article element also receives an inline `transform: translate3d(${position.x}px, ${position.y}px, 0)` style for CSS transform-based positioning.

**Persistence:** Calls `saveDrag(dragId, x, y)` on drag end (only if moved past `PERSIST_DEADZONE_PX = 4`).

## Dependencies

- `@neodrag/react` — `useDraggable`
- [`./utils.js`](utils.js.md) — `saveDrag`

## Dependents

- [`./Canvas.jsx`](Canvas.jsx.md) — wraps children in Draggable
- [`./index.js`](index.js.md) — re-exports as `Draggable`
