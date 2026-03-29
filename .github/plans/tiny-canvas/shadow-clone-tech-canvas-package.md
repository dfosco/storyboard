# Shadow Clone: Technical Plan — Canvas Package

> Part of: Tiny Canvas shadow clone
> Focus: The `@dfosco/tiny-canvas` package — components, hooks, utilities, styles, and build

## 1. Module Overview

The canvas package is a self-contained React component library that provides:
- A `<Canvas>` container that auto-wraps children in draggable wrappers
- A `<Draggable>` component for individual drag-and-drop behavior with persistence
- A `useResetCanvas` hook for clearing saved positions
- Utility functions for localStorage persistence and drag ID generation
- A CSS stylesheet with custom-property-based theming

The package has **one runtime dependency** (`@neodrag/react`) and **two peer dependencies** (React, ReactDOM).

## 2. File / Module Structure

```
packages/tiny-canvas/
├── package.json              # Package manifest
├── vite.config.js            # Library build config
├── CHANGELOG.md
├── README.md
└── src/
    ├── index.js              # Public exports barrel
    ├── index.d.ts            # TypeScript declarations
    ├── Canvas.jsx            # Canvas container component
    ├── Draggable.jsx         # Draggable wrapper component
    ├── useResetCanvas.js     # Reset hook
    ├── utils.js              # Persistence + ID generation utilities
    └── style.css             # All visual styles
```

## 3. Interfaces & Contracts

### Canvas Component

```tsx
interface CanvasProps {
  children?: ReactNode;
  centered?: boolean;    // default: true  — flex column centered layout
  dotted?: boolean;      // default: false — dot background without grid snap
  grid?: boolean;        // default: false — dot background + grid snap
  gridSize?: number;     // default: 18    — snap grid size in px
  colorMode?: 'auto' | 'light' | 'dark';  // default: 'auto'
}

function Canvas(props: CanvasProps): JSX.Element;
```

**Behavior:**
1. Renders a `<main className="tc-canvas">` with optional `data-dotted` and `data-color-mode` attributes
2. If `centered`, applies flexbox centering styles inline
3. `dotted` or `grid` → shows dot background (`data-dotted`)
4. `grid` → passes `gridSize` to children; `dotted` alone → no grid snap
5. Iterates `Children.map(children, ...)`:
   - For each child, resolves a `dragId` via `findDragId(child) ?? generateDragId(child, index)`
   - Wraps in `<Draggable key={index} gridSize={computedGridSize} dragId={dragId}>`

### Draggable Component

```tsx
interface DraggableProps {
  children?: ReactNode;
  gridSize?: number;     // undefined = no snapping
  dragId?: string;       // stable ID for position persistence
}

function Draggable(props: DraggableProps): JSX.Element;
```

**Behavior:**
1. On mount, reads saved position from localStorage via `getQueue(dragId)`
2. If saved position is non-zero, plays entrance animation:
   - Adds `tc-on-translation` CSS class for ~1s
   - Sets `onTranslation` state to true during animation
3. Uses `useDraggable(ref, options)` from `@neodrag/react` with:
   - `axis: 'both'`
   - `grid: [gridSize, gridSize]` (if gridSize defined)
   - `bounds: 'body'`
   - `threshold: { delay: 50, distance: 30 }`
   - CSS classes: `tc-drag`, `tc-on`, `tc-off`
   - `applyUserSelectHack: true`
   - Updates position state on drag
   - Saves to localStorage on drag end via `saveDrag(dragId, x, y)`
4. Applies a random ±2° rotation while dragging or translating
5. Renders: `<article ref={ref}><div className="tc-draggable-inner">{children}</div></article>`

### useResetCanvas Hook

```tsx
interface UseResetCanvasOptions {
  reload?: boolean;  // default: false
}

function useResetCanvas(options?: UseResetCanvasOptions): () => void;
```

**Behavior:**
1. Returns a memoized callback (via `useCallback`) that:
   - Removes `"tiny-canvas-queue"` from localStorage (try/catch)
   - If `reload` is true, calls `window.location.reload()`

### Utility Functions

```tsx
// Recursively searches React children for the first `id` prop
function findDragId(children: ReactNode): string | null;

// Generates stable drag ID from element structural signature
// Uses djb2 hash of component type names and nesting structure
// Format: "tc-{8-char-hex-hash}-{index}"
function generateDragId(element: ReactNode, index: number): string;

// Reads saved {x, y} from localStorage for a dragId
// Returns {x: 0, y: 0} if not found
function getQueue(dragId: string): { x: number; y: number };

// Initializes localStorage key if it doesn't exist
function refreshStorage(): void;

// Saves/updates position for a dragId in localStorage
function saveDrag(dragId: string, x: number, y: number): void;
```

## 4. Data Models

### localStorage Position Entry

```ts
interface DragEntry {
  id: string;   // drag ID (user-provided or generated)
  x: number;    // horizontal offset in pixels
  y: number;    // vertical offset in pixels
  time: string; // ISO timestamp with colons/dots replaced by hyphens
}
```

Storage key: `"tiny-canvas-queue"`
Storage format: `JSON.stringify(DragEntry[])`

### Structural Signature (internal)

The `signature()` function builds a string like:
- `"div"` for a plain div
- `"Button"` for a component
- `"div(Button,span(#text))"` for nested structures

