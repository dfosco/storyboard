# Design Modes

> Core mode-switching system with plugin tool registration. Storyboard core runs on Svelte.

## Overview

**Design Modes** define the different ways storyboard's tooling is made available to users. Modes are a **core feature** — they exist and mount automatically, not at the app's discretion.

The entire core infrastructure — modes, toolbar, plugin UI framework — is built in **Svelte 5 + TypeScript**. There is no React layer in core. React (or any other framework) is only the prototype layer (`src/pages/`). The `useMode` React hook exists as an optional adapter so prototype pages can read mode state.

### Core Modes (always present)

| Mode | Label | Purpose |
|------|-------|---------|
| `prototype` | Navigate | Default browsing/interaction mode |
| `inspect` | Develop | Code inspection, overrides, debugging |
| `present` | Collaborate | Presentation, comments, sharing |
| `plan` | Canvas | Spatial layout, planning |

These are registered internally by core init. Modes are **not extensible by plugins** — the 4 core modes are fixed. Plugins register tools into existing modes, they don't create new modes.

---

## Architecture

```
packages/core/src/
  ├── modes.js                          ← mode registry, URL param, event bus, tool registry
  └── svelte-plugin-ui/
      ├── mount.ts                      ← generic mountSveltePlugin(target, Component, props)
      ├── stores/modeStore.ts           ← Svelte store wrapping modes.js
      ├── stores/toolStore.ts           ← Svelte store for current mode's tools
      ├── components/ModeSwitch.svelte  ← segmented mode toggle (fixed bottom-center)
      ├── components/ToolbarShell.svelte ← right-side toolbar (reads from tool registry)
      ├── plugins/design-modes.ts       ← mountDesignModesUI() entry point
      └── styles/base.css               ← Tachyons + sb-* CSS custom properties

packages/react/src/
  └── hooks/useMode.js                  ← optional React adapter (reads from modes.js)
```

### Core Modes API (`modes.js`)

```js
// Registry
registerMode(name, { label, icon?, className?, onActivate?, onDeactivate? })
unregisterMode(name)
getRegisteredModes()        // returns [{ name, label, icon, ... }]

// Switching
activateMode(name, options?)
deactivateMode()            // returns to 'prototype'
getCurrentMode()            // reads ?mode= param

// Reactivity
subscribeToMode(callback)
getModeSnapshot()           // for useSyncExternalStore / Svelte stores

// Event bus (cross-plugin communication)
on(event, callback)
off(event, callback)
emit(event, ...args)

// Events emitted by core:
//   'mode:change'     (from, to)
//   'mode:activate'   (name, options)
//   'mode:deactivate' (name)
```

### Tool Registration API

Plugins register tools into modes. The toolbar renders tools for the active mode.

```ts
// Register a tool for a specific mode
registerModeTool('present', {
  id: 'comments-toggle',
  label: 'Comments',
  icon: '💬',
  group: 'tools',
  order: 10,
  active: () => isCommentModeActive(),
  enabled: () => isAuthenticated(),
  badge: () => unreadCount(),
  action: () => toggleCommentMode(),
})

// Register for multiple modes
registerModeTool(['inspect', 'present'], { ... })

// Register for ALL modes
registerModeTool('*', { ... })

// Remove a tool
unregisterModeTool('comments-toggle')

// Query
getToolsForMode(modeName)   // returns merged mode + '*' tools, sorted
subscribeToTools(callback)  // notifies on tool add/remove
```

### ModeTool interface

```ts
interface ModeTool {
  id: string
  label: string
  icon?: string
  group: 'tools' | 'dev'
  order?: number                         // default 100
  active?: () => boolean                 // reactive — re-evaluated on render
  enabled?: () => boolean                // reactive — controls disabled state
  badge?: () => string | number | null   // e.g. unread comment count
  action: () => void
}
```

### State management

| State | Storage | Key |
|-------|---------|-----|
| Active mode | URL search param | `?mode=prototype\|present\|plan\|inspect` |
| Mode-specific state | URL hash / localStorage | Per-plugin decision |
| Tool registry | In-memory | `_modeTools` Map in modes.js |
| HTML body classes | DOM | `storyboard-mode-{name}` on `<html>` |

### Plugin → Mode interaction

Plugins interact with modes through:

1. **Tool registration** — `registerModeTool()` adds tools to the toolbar
2. **Event bus** — `on('mode:change', ...)` to react to mode switches
3. **Mode query** — `getCurrentMode()` to check which mode is active

