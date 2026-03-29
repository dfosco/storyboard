# Canvas Integration — Implementation Plan

> Branch: `canvas-integration` (worktree at `.worktrees/canvas-integration`)
> Base: `main`

## Problem

Storyboard needs a spatial documentation surface — **canvases** — as a peer content type to prototypes. Where prototypes are page-based (routed, sequential), canvases are spatial boards for arranging widgets: sticky notes, markdown blocks, embedded prototype views, link previews, and more. Think "the Jam for the Fig" — lightweight documentation that complements the storyboard prototyping tool.

## Approach

Canvases are a new first-class object type in storyboard, built as a **workshop feature** that:

1. Uses `@dfosco/tiny-canvas` as the drag/surface engine
2. Adds `.canvas.json` as a new data file type discovered by the data plugin
3. Supports optional `.canvas.jsx` companion files that provide **live component widgets** — React exports that render on the canvas and stay linked to source (re-render on HMR)
4. Provides a generic React page component that renders canvas state into draggable widgets
5. Uses server middleware to persist widget changes (positions, content, settings) back to `.canvas.json` files on disk — making canvases git-trackable and source-editable
6. Surfaces canvases in the Viewfinder alongside prototypes

### The `.canvas.jsx` ↔ `.canvas.json` relationship

A canvas can be powered entirely by its `.canvas.json` file. However, a developer can **optionally** create a matching `.canvas.jsx` file that provides **live component widgets**:

```
buttons.canvas.json   ← source of truth for positions, mutable widgets (sticky notes, etc.)
buttons.canvas.jsx    ← optional: provides live React component exports as read-only widgets
```

**How it works:**

1. The `.canvas.jsx` file exports named React components. Each export becomes a draggable widget on the canvas:
   ```jsx
   // buttons.canvas.jsx
   export function PrimaryButtons() {
     return <ButtonGroup variant="primary">...</ButtonGroup>
   }
   export function DangerButtons() {
     return <ButtonGroup variant="danger">...</ButtonGroup>
   }
   ```

2. The **content** of JSX-sourced widgets stays **live** — changes to the `.jsx` file re-render via HMR. This makes canvases a natural place to document and showcase components.

3. The **positions** and **canvas-level settings** for JSX-sourced widgets are stored in `.canvas.json`. The server middleware writes positions there when widgets are dragged, but **never writes into the `.jsx`**.

4. Users can also add **mutable widgets** (sticky notes, markdown blocks, prototype embeds) through the canvas UI. These are stored entirely in `.canvas.json`.

5. The `.canvas.json` tracks JSX-sourced widgets by export name in a `sources` array:
   ```json
   {
     "title": "Button Patterns",
     "jsx": "buttons.canvas.jsx",
     "sources": [
       { "export": "PrimaryButtons", "position": { "x": 0, "y": 0 } },
       { "export": "DangerButtons", "position": { "x": 400, "y": 0 } }
     ],
     "widgets": [
       { "id": "sticky-1", "type": "sticky-note", "position": { "x": 200, "y": -100 }, "props": { "text": "These need review", "color": "yellow" } }
     ]
   }
   ```

6. New exports added to the `.jsx` appear on the canvas automatically (at default positions). Removed exports disappear. The JSON is the persistence layer, the JSX is the content layer.

### Widget types (v1)

| Widget | Source | Description |
|--------|--------|-------------|
| **Component** | `.canvas.jsx` export | Live React component, re-renders on source changes. Read-only content, mutable position. |
| **Sticky Note** | `.canvas.json` | Colored sticky note with editable text. Multiple color options. |
| **Markdown Block** | `.canvas.json` | Editable/rendered markdown in a white notepad frame with soft-dotted background. Toggle between edit and preview. |
| **Prototype Embed** | `.canvas.json` | Iframe embedding any internal storyboard route (other than Viewfinder/home). Live, interactive prototype preview. |

### Future widget types (not in v1)

- Rich Card Previews (link embeds with 2 layouts, editable title/text)
- GitHub Link (rich previews for GH resources)
- Any Link (generic URL embeds via Rich Card Previews)

---

## Architecture

### Data Model — `.canvas.json`

A canvas is a JSON file discovered by the data plugin, just like `.prototype.json`:

```json
{
  "title": "Design System Overview",
  "description": "Component inventory and flow documentation",
  "grid": true,
  "gridSize": 24,
  "colorMode": "auto",
  "jsx": "design-overview.canvas.jsx",
  "sources": [
    { "export": "ButtonShowcase", "position": { "x": 0, "y": 0 } },
    { "export": "InputVariants", "position": { "x": 500, "y": 0 } }
  ],
  "widgets": [
    {
      "id": "sticky-1",
      "type": "sticky-note",
      "position": { "x": 120, "y": -45 },
      "props": {
        "text": "Remember to update the button variants",
        "color": "yellow"
      }
    },
    {
      "id": "md-1",
      "type": "markdown",
      "position": { "x": 400, "y": 200 },
      "props": {
        "content": "## Button Patterns\n\nPrimary buttons should only appear once per page.",
        "width": 400
      }
    },
    {
      "id": "proto-1",
      "type": "prototype",
      "position": { "x": 0, "y": 300 },
      "props": {
        "src": "/Example",
        "width": 800,
        "height": 600,
        "label": "Example Prototype"
      }
    }
  ]
}
```

### File & Route Structure

Canvas files live inside `src/prototypes/`, alongside prototypes:

```
src/prototypes/
├── main.folder/
│   ├── Example/                       # existing prototype
│   │   └── index.jsx
│   ├── buttons.canvas.json            # a canvas (JSON-only, no JSX)
│   ├── design-overview.canvas.json    # a canvas with a JSX companion
│   └── design-overview.canvas.jsx     # live component exports for the canvas above
├── onboarding.canvas.json             # ungrouped canvas
└── index.jsx                          # Viewfinder (existing)
```

Canvases get routes derived from their file path, just like prototypes:
- `buttons.canvas.json` → `/buttons`
- `design-overview.canvas.json` → `/design-overview`
- Route is rendered by a generic `CanvasPage` component

### Component Architecture

```
packages/react/src/
├── canvas/
│   ├── CanvasPage.jsx              # Generic canvas page — reads .canvas.json, renders Canvas + widgets
│   ├── CanvasToolbar.jsx           # Floating toolbar for adding widgets, canvas settings
│   ├── useCanvas.js                # Hook: loads canvas data + resolves JSX module
│   ├── widgets/
│   │   ├── index.js                # Widget registry — maps type strings to components
│   │   ├── ComponentWidget.jsx     # Renders a live JSX export inside a draggable frame
│   │   ├── ComponentWidget.module.css
│   │   ├── StickyNote.jsx          # Sticky note widget
│   │   ├── StickyNote.module.css
│   │   ├── MarkdownBlock.jsx       # Markdown edit/preview widget
│   │   ├── MarkdownBlock.module.css
│   │   ├── PrototypeEmbed.jsx      # Iframe prototype embed widget
│   │   ├── PrototypeEmbed.module.css
│   │   └── WidgetWrapper.jsx       # Common wrapper — resize handles, delete button, drag ID
│   └── CanvasPage.module.css

packages/core/src/
├── workshop/features/
│   └── createCanvas/               # Workshop feature for creating canvases
│       ├── index.js                # Feature entry (name, label, icon, overlay)
│       ├── server.js               # Server handler: create, update, list canvases
│       └── CreateCanvasForm.svelte # Form overlay
```

### Data Flow

```
1. Data Plugin (build time)
   ├── Discovers *.canvas.json files
   ├── If canvas has "jsx" field, resolves the companion .canvas.jsx module path
   ├── Indexes canvases in the virtual module alongside prototypes
   └── Exports `canvases` from virtual:storyboard-data-index

2. Route Generation (build time)
   ├── For each canvas, generates a route pointing to CanvasPage
   └── CanvasPage receives the canvas name as a route param

3. CanvasPage (runtime)
   ├── Loads canvas data from index (via useCanvas hook)
   ├── If canvas has a JSX companion, dynamically imports it
   ├── Renders <Canvas> from @dfosco/tiny-canvas
   ├── For each JSX export → renders ComponentWidget (live, read-only content)
   ├── For each JSON widget → renders via widget registry (mutable content)
   └── All widgets are wrapped in <Draggable> with their persisted positions

4. Server Middleware (dev time)
   ├── POST /_storyboard/canvas/create   — creates new .canvas.json (+ optional .canvas.jsx)
   ├── PUT  /_storyboard/canvas/update   — updates positions/content in .canvas.json
   ├── POST /_storyboard/canvas/widget   — adds a mutable widget to .canvas.json
   └── DELETE /_storyboard/canvas/widget — removes a mutable widget from .canvas.json

5. Live Persistence
   ├── On drag end (any widget) → PUT to server → server writes positions to .canvas.json
   ├── On content edit (mutable widgets, debounced) → PUT to server → writes .canvas.json
   ├── On .canvas.json change → Vite HMR reload (data plugin already watches JSON files)
   └── On .canvas.jsx change → Vite HMR reload (standard JSX hot reload)
```

