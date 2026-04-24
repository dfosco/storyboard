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
  ├── modes.js                          ← mode registry, URL param, event bus, tool registry + state
  ├── ui/
  │   ├── design-modes.ts              ← mountDesignModesUI() entry point
  │   └── viewfinder.ts                ← mountViewfinder() entry point
  └── svelte-plugin-ui/
      ├── mount.ts                      ← generic mountSveltePlugin(target, Component, props)
      ├── stores/modeStore.ts           ← Svelte store wrapping modes.js (mode state)
      ├── stores/toolStore.ts           ← Svelte store wrapping tool registry (tools + state)
      ├── stores/types.ts               ← TypeScript interfaces + core re-exports
      ├── components/ModeSwitch.svelte  ← segmented mode toggle (fixed bottom-center)
      ├── components/ToolbarShell.svelte ← right-side toolbar (reads from toolStore)
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
### Tool State API

Tools are **declared** in `modes.config.json` — their identity is static.
Runtime only manages **state** (availability, actions, behavior).

```js
// Build-time (data plugin seeds from modes.config.json)
initTools({ '*': [...], 'present': [...] })

// Runtime — plugins wire up click handlers
setToolAction('viewfinder', () => openViewfinder())
setToolAction('comments-toggle', () => toggleCommentMode())

// Runtime — plugins control tool state
setToolState('comments-toggle', { enabled: true, active: false })
setToolState('viewfinder', { busy: true })      // in use, unavailable
setToolState('feature-flags', { hidden: true })  // no flags, hide entirely
setToolState('comments-toggle', { badge: 3 })    // notification badge

// Query
getToolsForMode('present')   // tools for 'present' + '*', with state & action
getToolState('viewfinder')   // { enabled, active, busy, hidden, badge }
subscribeToTools(callback)   // reactive — notifies on state/action changes
getToolsSnapshot()           // serialised string for useSyncExternalStore
```

### ModeTool interface

```ts
// Tool declaration (from modes.config.json)
interface ToolDeclaration {
  id: string
  label: string
  group: 'tools' | 'dev'
  icon?: string
  order?: number            // default 100, lower = first
}

// Tool state (managed at runtime by plugins)
interface ToolState {
  enabled: boolean           // can be interacted with (grayed out if false)
  active: boolean            // currently "on" (highlighted)
  busy: boolean              // in use by something (unavailable)
  hidden: boolean            // hidden from toolbar entirely
  badge: string|number|null  // notification badge
}

// Resolved tool (returned by getToolsForMode)
interface ResolvedTool extends ToolDeclaration {
  modes: string[]            // mode keys this tool is assigned to
  state: ToolState
  action: (() => void) | null
}
```

### State management

| State | Storage | Key |
|-------|---------|-----|
| Active mode | URL search param | `?mode=prototype\|present\|plan\|inspect` |
| Mode-specific state | URL hash / localStorage | Per-plugin decision |
| Tool declarations | In-memory (from config) | `_tools` Map in modes.js |
| Tool state | In-memory (runtime) | `_toolState` Map in modes.js |
| Tool actions | In-memory (runtime) | `_toolActions` Map in modes.js |
| HTML body classes | DOM | `storyboard-mode-{name}` on `<html>` |

### Plugin → Mode interaction

Plugins interact with modes through:

1. **Tool actions** — `setToolAction(id, fn)` wires up click handlers for declared tools
2. **Tool state** — `setToolState(id, state)` controls availability (enabled, active, busy, hidden, badge)
3. **Event bus** — `on('mode:change', ...)` to react to mode switches
4. **Mode query** — `getCurrentMode()` to check which mode is active

Plugins do NOT create their own toolbars, register new modes, or override mode behavior.

### Init flow