Plugins do NOT create their own toolbars, register new modes, or override mode behavior.

### Init flow

```
1. Core init (automatic)
   └─ registerMode() × 4 core modes
   └─ syncModeClasses()
   └─ mountDesignModesUI()  → ModeSwitch + Toolbar

2. Plugin init (each plugin, in any order)
   └─ Comments: registerModeTool('present', { id: 'comments-toggle', ... })
   └─ Workshop: registerModeTool('inspect', { id: 'open-workshop', ... })
   └─ DevTools: registerModeTool('*', { id: 'scene-info', ... })

3. Toolbar renders
   └─ Reads tools for current mode + '*' wildcard
   └─ Sorts by group, then order
   └─ Renders buttons with reactive active/enabled/badge
```

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    Page Content                         │
│                                                         │
│                                              ┌────────┐ │
│                                              │ Tools  │ │
│                                              │        │ │
│                                              ├────────┤ │
│                                              │ Dev    │ │
│                                              │        │ │
│                                              └────────┘ │
│                                                         │
│         ┌──────────────────────────────────────┐        │
│         │ Navigate · Develop · Collaborate · Canvas │   │
│         └──────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## Todos

### 1. Tool registry in modes.js
Add `registerModeTool()`, `unregisterModeTool()`, `getToolsForMode()`, `subscribeToTools()` to `modes.js`. Internal `_modeTools` Map. Support single mode, array of modes, or `'*'` wildcard. Idempotent (same `id` overwrites). Tests.

### 2. Core mode auto-registration
Move the 4 `registerMode()` calls from `_app.jsx` into `initModes()` in `modes.js`. Called at startup. `_app.jsx` just calls `initModes()`.

### 3. Svelte tool store
Create `toolStore.ts` — readable Svelte store providing `{ tools, devTools }` for the current mode. Subscribes to both mode changes and tool registry changes.

### 4. Redesign Toolbar + migrate devtools panel
Rewrite `ToolbarShell.svelte` to read from the tool store. Render tool buttons with icon, label, active/disabled state, badge. Group into `tools` and `dev` sections.

Break the existing devtools panel (`devtools.js`) into individual tool registrations. Each becomes a `registerModeTool('*', ...)` call with `group: 'dev'`:

| Current devtools option | Tool id | Reactive state |
|------------------------|---------|---------------|
| Viewfinder | `viewfinder` | — |
| Show scene info | `scene-info` | Opens overlay panel |
| Reset all params | `reset-params` | — |
| Hide/Show mode | `hide-mode` | `active()` toggles label (Hide ↔ Show) |
| Feature flags | `feature-flags` | `enabled()` only if flags exist; opens panel |
| Comments items | `comments-*` | Dynamic, injected by comments plugin separately |

All except comments register into `'*'` (all modes) as `group: 'dev'`. Comments stays as a plugin-owned registration into `'present'` mode. This replaces the monolithic devtools beaker menu with the toolbar's dev section.

### 5. Update _app.jsx
Simplify to `initModes()` + `mountDesignModesUI()`. Mode registration is internal. Core dev tools register as part of init. Plugin tool registration happens in each plugin's init.

### 6. Active plugins panel (stretch)
Define data shape for showing active plugins + their tools. Defer UI.

---

## Notes

- **Tool registration is idempotent.** Calling `registerModeTool()` with the same `id` overwrites. Safe for HMR.
- **`active()` / `enabled()` / `badge()` are reactive.** The toolbar re-evaluates them each render cycle. They should be cheap.
- **The event bus (`on`/`off`/`emit`) remains the cross-plugin channel.** Tool registration is a higher-level API built on top.
- **The svelte-plugin-ui framework is generic.** Any plugin can use it for custom UI (panels, overlays). The toolbar itself is core-owned — plugins feed tools into it.

## Future: Roles, Environments, Tool States

Not in scope now, but the architecture should accommodate:

- **User roles** (presenter, participant, developer, designer) — tools and modes could be enabled/disabled per role. A `role` dimension on `registerModeTool()` or a separate role-gating layer.
- **Environments** (local dev vs. production deploy) — some tools/modes only available locally, others also in production. An `env` dimension or config flag.
- **Tool states** — tools and modes could be enabled/disabled per arbitrary states set by plugins or the application. It might be that tools can be marked as busy or in-use by one plugin and not be available by another -- plugins would have to wait for availability.
