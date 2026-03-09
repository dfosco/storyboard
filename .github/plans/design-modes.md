# Design Modes — Implementation Plan

> A mode-switching system for storyboard-core where each mode is an independent plugin.

## Overview

**Design Modes** is a core concept in storyboard: the ability to switch between different ways of interacting with a prototype. The mode switcher lives in core; each mode is a separate plugin.

### Core (in `packages/core/`)
- Mode registry: `registerMode(name, config)`
- Mode switching: `activateMode(name)` / `deactivateMode()` / `getCurrentMode()`
- Reactive subscription: `subscribeToMode(callback)`
- URL param: `?mode=prototype|present|canvas|inspect`
- Event bus for cross-plugin communication: `on('mode:change')`, `on('room:create')`, etc.

### React Layer (in `packages/react/`)
- `useMode()` hook
- `ModeSwitch` component (segmented toggle, fixed bottom-center)
- `ToolbarShell` component (right-side stacked toolbars for tools + dev features)

### Mode Plugins (each its own package)

| Plugin | Package | What it does |
|--------|---------|-------------|
| **Prototype** | `@dfosco/storyboard-mode-prototype` | Default mode — wraps current behavior, no-op. Registers itself so the toggle has a baseline. |
| **Present** | `@dfosco/storyboard-mode-present` | Slideshow playback of `.slides.json` flows. Room creation via Yjs for live sync. Recording UI to capture navigation flows. |
| **Canvas** | `@dfosco/storyboard-mode-canvas` | Interactive workspace with draggable iframe windows (interact.js + Alpine.js). Add/remove/reorganize pages. Annotation layer. |
| **Inspect** | `@dfosco/storyboard-mode-inspect` | Right-panel showing page source from GitHub, props docs, token references, component recommendations. |

### Cursor Plugin (separate, cross-cutting)
- `@dfosco/storyboard-plugin-cursors`
- Listens to mode lifecycle events (`room:create`, `canvas:ready`)
- Auto-activates in Present and Canvas modes
- Shares the Yjs room created by Present mode

## Architecture

```
packages/core/src/
  └── modes.js              ← mode registry, URL param, event bus

packages/react/src/
  ├── hooks/useMode.js      ← React hook wrapping core modes API
  ├── ModeSwitch.jsx        ← segmented toggle component
  └── ToolbarShell.jsx      ← right-side toolbar container

packages/mode-prototype/    ← @dfosco/storyboard-mode-prototype
packages/mode-present/      ← @dfosco/storyboard-mode-present
packages/mode-canvas/       ← @dfosco/storyboard-mode-canvas
packages/mode-inspect/      ← @dfosco/storyboard-mode-inspect
packages/plugin-cursors/    ← @dfosco/storyboard-plugin-cursors
```

### Core Modes API (`packages/core/src/modes.js`)

```js
// Registry
registerMode(name, { label, icon?, onActivate?, onDeactivate? })
unregisterMode(name)
getRegisteredModes()    // returns array of { name, label, icon }

// Switching
activateMode(name, options?)
deactivateMode()        // returns to 'prototype'
getCurrentMode()        // reads ?mode= param

// Reactivity
subscribeToMode(callback)
getModeSnapshot()       // for useSyncExternalStore

// Event bus (cross-plugin communication)
on(event, callback)
off(event, callback)
emit(event, ...args)

// Events emitted by core:
//   'mode:change'    (from, to)
//   'mode:activate'  (name, options)
//   'mode:deactivate'(name)

// Events emitted by plugins:
//   'room:create'    (roomId)        — Present mode
//   'room:join'      (roomId)        — Present mode
//   'room:leave'     ()              — Present mode
//   'canvas:ready'   (canvasEl)      — Canvas mode
//   'canvas:destroy' ()              — Canvas mode
```

### Mode Plugin Contract

Each mode plugin exports a registration function:

```js
// Example: packages/mode-present/src/index.js
export default function presentMode() {
  return {
    name: 'present',
    label: 'Present',
    icon: 'play',          // octicon name or SVG
    onActivate(options) {   // called when mode becomes active
      // setup UI, load slides, etc.
    },
    onDeactivate() {        // called when leaving this mode
      // cleanup
    },
    tools: [                // registered into ToolbarShell
      { id: 'record', label: 'Record', icon: 'dot-fill', action: startRecording },
      { id: 'prev-slide', label: 'Previous', icon: 'chevron-left', action: prevSlide },
      { id: 'next-slide', label: 'Next', icon: 'chevron-right', action: nextSlide },
    ],
    devTools: [             // registered into dev toolbar
      // mode-specific dev tools if any
    ],
  }
}
```

### State Management

Follows storyboard's existing two-layer model:

| State | Storage | Key |
|-------|---------|-----|
| Active mode | URL search param | `?mode=prototype\|present\|canvas\|inspect` |
| Active slide index | URL hash | `#slide=3` |
| Recording in progress | localStorage | `storyboard:recording` |
| Recorded flow | `.slides.json` file | Persisted to disk |
| Canvas layout | localStorage | `storyboard:canvas-layout` |
| Room connection | In-memory | Yjs awareness state |

### `.slides.json` Format

New data file type for the storyboard data system:

```json
[
  { "route": "/", "params": {}, "label": "Homepage" },
  { "route": "/Issues", "params": { "scene": "issues-empty" }, "label": "Empty state" },
  { "route": "/Issues", "params": { "filter": "open" }, "label": "Filtered issues" },
  { "route": "/issues/123", "params": {}, "label": "Issue detail" }
]
```

Discovered by the Vite data plugin alongside `.scene.json`, `.object.json`, `.record.json`.

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    Page Content                         │
│                                                         │
│                                              ┌────────┐ │
│                                              │ Tools  │ │
│                                              │ Bar    │ │
│                                              ├────────┤ │
│                                              │ Dev    │ │
│                                              │ Bar    │ │
│                                              └────────┘ │
│                                                         │
│         ┌────────────────────────────────────┐          │
│         │ Prototype · Present · Canvas · Inspect │      │
│         └────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

- **Center bottom**: Segmented toggle (ModeSwitch) — fixed position, rounded pill
- **Right side**: Two stacked rounded toolbars
  - Top: Mode-specific tools (e.g., slide controls in Present, add window in Canvas)
  - Bottom: Developer tools (create page, add data, record)

### Dependencies per Plugin

| Package | Dependencies | Purpose |
|---------|-------------|---------|
| Core `modes.js` | None | Pure JS |
| React `ModeSwitch` | `@dfosco/storyboard-core` | Hook + component |
| `mode-prototype` | None | No-op registration |
| `mode-present` | `yjs`, `y-websocket` (lazy) | Room sync |
| `mode-canvas` | `interact.js`, `alpinejs` | Drag/resize |
| `mode-inspect` | GitHub API fetch | Source code |
| `plugin-cursors` | `yjs`, `y-websocket` (shared) | Cursor overlay |

## Implementation Phases

### Phase 1 — Core Mode System
- `modes.js` in `packages/core/` (registry, switching, events, URL param)
- `useMode()` hook in `packages/react/`
- `ModeSwitch.jsx` + `ToolbarShell.jsx` in `packages/react/`
- `mode-prototype` plugin (no-op baseline)

### Phase 2 — Inspect Mode
- `mode-inspect` plugin (GitHub source panel, docs panel)
- Least interactive, good for proving the plugin contract

### Phase 3 — Present Mode
- `.slides.json` data type + Vite plugin update
- Recorder (capture navigation → localStorage → `.slides.json`)
- Playback (step through slides)
- Room sync (Yjs presenter → spectators)

### Phase 4 — Canvas Mode
- Canvas workspace (interact.js + Alpine.js)
- iframe page windows (add/remove/resize/drag)
- Annotation layer

### Phase 5 — Cursors Integration
- `plugin-cursors` package
- Lifecycle hooks with Present + Canvas modes
- Shared Yjs room reuse