```
1. Core init (automatic, via data plugin + StoryboardProvider)
   └─ registerMode() × 4 core modes (from modes.config.json)
   └─ initTools() — seeds tool registry from modes.config.json
   └─ syncModeClasses()
   └─ mountDesignModesUI()  → ModeSwitch + Toolbar

2. Plugin init (each plugin, in any order)
   └─ Comments: setToolAction('comments-toggle', () => toggleCommentMode())
   │            setToolState('comments-toggle', { enabled: isAuthenticated })
   └─ Workshop: setToolAction('open-workshop', () => openWorkshop())
   └─ DevTools: setToolAction('viewfinder', () => openViewfinder())
   │            setToolAction('scene-info', () => showSceneInfo())
   │            setToolAction('reset-params', () => resetAllParams())

3. Toolbar renders
   └─ Reads getToolsForMode(currentMode) — declared tools + '*' wildcard
   └─ Sorts by group (tools → dev), then order
   └─ Renders buttons with state (enabled, active, busy, badge)
   └─ Tools without an action are disabled
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

### ✅ 1. Core mode auto-registration
~~Move the 4 `registerMode()` calls from `_app.jsx` into `initModes()` in `modes.js`.~~

**Done via data plugin approach:** The Vite data plugin reads `modes.config.json` and generates `registerMode()` calls in the virtual module at build time. No `initModes()` function needed — registration is declarative via config.

### ✅ 2. modes.config.json
Core mode definitions and tool declarations live in `packages/core/modes.config.json`. The data plugin reads this at build time. Tools section declares core dev tools per mode (or `*` for all modes).

### ✅ 3. Auto-mount design modes UI
StoryboardProvider mounts design modes UI automatically when `isModesEnabled()` is true. Consumer only needs `storyboard.config.json` — no manual imports or registration.

### ✅ 4. Simplify _app.jsx
All mode setup removed from consumer's `_app.jsx`. No mode-related imports, no `registerMode()` calls, no `mountDesignModesUI()`.

### ✅ 5. Tool registry + state API in modes.js
Tools are declared in `modes.config.json` and seeded at build time via `initTools()`. Runtime API manages state (`setToolState`), actions (`setToolAction`), and queries (`getToolsForMode`, `getToolState`, `subscribeToTools`, `getToolsSnapshot`). Tool states (enabled, active, busy, hidden, badge) are set imperatively by plugins. 22 tests. Exported from `@dfosco/storyboard-core`.

### ✅ 6. Svelte tool store
Created `toolStore.ts` — readable Svelte store providing `{ tools, devTools }` for the current mode. Subscribes to both mode changes and tool registry changes. Groups tools by `group` field.

### ✅ 7. Redesign Toolbar
Rewrote `ToolbarShell.svelte` to read from the tool store (not from mode config arrays). Renders tool buttons with state: disabled when `enabled: false` or `busy: true` or no action, highlighted when `active: true`, badge when present, hidden when `hidden: true`. Updated types.ts — removed old `ModeToolConfig`, added `ResolvedTool` and `ToolState` interfaces. 8 tests (up from 4).

### ✅ 8. Relocate mount entry points
Moved `plugins/design-modes.ts` and `plugins/viewfinder.ts` from `svelte-plugin-ui/plugins/` to `src/ui/`. New public paths: `@dfosco/storyboard-core/ui/design-modes` and `@dfosco/storyboard-core/ui/viewfinder`. Old `svelte-plugin-ui/` paths kept as aliases for backward compat.

### 🔲 9. Active plugins panel (stretch)
Define data shape for showing active plugins + their tools. Defer UI.

---

## Notes

- **Tool declarations are static.** They come from `modes.config.json` and are seeded once via `initTools()`. Plugins don't create tools — they hydrate them with actions and state.
- **Tool state is imperative.** Plugins call `setToolState()` to change availability. No reactive functions — explicit state updates are simpler and more predictable.
- **`setToolAction()` / `setToolState()` are idempotent.** Safe for HMR — calling again overwrites.
- **Tools without an action are inert.** `getToolsForMode()` returns them with `action: null` — the toolbar can render them as disabled.
- **The event bus (`on`/`off`/`emit`) remains the cross-plugin channel.** Tool state is a higher-level API built on top.
- **The svelte-plugin-ui framework is generic.** Any plugin can use it for custom UI (panels, overlays). The toolbar itself is core-owned — plugins feed state into declared tools.

## Future: Roles, Environments

Not in scope now, but the architecture should accommodate:

- **User roles** (presenter, participant, developer, designer) — tools and modes could be enabled/disabled per role. A `role` dimension on `setToolState()` or a separate role-gating layer.
- **Environments** (local dev vs. production deploy) — some tools/modes only available locally, others also in production. An `env` dimension or config flag.