### Position Persistence: Server-first with localStorage Cache

Unlike standalone `@dfosco/tiny-canvas` which uses `localStorage`, canvas positions are **persisted to `.canvas.json` files via the server middleware**. This means:

- Positions are git-trackable and source-editable
- Positions survive across browsers/machines
- `@dfosco/tiny-canvas` localStorage is used as **optimistic local state** during drag — the final position is written to the server on drag end
- The server middleware **never writes into `.canvas.jsx`** files — only `.canvas.json`

### Widget Registry

Widgets are registered by type string → component mapping:

```js
// packages/react/src/canvas/widgets/index.js
import StickyNote from './StickyNote.jsx'
import MarkdownBlock from './MarkdownBlock.jsx'
import PrototypeEmbed from './PrototypeEmbed.jsx'

export const widgetRegistry = {
  'sticky-note': StickyNote,
  'markdown': MarkdownBlock,
  'prototype': PrototypeEmbed,
}
```

`ComponentWidget` is handled separately — it's not in the registry because it renders arbitrary JSX exports, not a fixed widget type.

Each mutable widget component receives:
```ts
interface WidgetProps {
  id: string
  props: Record<string, any>  // widget-type-specific props
  onUpdate: (props: Partial<WidgetProps['props']>) => void  // content changes
  onRemove: () => void
}
```

Each component widget receives:
```ts
interface ComponentWidgetProps {
  exportName: string           // name of the JSX export
  component: React.ComponentType  // the resolved component
  position: { x: number; y: number }
}
```

### Viewfinder Integration

The Viewfinder needs to show canvases alongside prototypes. Changes:

1. **Data plugin** exports a `canvases` index (keyed by name, with metadata)
2. **Viewfinder.svelte** adds canvases alongside prototypes, grouped by folder
3. Canvas entries get a distinct icon/badge to differentiate from prototype pages

### Workshop Feature: Create Canvas

Following the `createPrototype` pattern:

- **`createCanvas` feature** registered in `registry.js` and `registry-server.js`
- **`CreateCanvasForm.svelte`** — form with title input, optional folder selection, "Include JSX file" toggle
- **`server.js`** — writes a new `.canvas.json` (and optionally a starter `.canvas.jsx`) with empty widgets
- **Config**: `workshop.features.createCanvas: true` in `storyboard.config.json`

---

## Todos

### Phase 1: Foundation — Data Plugin & Routing

1. **Add `@dfosco/tiny-canvas` as dependency** — install in `packages/react`
2. **Add `.canvas.json` to data plugin discovery** — extend glob pattern, parse canvas files (including `jsx` field resolution), export `canvases` from virtual module
3. **Generate routes for canvases** — each `.canvas.json` gets a route pointing to a generic `CanvasPage` component
4. **Create `useCanvas` hook** — loads canvas data by name from the index, dynamically imports companion `.canvas.jsx` if present
5. **Create `CanvasPage` component** — renders `<Canvas>` from `@dfosco/tiny-canvas` with both JSX-sourced and JSON-defined widgets
6. **Import `@dfosco/tiny-canvas/style.css`** in `_app.jsx`

### Phase 2: Widgets — Core Types

7. **Create widget registry** — type string → component mapping
8. **Create `WidgetWrapper`** — common wrapper with drag ID, resize handles, delete button
9. **Create `ComponentWidget`** — renders live JSX exports in a labeled frame, read-only content
10. **Implement `StickyNote` widget** — colored card, editable text, color picker
11. **Implement `MarkdownBlock` widget** — edit/preview toggle, rendered markdown, notepad frame with dotted background
12. **Implement `PrototypeEmbed` widget** — iframe wrapper, configurable URL/size, label

### Phase 3: Server Persistence

13. **Add canvas server routes** — CRUD endpoints under `/_storyboard/canvas/`
14. **Wire drag-end to server** — on position change, PUT updated positions to server, server writes `.canvas.json`
15. **Wire content edits to server** — debounced PUT on text/markdown changes to `.canvas.json`
16. **Wire widget add/remove** — POST/DELETE widget endpoints for mutable widgets

### Phase 4: Workshop & Viewfinder

17. **Create `createCanvas` workshop feature** — form (with "Include JSX file" option), server handler, registry entries
18. **Update Viewfinder to show canvases** — add canvas entries alongside prototypes with distinct icon
19. **Add canvas config to `storyboard.config.json`** — `workshop.features.createCanvas: true`

