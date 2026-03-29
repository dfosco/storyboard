# Tiny Canvas

A lightweight React canvas with draggable elements and persistent positions.

## Install

```bash
npm install tiny-canvas
```

## Quick start

```jsx
import { Canvas } from 'tiny-canvas'
import 'tiny-canvas/style.css'

function App() {
  return (
    <Canvas grid>
      <div id="card-1">Hello</div>
      <div id="card-2">World</div>
    </Canvas>
  )
}
```

Give each child an `id` prop — this is how positions are persisted in localStorage. Children without an `id` are still draggable but won't remember their position.

## Components

### `<Canvas>`

Wraps children in draggable containers.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `centered` | `boolean` | `true` | Center children with flexbox |
| `grid` | `boolean` | `false` | Show dot-grid background and enable snap-to-grid |
| `gridSize` | `number` | `18` | Grid snap size in pixels (when `grid` is `true`) |

### `<Draggable>`

Standalone draggable wrapper — use directly without `Canvas` if needed.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gridSize` | `number` | — | Grid snap size in pixels. No snapping when omitted. |

## Hooks

### `useResetCanvas(options?)`

Returns a function that clears all saved positions from localStorage.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `reload` | `boolean` | `false` | Reload the page after clearing |

## Utilities

```js
import { saveDrag, getQueue, refreshStorage, findDragId } from 'tiny-canvas'
```

- `saveDrag(id, x, y)` — persist a position
- `getQueue(id)` — retrieve `{ x, y }` for an element
- `refreshStorage()` — initialize localStorage if empty
- `findDragId(children)` — extract the first `id` prop from React children

## CSS customization

Override `--tc-*` custom properties to theme the canvas:

```css
:root {
  --tc-border-radius: 12px;
  --tc-shadow-rest: 0 1px 3px rgba(0, 0, 0, 0.12);
  --tc-shadow-float: 0 4px 12px rgba(0, 0, 0, 0.15);
  --tc-border-color: rgba(0, 0, 0, 0.15);
  --tc-bg-muted: #f6f8fa;
  --tc-dot-color: rgba(0, 0, 0, 0.08);
  --tc-grid-size: 36px;
}
```

If you use [Primer Primitives](https://github.com/primer/primitives), the variables automatically pick up your theme tokens.

## Peer dependencies

- `react` >= 18
- `react-dom` >= 18

---

MIT License
