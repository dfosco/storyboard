# Shadow Clone: Technical Plan — Storyboard Integration

> Part of: Tiny Canvas shadow clone
> Focus: How to integrate canvases as a first-class object type in storyboard-core, consumed as the `@dfosco/tiny-canvas` package

## 1. Module Overview

This plan covers how canvases become a **peer concept to prototypes** in the storyboard system. It addresses:
- Discovery: how canvas pages are found at build time
- Data: how canvas pages consume storyboard data (scenes, objects, records)
- Routing: how canvas pages get URLs
- Viewfinder: how canvases appear in the prototype browser
- Mode integration: relationship to the existing "Canvas" mode

## 2. File / Module Structure

The integration touches these areas of storyboard-core:

```
src/
├── prototypes/                  # Existing — may host canvases too
│   └── main.folder/
│       └── Example/
│           ├── index.jsx        # Existing prototype page
│           └── canvas.jsx       # NEW — a canvas page alongside prototype pages
│
packages/react/src/
├── vite/
│   └── data-plugin.js           # MODIFY — discover .canvas.json or canvas pages
├── Viewfinder.jsx               # MODIFY — show canvases in the browser
├── context.jsx                  # Possibly modify — wrap canvas pages with StoryboardProvider
└── index.js                     # MODIFY — re-export Canvas-related utilities

storyboard.config.json           # MODIFY — canvas configuration options

package.json                     # MODIFY — add @dfosco/tiny-canvas dependency
```

## 3. Integration Strategy: Canvas as Package

The recommended approach is to **consume `@dfosco/tiny-canvas` as an npm dependency** rather than re-implementing its internals. This keeps the canvas library independently versioned and testable.

### Install

```bash
npm install @dfosco/tiny-canvas
```

### Re-export through storyboard

```js
// packages/react/src/index.js
export { Canvas, Draggable, useResetCanvas } from '@dfosco/tiny-canvas'
```

This lets prototype/canvas page authors import from one place:
```js
import { Canvas, useSceneData, useObject } from '../storyboard'
```

### CSS

The canvas styles need to be imported once at app level. Options:
1. Import in `src/prototypes/_app.jsx` — simple, always available
2. Import conditionally per canvas page — lighter but more boilerplate
3. Add to the data plugin's virtual module — automatic

Recommended: option 1 for now.

```jsx
// src/prototypes/_app.jsx
import '@dfosco/tiny-canvas/style.css'
```

## 4. Discovery & Data Model

### Option A: Canvases as a special page type within prototypes (Recommended)

Canvases live inside prototype folders as regular `.jsx` pages but are identified by a convention:

1. **File naming convention**: Pages that import and render `<Canvas>` are canvas pages — no special file suffix needed. The canvas behavior comes from the component, not the file system.

2. **Optional `.canvas.json` metadata** (analogous to `.prototype.json`):

```json
// my-canvas.canvas.json
{
  "title": "Component Showcase",
  "description": "Drag components around to compare",
  "grid": true,
  "gridSize": 24,
  "colorMode": "auto"
}
```

3. **Data plugin changes**: Add `canvas` to the recognized suffixes in `data-plugin.js`:

```js
// Current pattern (line 10):
// **/*.{flow,scene,object,record,prototype,folder}.{json,jsonc}

// New pattern:
// **/*.{flow,scene,object,record,prototype,folder,canvas}.{json,jsonc}
```

4. **Virtual module addition**: The generated virtual module would export a `canvases` index alongside `flows`, `objects`, `records`, `prototypes`, `folders`.

### Option B: Canvases as a separate top-level directory

```
src/
├── prototypes/    # Page-based prototypes (existing)
└── canvases/      # Spatial canvas experiences (new)
    └── showcase/
        ├── index.jsx
        └── showcase.canvas.json
```

This is cleaner conceptually but requires duplicating the route generation, data scoping, and Viewfinder logic. Not recommended for v1.

### Recommendation

**Go with Option A.** Canvases are a special kind of prototype page, not a separate content type. This is consistent with how storyboard already works — the data system, routing, and scoping all apply. The `<Canvas>` component is what makes a page spatial, not its file location.

## 5. Canvas Pages — Authoring Pattern

A canvas page looks like a normal prototype page, but wraps its content in `<Canvas>`:

```jsx
// src/prototypes/main.folder/Example/canvas.jsx
import { Canvas } from '@dfosco/tiny-canvas'
import '@dfosco/tiny-canvas/style.css'
import { useSceneData, useObject } from '../../../storyboard'

export default function ShowcasePage() {
  const buttons = useSceneData('buttons')
  const user = useObject('jane-doe')

  return (
    <Canvas grid gridSize={24}>
      <div id="user-card">
        <h2>{user?.name}</h2>
        <p>{user?.profile?.bio}</p>
      </div>

      {buttons?.map((btn, i) => (
        <button key={btn.id} id={`btn-${btn.id}`}>
          {btn.label}
        </button>
      ))}
    </Canvas>
  )
}
```

Key points:
- Canvas pages use the same storyboard hooks (`useSceneData`, `useObject`, `useRecord`)
- Scene matching works the same way (page name matches scene name)
- The `StoryboardProvider` in `_app.jsx` wraps canvas pages like any other page
- Children should have `id` props for position persistence