### Phase 5: Polish

20. **Canvas toolbar** — floating UI for adding widgets (+ button → widget type picker)
21. **Widget resize** — drag handles for width/height on markdown blocks, prototype embeds, and component widgets
22. **Canvas settings** — grid toggle, grid size, color mode (per canvas, stored in `.canvas.json`)

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Surface engine | `@dfosco/tiny-canvas` as npm dep | Already built, tested, Primer-aware. Avoid reimplementing drag mechanics. |
| Data format | `.canvas.json` + optional `.canvas.jsx` | JSON is the mutable state layer. JSX provides live component content. Separation of concerns. |
| JSX content | Live, HMR-linked, read-only on canvas | Components re-render on source changes. Canvas never writes back to JSX. Source-editable by developers. |
| Persistence | Server middleware writes `.canvas.json` only | Git-trackable, source-editable. Never writes into JSX — avoids regex nightmares. |
| Position storage | Server-persisted in JSON, localStorage as optimistic cache | Best of both: git-trackable + smooth drag UX. |
| Widget system | Type-string registry + separate ComponentWidget | Registry is extensible for future types. Component widgets are a distinct concept (live source). |
| Canvas creation | Workshop feature (like createPrototype) | Consistent UX pattern, leverages existing infrastructure. |
| Routing | Generated from `.canvas.json` file paths | Same conventions as prototypes — no new routing paradigm. |
| Canvases in Viewfinder | Listed alongside prototypes | Canvases are peers, not a separate section buried in a menu. |

## Open Questions / Future Work

- **Default personal canvas**: Should each user have a default canvas that opens when clicking the Canvas mode? (deferred — requires user identity)
- **Widget plugins**: Third-party widget types registered via the plugin system (deferred — get core types working first)
- **Canvas mode integration**: Should switching to the `plan`/Canvas mode on a prototype page offer to open it in a canvas? (deferred)
- **Collaborative editing**: Live cursors, multi-user canvas editing via CRDT (far future — see d6-plugins.md cursors plugin)
- **Canvas templates**: Pre-built canvas layouts (e.g., "Component inventory", "Flow diagram") (future)
- **JSX export detection**: Auto-detect new/removed exports in `.canvas.jsx` and sync the `sources` array in `.canvas.json` (v1 can rely on manual or build-time sync)

## Notes

- `@dfosco/tiny-canvas` currently uses a global `localStorage` key. For storyboard, we override this by persisting to `.canvas.json` via server API instead. The `localStorage` layer in tiny-canvas is used only as optimistic cache during drag operations.
- The widget registry pattern is intentionally simple (plain object map) to make it easy for future plugins to register new widget types.
- Canvas files support the same folder scoping as prototypes — a canvas inside `main.folder/` is grouped under that folder in the Viewfinder.
- All widget content must handle `null`/`undefined` gracefully (storyboard convention).
- The `.canvas.jsx` file is a standard React module — it can import Primer components, storyboard hooks, CSS modules, anything a prototype page can. It just doesn't render as a routed page — its exports are rendered as widgets on the canvas surface.

---

## Status: Complete ✅

All 5 phases implemented. 2 commits on `canvas-integration` branch.

### Files created/modified

**New files (22):**
- `packages/core/src/canvas/server.js` — Canvas CRUD server handler
- `packages/core/src/workshop/features/createCanvas/` — Workshop feature (3 files)
- `packages/react/src/canvas/` — CanvasPage, useCanvas hook, toolbar, API client (7 files)
- `packages/react/src/canvas/widgets/` — 4 widget components + registry + wrapper (10 files)
- `src/prototypes/main.folder/design-overview.canvas.json` — Test canvas

**Modified files (11):**
- `packages/core/src/loader.js` — Added canvases to data index
- `packages/core/src/index.js` — Exported canvas functions
- `packages/core/src/viewfinder.js` — Added canvases to buildPrototypeIndex
- `packages/core/src/vite/server-plugin.js` — Registered canvas handler
- `packages/core/src/workshop/features/registry*.js` — Registered createCanvas
- `packages/core/src/svelte-plugin-ui/components/Viewfinder.svelte` — Canvas entries
- `packages/react/src/vite/data-plugin.js` — .canvas.json discovery
- `packages/react/src/index.js` — Exported CanvasPage + useCanvas
- `src/routes.jsx` — Canvas route generation
- `src/prototypes/_app.jsx` — Imported tiny-canvas styles
- `vite.config.js` — Added canvas alias
- `storyboard.config.json` — Enabled createCanvas feature

