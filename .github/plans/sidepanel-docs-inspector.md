# Side Panel: Documentation & Inspector

**Goal:** #g012
**Summary:** A push-style side panel with two views — Documentation and Inspector — triggered from the CoreUIBar. The panel slides in from the right and pushes `#root` content over instead of overlaying it. Background color follows the active mode's collar color.

---

## Architecture Overview

```
CoreUIBar (existing)
├── [📄] DocTriggerButton       ← NEW — opens SidePanel in "docs" tab
├── [🔍] InspectorTriggerButton ← NEW — opens SidePanel in "inspector" tab  
├── CreateMenuButton (existing)
├── CommentsMenuButton (existing)
└── CommandMenu (existing)

SidePanel.svelte (NEW)
├── TabBar: [Documentation | Inspector]
├── DocPanel.svelte (NEW)
│   ├── README.md viewer (fetched from server)
│   └── Route source viewer (fetched from server)
└── InspectorPanel.svelte (NEW)
    ├── Empty state: "Select an element to start"
    ├── Inspector mouse mode toggle button
    └── Component info display (name, props, source, chain)
```

### Push Layout Mechanism

The panel uses a CSS-driven push layout. When the side panel opens:
1. A class `sb-sidepanel-open` is added to `<html>`
2. CSS transitions `#root` with `margin-right: var(--sidepanel-width)`
3. The panel itself is `position: fixed; right: 0; top: 0; bottom: 0; width: var(--sidepanel-width)`
4. The panel background uses `--mode-color` (already set per mode in `modes.css`)

This follows the existing pattern where mode classes on `<html>` drive layout changes (see `modes.css:22-33`).

### Panel Width
- `--sidepanel-width: 420px` (matches comment drawer width for consistency)

---

## Phase 1: Side Panel Shell + Push Layout

### 1.1 Side Panel Store
**File:** `packages/core/src/stores/sidePanelStore.ts`

Svelte writable store managing:
- `open: boolean` — panel visibility
- `activeTab: 'docs' | 'inspector'` — which view is showing
- Actions: `openPanel(tab)`, `closePanel()`, `togglePanel(tab)`

When `open` changes, toggle `sb-sidepanel-open` class on `<html>`.

### 1.2 Push Layout CSS
**File:** `packages/core/src/sidepanel.css` (imported by SidePanel.svelte)

```css
:root {
  --sidepanel-width: 420px;
}

html.sb-sidepanel-open > body > #root {
  margin-right: var(--sidepanel-width);
  transition: margin-right 0.25s ease;
}

html:not(.sb-sidepanel-open) > body > #root {
  margin-right: 0;
  transition: margin-right 0.25s ease;
}
```

Also needs to push the CoreUIBar (fixed bottom-right) and ModeSwitch (fixed bottom-center) when panel opens. The CoreUIBar `right: 24px` should become `right: calc(var(--sidepanel-width) + 24px)`.

### 1.3 SidePanel Component
**File:** `packages/core/src/SidePanel.svelte`

- Fixed right, full height, z-index above content but below CoreUIBar
- Tab bar at top: Documentation | Inspector
- Slot-like rendering of active tab content
- Close button (X) in top-right
- Background: `var(--mode-color)` with transparency
- Slide-in animation from right

### 1.4 CoreUIBar Integration
**File:** `packages/core/src/CoreUIBar.svelte` (modify)

- Add two new trigger buttons to the left of existing buttons:
  - 📄 Documentation trigger (book octicon)
  - 🔍 Inspector trigger (code-review or search octicon)
- Each button calls `openPanel('docs')` or `openPanel('inspector')`
- Active state when panel is open on their respective tab
- Config-driven via `core-ui.config.json` menus

### 1.5 Config
**File:** `packages/core/core-ui.config.json` (modify)

Add new menu entries for the side panel triggers:
```json
"sidepanel": {
  "docs": {
    "ariaLabel": "Documentation",
    "icon": "book",
    "modes": ["*"]
  },
  "inspector": {
    "ariaLabel": "Inspector",
    "icon": "code-review",
    "modes": ["inspect"]
  }
}
```

---

## Phase 2: Documentation Panel

### 2.1 Server-Side: Docs Route Handler
**File:** `packages/core/src/vite/docs-handler.js`

New route handler registered at `/_storyboard/docs/`:
- `GET /_storyboard/docs/readme` — reads and serves `README.md` from project root
- `GET /_storyboard/docs/source?path=src/prototypes/...` — reads and serves a source file (restricted to `src/` directory for safety)
- Returns `{ content: string, path: string }`

Register in `server-plugin.js`:
```js
routeHandlers.set('docs', docsHandler({ root, sendJson }))
```

### 2.2 DocPanel Component
**File:** `packages/core/src/DocPanel.svelte`

Sub-tabs within the documentation view:
- **README**: Fetches from `/_storyboard/docs/readme`, renders as markdown
  - Use a lightweight approach: either `marked` (already popular, small) or `<pre>` for v1
  - Consider `snarkdown` (~1KB) for minimal footprint