This string is then hashed with djb2 to produce the drag ID.

## 5. Core Logic

### Drag ID Resolution (Canvas)
```
For each child at index i:
  1. findDragId(child) — recursively walks child.props looking for `id` prop
  2. If found → use that as dragId
  3. If not → generateDragId(child, i):
     a. Build structural signature string from element tree
     b. Hash with djb2 → 8-char hex
     c. Return "tc-{hash}-{i}"
```

### Position Persistence Flow
```
On mount (Draggable):
  1. refreshStorage() — ensure localStorage key exists
  2. getQueue(dragId) — read saved {x, y}
  3. If non-zero → animate from origin to saved position
  4. Set position state to saved coordinates

On drag:
  5. Update position state with current {offsetX, offsetY}

On drag end:
  6. saveDrag(dragId, offsetX, offsetY):
     a. Read current queue from localStorage
     b. Find existing entry by id, or push new
     c. Write back to localStorage
```

### Entrance Animation
```
On mount, if saved position is non-zero:
  1. Add 'tc-on-translation' class to article element
  2. CSS transition moves element to saved position over ~500ms
     (250ms delay + 500ms cubic-bezier)
  3. After 1000ms (TRANSLATION_MS * 4), remove class
```

### djb2 Hash Algorithm
```
Input: string
h = 5381
For each char c in string:
  h = ((h << 5) + h + charCode(c)) >>> 0  // unsigned 32-bit
Return h.toString(16).padStart(8, '0')
```

## 6. Integration Points

### As a consumed package in storyboard-core

The package is published as `@dfosco/tiny-canvas` and can be consumed directly:

```js
import { Canvas, Draggable, useResetCanvas } from '@dfosco/tiny-canvas'
import '@dfosco/tiny-canvas/style.css'
```

**What storyboard-core would need to provide:**
- A discovery mechanism for canvas pages (analogous to `.prototype.json`)
- Route generation for canvases (or embedding canvases within prototype routes)
- Data binding so canvas children can consume storyboard scene/object/record data
- Scoped position persistence (currently global `localStorage` key)

### With Primer Primitives
The CSS custom properties automatically pick up Primer tokens when available:
- `--bgColor-muted` → `--tc-bg-muted`
- `--borderColor-muted` → `--tc-border-color`
- `--shadow-resting-small` → `--tc-shadow-rest`
- `--shadow-floating-small` → `--tc-shadow-float`

No additional configuration needed — just having `@primer/primitives` loaded is enough.

### With `@neodrag/react`
The sole runtime dependency. Provides:
- `useDraggable(ref, options)` → returns `{ isDragging }`
- Handles pointer events, bounds detection, grid snapping, threshold

## 7. Configuration

| Config | Location | Description |
|--------|----------|-------------|
| Grid size | `gridSize` prop | Snap grid in pixels (default 18) |
| Color mode | `colorMode` prop | 'auto', 'light', 'dark' |
| Storage key | Hardcoded `"tiny-canvas-queue"` | localStorage key for all positions |
| Translation speed | Hardcoded `TRANSLATION_MS = 250` | Base entrance animation timing |
| Default grid | Hardcoded `DEFAULT_GRID_SIZE = 18` | Fallback grid size |

## 8. Error Handling

All localStorage operations are wrapped in try/catch:
- `getQueue` → returns `{ x: 0, y: 0 }` on error
- `refreshStorage` → logs error, no-op
- `saveDrag` → logs error, position is lost
- `useResetCanvas` → logs error, no-op

No errors are thrown to the consumer. The library degrades gracefully to a non-persistent canvas.

## 9. Testing Strategy

The source repo has no tests. Key test cases for a re-implementation:

### Unit Tests
- `findDragId` — finds `id` prop at various depths, returns null when absent
- `generateDragId` — same structure produces same hash, different structures differ, index suffix disambiguates siblings
- `getQueue` / `saveDrag` / `refreshStorage` — round-trip persistence, handles missing/corrupt localStorage
- `useResetCanvas` — clears storage, optionally reloads

### Component Tests
- `Canvas` — wraps children in Draggable, passes gridSize when grid enabled
- `Canvas` — assigns drag IDs from child `id` props or generates them
- `Draggable` — restores saved position on mount
- `Draggable` — saves position on drag end
- `Draggable` — applies rotation during drag

### Integration Tests
- Full flow: render Canvas with children → drag element → unmount → remount → verify position restored
- Reset: drag elements → call reset → verify positions cleared

## 10. Implementation Order

For consuming the package in storyboard-core:

1. **Install `@dfosco/tiny-canvas` as a dependency** — the package is already published and can be consumed as-is
2. **Import and verify** — render a `<Canvas>` in a test page with storyboard data
3. **Scope persistence** — if needed, fork or wrap to scope localStorage keys per canvas/prototype
4. **Integrate with data plugin** — add `.canvas.json` discovery or route convention
5. **Wire into storyboard modes** — connect to the existing "Canvas" mode concept
6. **Add to Viewfinder** — make canvases browsable alongside prototypes

If the package needs modifications (e.g., scoped persistence, data binding), those changes should be made upstream in `@dfosco/tiny-canvas` and published as a new version, rather than forking into storyboard-core.