## 6. Position Persistence Scoping

### Problem

Currently `@dfosco/tiny-canvas` stores all positions in a single `"tiny-canvas-queue"` localStorage key. If multiple canvases exist in a storyboard, drag IDs could collide.

### Solution Options

**Option 1: Prefix drag IDs with canvas/route path**

Wrap the Canvas component to prefix all drag IDs with the current route:

```jsx
// packages/react/src/CanvasWrapper.jsx
import { Canvas as TinyCanvas } from '@dfosco/tiny-canvas'
import { useLocation } from 'react-router-dom'

export function Canvas({ children, ...props }) {
  const { pathname } = useLocation()
  // Pass a scoping prefix to Canvas (requires upstream support)
  return <TinyCanvas scope={pathname} {...props}>{children}</TinyCanvas>
}
```

This requires adding a `scope` prop to `@dfosco/tiny-canvas` — a good upstream enhancement.

**Option 2: Separate localStorage keys per route**

Modify the utils to accept a namespace parameter:
- Key: `"tiny-canvas-queue:{routePath}"`
- This scopes positions naturally

**Option 3: Use storyboard's hash-based state**

Instead of localStorage, store positions in the URL hash alongside storyboard overrides. This makes canvas arrangements shareable and linkable — consistent with storyboard's philosophy that "state lives in the URL hash."

### Recommendation

Start with **Option 2** (separate localStorage keys) for v1 — it's the simplest change to `@dfosco/tiny-canvas`. Consider **Option 3** (hash state) as a future enhancement for shareability.

## 7. Viewfinder Integration

The Viewfinder (prototype browser) should distinguish canvas pages:

### Discovery

The Viewfinder currently gets page modules via `import.meta.glob('/src/prototypes/*/*.jsx')`. Canvas pages would appear here naturally — no change needed for basic discovery.

### Visual distinction

To visually distinguish canvases in the browser:

1. Check for a `.canvas.json` metadata file associated with the page
2. Or detect at the module level if the page exports a canvas marker:
   ```jsx
   // In canvas pages:
   export const isCanvas = true
   ```
3. Render a different icon/badge in the Viewfinder for canvas pages

### Filtering

The Viewfinder could add a filter toggle: "All / Prototypes / Canvases" to let users browse by type.

## 8. Mode Integration

The storyboard data plugin already defines a mode with label `"Canvas"`:

```js
{ name: 'plan', label: 'Canvas', hue: '#4a7fad' }
```

This suggests canvases were envisioned as a **viewing mode** — a way to present any prototype's components on a spatial surface. This is a different (and complementary) concept to canvases as a page type:

| Concept | What it is | How it works |
|---------|-----------|--------------|
| **Canvas mode** | A way to VIEW any prototype page's components spatially | Mode toggle wraps page content in `<Canvas>` |
| **Canvas page** | A page authored as a spatial canvas from the start | Author writes `<Canvas>` directly in JSX |

Both can coexist:
- Canvas pages are spatial by design (the author chose this layout)
- Canvas mode is an on-demand toggle (the viewer chooses to rearrange any page's components)

For v1, focus on **canvas pages** (the object type). Canvas mode can be added later by wrapping page content in `<Canvas>` when the mode is active.

## 9. Configuration

### storyboard.config.json additions

```json
{
  "canvas": {
    "enabled": true,
    "defaultGrid": true,
    "defaultGridSize": 24,
    "defaultColorMode": "auto",
    "persistence": "localStorage"
  }
}
```

### .canvas.json per-canvas overrides

```json
{
  "title": "Button Showcase",
  "description": "All button variants on one canvas",
  "grid": true,
  "gridSize": 18,
  "colorMode": "dark",
  "scene": "buttons-scene"
}
```

The `scene` field could explicitly bind a canvas to a specific scene, overriding automatic page-name matching.

## 10. Error Handling

- Canvas pages must follow storyboard's null-safety conventions: all data from `useSceneData`, `useObject`, `useRecord` must be guarded with optional chaining
- Position persistence failures are handled by `@dfosco/tiny-canvas` (try/catch, graceful degradation)
- Missing `.canvas.json` is fine — canvases work without metadata

## 11. Testing Strategy

### Integration tests
- Canvas page renders within StoryboardProvider and loads scene data
- Canvas page children are draggable
- Position persistence scoped per route (no cross-canvas collisions)
- Viewfinder shows canvas pages with correct metadata

### Data plugin tests
- `.canvas.json` files are discovered and indexed
- Canvas metadata appears in the virtual module exports
- Duplicate canvas names within a scope are detected

## 12. Implementation Order

1. **Add `@dfosco/tiny-canvas` as dependency** to `package.json`
2. **Import style.css** in `_app.jsx`
3. **Create a test canvas page** in an existing prototype folder
4. **Verify basic integration** — dragging works, data hooks work, persistence works
5. **Add `.canvas.json` suffix** to data plugin discovery pattern
6. **Export canvas metadata** in the virtual module
7. **Update Viewfinder** to show canvas pages distinctly
8. **Scope position persistence** — separate localStorage keys per route
9. **Add canvas config** to storyboard.config.json schema
10. **Document** the canvas page authoring pattern in README / architecture docs