- **Source**: Fetches from `/_storyboard/docs/source?path=...`
  - Derives the current route's source file path from `window.location.pathname` + file convention
  - Shows syntax-highlighted source code
  - Use Shiki for syntax highlighting (already used by Vite ecosystem) or simple `<pre><code>`

### 2.3 Navigation
- Left sidebar or tab list showing available docs/pages
- File tree of `src/prototypes/` for source navigation
- Link from source view back to the rendered page

---

## Phase 3: Inspector Panel

### 3.1 React Fiber Walker
**File:** `packages/core/src/inspector/fiberWalker.js`

Framework-agnostic utility (zero npm deps, lives in core):

```js
export function getFiberFromElement(el) {
  const key = Object.keys(el).find(
    k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
  )
  return key ? el[key] : null
}

export function getComponentInfo(fiber) {
  // Walk up to find nearest user component (skip host elements like div/span)
  let current = fiber
  while (current) {
    if (typeof current.type === 'function' || typeof current.type === 'object') {
      return {
        name: current.type?.displayName || current.type?.name || 'Anonymous',
        props: current.memoizedProps,
        source: current._debugSource || null,
        owner: current._debugOwner?.type?.name || null,
      }
    }
    current = current.return
  }
  return null
}

export function getComponentChain(fiber) {
  const chain = []
  let current = fiber
  while (current) {
    if (typeof current.type === 'function' || typeof current.type === 'object') {
      chain.push({
        name: current.type?.displayName || current.type?.name || 'Anonymous',
        source: current._debugSource || null,
      })
    }
    current = current.return
  }
  return chain
}
```

### 3.2 Inspector Mouse Mode
**File:** `packages/core/src/inspector/mouseMode.js`

When activated:
1. Creates a highlight overlay (`position: fixed; pointer-events: none; z-index: 99998`)
2. Listens to `mousemove` on `document` — positions overlay over hovered element
3. Shows component name tooltip near cursor
4. On `click`: captures the element, deactivates mouse mode, returns selected element info
5. On `Escape`: deactivates mouse mode

Returns a `{ activate, deactivate, onSelect }` API.

### 3.3 InspectorPanel Component
**File:** `packages/core/src/InspectorPanel.svelte`

States:
- **Empty**: "Select an element to start" message + activate button
- **Inspecting**: Mouse mode active, instructions shown
- **Selected**: Shows component info:
  - Component name (large, bold)
  - Source file path (clickable — opens in editor via `vscode://file/...`)
  - Props table (collapsible, JSON-formatted)
  - Component chain (breadcrumb-style ancestry)
  - "Re-select" button to pick another element

Header:
- Top-right toggle button for inspector mouse mode (crosshair icon)
- Active state styling when mouse mode is on

---

## Phase 4: Polish & Integration

### 4.1 Keyboard Shortcuts
- `Cmd+I` or `Cmd+Shift+I` — toggle inspector panel
- `Cmd+D` — toggle documentation panel
- `Escape` — close panel / exit mouse mode

### 4.2 Mode-Aware Behavior
- Inspector trigger only shows in `inspect` mode (or all modes — TBD)
- Documentation trigger shows in all modes
- Panel background adapts to mode color

### 4.3 Persistence
- Remember last active tab in `localStorage`
- Remember panel open/closed state per session

### 4.4 Tests
- `fiberWalker.test.js` — unit tests for fiber extraction
- `mouseMode.test.js` — unit tests for mouse mode lifecycle
- `sidePanelStore.test.ts` — store state management tests

---

## File Inventory

### New Files
| File | Purpose |
|------|---------|
| `packages/core/src/stores/sidePanelStore.ts` | Panel state store |
| `packages/core/src/sidepanel.css` | Push layout CSS |
| `packages/core/src/SidePanel.svelte` | Panel shell component |
| `packages/core/src/DocPanel.svelte` | Documentation view |
| `packages/core/src/InspectorPanel.svelte` | Inspector view |
| `packages/core/src/inspector/fiberWalker.js` | React fiber introspection |
| `packages/core/src/inspector/mouseMode.js` | Click-to-select DOM inspector |
| `packages/core/src/vite/docs-handler.js` | Server-side docs/source API |

### Modified Files
| File | Change |
|------|--------|
| `packages/core/src/CoreUIBar.svelte` | Add doc + inspector trigger buttons |
| `packages/core/src/vite/server-plugin.js` | Register docs route handler |
| `packages/core/core-ui.config.json` | Add sidepanel config |
| `packages/core/src/modes.css` | Add sidepanel-aware positioning rules |

---

## Decisions

1. **Panel type**: Shared panel with tab bar — both triggers open the same panel, switching between Documentation and Inspector tabs
2. **Inspector visibility**: Inspector trigger only shows in `inspect` mode; Documentation trigger shows in all modes
3. **Markdown renderer**: `marked` (~40KB) for full GitHub-flavored markdown support
4. **Source file resolution**: React fiber `_debugSource` only — most accurate, dev-only is acceptable since this is a dev tool
