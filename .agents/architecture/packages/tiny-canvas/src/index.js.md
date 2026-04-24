# `packages/tiny-canvas/src/index.js`

<!--
source: packages/tiny-canvas/src/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Public entry point for `@dfosco/tiny-canvas` — a lightweight drag-and-drop canvas library. Exports the Canvas container, Draggable wrapper, a reset hook, and localStorage utility functions. This package powers the storyboard canvas pages, providing persistent drag positioning backed by localStorage.

The package is framework-agnostic in concept but currently implemented with React and `@neodrag/react` for drag behavior.

## Composition

```js
import './style.css';

export { default as Canvas } from './Canvas';
export { default as Draggable } from './Draggable';
export { useResetCanvas } from './useResetCanvas';
export { findDragId, generateDragId, getQueue, refreshStorage, saveDrag } from './utils';
```

Imports `style.css` as a side effect (canvas grid dots, drag cursors, transitions). Six named exports covering the full API.

## Dependencies

- [`./Canvas.jsx`](Canvas.jsx.md) — container component
- [`./Draggable.jsx`](Draggable.jsx.md) — drag wrapper
- [`./useResetCanvas.js`](useResetCanvas.js.md) — reset hook
- [`./utils.js`](utils.js.md) — localStorage persistence utilities
- `./style.css` — base canvas styles

## Dependents

- `packages/react/src/canvas/CanvasPage.jsx` — storyboard canvas page integration
- `packages/react/src/canvas/CanvasPage.bridge.test.jsx` — bridge tests
- `packages/react/src/canvas/CanvasPage.dragdrop.test.jsx` — drag/drop tests
- `packages/react/src/canvas/CanvasPage.multiselect.test.jsx` — multiselect tests
- `src/prototypes/_app.jsx` — app root
- `vite.config.js` — alias configuration
