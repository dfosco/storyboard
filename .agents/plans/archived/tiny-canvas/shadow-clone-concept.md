# Shadow Clone: Conceptual Plan — Tiny Canvas

> Source: `/Users/df/workspace/tiny-canvas/` (`@dfosco/tiny-canvas` v1.1.0)
> Focus: Consume as a package and integrate canvases as a first-class object type in storyboard-core, alongside prototypes
> Generated: 2026-03-29

## 1. Purpose & Overview

Tiny Canvas is a lightweight React component library that provides a **free-form draggable canvas surface**. Users place React elements on a dotted/gridded background and drag them around freely — positions are persisted to `localStorage` so arrangements survive page reloads.

In the storyboard context, a canvas is a **spatial layout mode** for presenting UI components. Where prototypes are page-based (routed, sequential), canvases are spatial (free-form, arranging elements on a 2D surface). The goal is to make canvases a peer concept to prototypes in the storyboard system.

## 2. Architecture Overview

Tiny Canvas is a small, focused library with three layers:

```
┌─────────────────────────────────────────────┐
│  Canvas (container)                         │
│  ┌─────────────────────────────────────────┐│
│  │  Draggable (per-child wrapper)          ││
│  │  ┌─────────────────────────────────────┐││
│  │  │  User content (any React element)   │││
│  │  └─────────────────────────────────────┘││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Persistence (utils.js) │
│  localStorage queue     │
└─────────────────────────┘
```

- **Canvas** — wraps each child in a `Draggable`, assigns stable drag IDs, renders the background surface
- **Draggable** — uses `@neodrag/react` for drag mechanics, restores saved positions on mount with an entrance animation
- **utils.js** — localStorage persistence layer (read/write/reset position queue), drag ID generation via structural hashing
- **useResetCanvas** — React hook to clear all saved positions
- **style.css** — all visual styling via `--tc-*` CSS custom properties, with Primer Primitives fallbacks

## 3. Core Concepts & Domain Model

| Concept | Description |
|---------|-------------|
| **Canvas** | A full-viewport surface that holds draggable children. Renders as `<main class="tc-canvas">`. |
| **Draggable** | A wrapper around any React element that enables drag-and-drop with position persistence. Renders as `<article>` with a `.tc-draggable-inner` div. |
| **Drag ID** | A stable identifier for each draggable element, used as the key in localStorage. Either the child's `id` prop (found via `findDragId`) or an auto-generated hash from the element's structural signature (`generateDragId`). |
| **Position Queue** | A JSON array in `localStorage` under key `"tiny-canvas-queue"`. Each entry: `{ id, x, y, time }`. |
| **Grid** | Optional snap-to-grid behavior. When enabled, elements snap to a grid of configurable size (default 18px) and a dot pattern is shown on the background. |
| **Translation** | An entrance animation that plays when an element has a saved position — it slides from origin to its saved coordinates over ~1 second. |

## 4. Key Design Decisions

### Why `@neodrag/react`?
Provides a React-hook-based drag API (`useDraggable`) that's lightweight and flexible. It handles pointer events, bounds, grid snapping, and threshold delays — removing the need to implement drag mechanics from scratch. It's the only runtime dependency.

### Why localStorage for persistence?
Positions are user-specific and ephemeral — they represent personal arrangement preferences, not shared data. localStorage is zero-config, works offline, and requires no backend. The key `"tiny-canvas-queue"` stores all canvas positions globally (not scoped per canvas), which is simple but means all canvases on a domain share one position namespace.

### Why structural hashing for drag IDs?
When children don't have explicit `id` props, the library generates IDs from a djb2 hash of the React element tree's **structural signature** (component names and nesting only, not prop values or text content). This makes IDs stable across re-renders and content changes, only breaking when the component structure itself changes.

### Why CSS custom properties with Primer fallbacks?
The `--tc-*` variables default to hardcoded values but first try Primer Primitives tokens (`--bgColor-muted`, `--borderColor-muted`, `--shadow-resting-small`, etc.). This makes the canvas visually consistent with any Primer-themed app without requiring Primer as a dependency.

### Why `<main>` and `<article>` semantics?
Canvas uses `<main>` (it's the primary content surface) and each draggable uses `<article>` (self-contained content unit). This gives meaningful semantic structure to what is otherwise a spatial layout.

## 5. Features & Behavior

### Canvas Surface
- Full-viewport (`100vw × 100vh`) background surface
- Optional **centered layout** (flexbox column, centered) — on by default
- Optional **dot grid** background pattern via CSS `radial-gradient`
- **Color mode** support: `auto` (follows system `prefers-color-scheme`), `light`, or `dark`
- Light/dark mode changes background, dots, borders, and shadows via CSS

### Drag & Drop
- Every child of `<Canvas>` is automatically wrapped in `<Draggable>`
- Drag threshold: 50ms delay and 30px distance (prevents accidental drags from clicks)
- Bounded to `<body>` — elements can't be dragged off-screen
- Optional grid snapping when `grid` or `gridSize` is set
- Cursor changes to `grabbing` while dragging
- Subtle rotation effect (±2°) during drag for tactile feel
- User selection disabled on text elements during drag

### Position Persistence
- Positions saved to localStorage on drag end
- Restored on component mount with a smooth entrance animation
- `useResetCanvas()` hook provides a clear-all function
- Graceful error handling — all localStorage operations are try/catch wrapped

### Visual Effects
- Rest shadow + float shadow (elevated on hover/drag)
- Border outline on hover/drag/translation
- Border radius via custom property
- Smooth transitions on all state changes

## 6. External Interfaces

### Component API

```tsx
// Canvas — the container surface
<Canvas
  centered={true}     // Center children with flexbox (default: true)
  dotted={false}       // Show dot background without grid snap (default: false)
  grid={false}         // Enable grid snap + dot background (default: false)
  gridSize={18}        // Grid size in pixels (default: 18)
  colorMode="auto"     // 'auto' | 'light' | 'dark' (default: 'auto')
>
  {children}
</Canvas>

// Draggable — standalone wrapper (used internally by Canvas)
<Draggable
  gridSize={18}        // Grid snap size (optional)
  dragId="my-element"  // Stable ID for persistence (optional)
>
  {children}
</Draggable>
```

### Hook API

```ts
// Returns () => void that clears all positions
const reset = useResetCanvas({ reload: false })
```

### Utility API

```ts
findDragId(children: ReactNode): string | null
generateDragId(element: ReactNode, index: number): string
getQueue(dragId: string): { x: number; y: number }
refreshStorage(): void
saveDrag(dragId: string, x: number, y: number): void
```

### CSS Custom Properties

| Variable | Default (light) | Purpose |
|----------|----------------|---------|
| `--tc-border-radius` | `12px` | Corner radius for draggable items |
| `--tc-shadow-rest` | `0 1px 3px rgba(0,0,0,0.12)` | Shadow at rest |
| `--tc-shadow-float` | `0 4px 12px rgba(0,0,0,0.15)` | Shadow when elevated |
| `--tc-border-color` | `rgba(0,0,0,0.15)` | Active/hover border |
| `--tc-bg-muted` | `#f6f8fa` | Canvas background |
| `--tc-dot-color` | `rgba(0,0,0,0.08)` | Grid dot color |
| `--tc-grid-size` | `36px` | Grid dot spacing |

### localStorage Schema

Key: `"tiny-canvas-queue"`

```json
[
  { "id": "card-1", "x": 120, "y": -45, "time": "2026-03-29T12-00-00-000Z" },
  { "id": "tc-a1b2c3d4-0", "x": 0, "y": 0, "time": "2026-03-29T12-00-01-000Z" }
]
```

### Package Exports

```json
{
  ".": { "import": "./src/index.js", "types": "./src/index.d.ts" },
  "./style.css": "./src/style.css"
}
```

## 7. Cross-Cutting Concerns

### Error Handling
All localStorage operations are wrapped in try/catch with `console.error` logging. Failures are non-fatal — elements simply start at `{ x: 0, y: 0 }`.

### Browser Compatibility
Uses standard Web APIs: `localStorage`, `prefers-color-scheme` media query, CSS custom properties, `radial-gradient`. No polyfills needed for modern browsers.

### Accessibility
- Semantic HTML (`<main>`, `<article>`)
- `cursor: grab/grabbing` visual affordance
- `user-select: none` only during active drag
- `touch-action: none` on draggable inner for touch device compatibility

### Testing
No tests exist in the source repo currently.

## 8. Dependencies & Rationale

| Dependency | Version | Purpose | Equivalent in other stacks |
|------------|---------|---------|---------------------------|
| `@neodrag/react` | ^2.3.0 | React drag hook with grid snap, bounds, threshold | `react-draggable`, `dnd-kit`, `@use-gesture/react` |
| `react` | ^18 \|\| ^19 | Peer dependency | — |
| `react-dom` | ^18 \|\| ^19 | Peer dependency | — |

### Build tooling (dev only)
- Vite with `@vitejs/plugin-react` for library build
- Outputs ES module format, externalizes React

## 9. Assumptions & Gaps

### For storyboard integration
- **Position namespace**: Currently all canvases on a domain share one localStorage key (`"tiny-canvas-queue"`). For storyboard, positions should likely be scoped per-canvas (e.g. by canvas name or prototype path) to avoid ID collisions.
- **Canvas as mode vs. object**: The storyboard data plugin already has a `"Canvas"` mode label. The integration must clarify whether a canvas is a **mode** (how to view prototypes) or a **type** (a distinct content object like prototypes). The user's request suggests the latter — canvases as a peer to prototypes.
- **Data binding**: Tiny Canvas currently has no data binding — children are hardcoded JSX. For storyboard, canvas items may need to consume scene data, objects, or records (same as prototype pages do today).
- **Discovery**: Prototypes are discovered via `.prototype.json` manifests and file-system conventions. Canvases would need an analogous discovery mechanism (e.g. `.canvas.json` manifests, a `src/canvases/` directory, or a naming convention within `src/prototypes/`).
- **Routing**: Prototypes have full page routing via generouted. Canvases may or may not need routing — they could be single-page experiences, or multi-scene.
- **`@neodrag/react` as dependency**: This is a React-specific library. If storyboard ever supports non-React frameworks, the drag mechanics would need to be swapped.
