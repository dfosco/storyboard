# Design Modes as Core Infrastructure + Plugin Tool Registration

## Problem

Design modes are currently treated as an optional registration at the app level (`_app.jsx` calls `registerMode()` 4 times). But modes are not a plugin — they are a **core feature** of Storyboard, in the same way that workspaces will be. Modes define the different ways storyboard's tooling is made available to users.

Meanwhile, plugins (comments, workshop, devtools, future ones) each bring their own tools that should appear in the toolbar **when a particular mode is active**. Today, tools are passed as static arrays in `registerMode()` config, which means the app layer has to know about every plugin's tools up front. There's no way for a plugin to self-register its tools into a mode.

### What we want

1. **Modes are core** — they exist and mount automatically, not at the app's discretion.
2. **Plugins register tools into modes** — a plugin can say "when the user is in Collaborate mode, show my Comment tool in the toolbar."
3. **The toolbar is a well-defined Svelte component** that renders tools registered for the current mode, built on the svelte-plugin-ui framework.
4. **Plugins can also build with the svelte-plugin-ui framework** but the toolbar itself is owned by core.

---

## Architecture

### Core Modes (always present)

| Mode | Label | Purpose |
|------|-------|---------|
| `prototype` | Navigate | Default browsing/interaction mode |
| `inspect` | Develop | Code inspection, overrides, debugging |
| `present` | Collaborate | Presentation, comments, sharing |
| `plan` | Canvas | Spatial layout, planning |

These are registered internally by the core init — the app doesn't need to call `registerMode()` manually.

### Mode lifecycle

```
init() at startup
  → registers 4 core modes
  → syncModeClasses()
  → mounts ModeSwitch + Toolbar via svelte-plugin-ui

URL ?mode=inspect
  → activateMode('inspect')
  → onDeactivate callback on previous mode
  → onActivate callback on new mode
  → emit('mode:change', prev, next)
  → toolbar re-renders with tools for 'inspect'
```

### Tool Registration API

```ts
// A plugin registers a tool for a specific mode
registerModeTool('present', {
  id: 'comments-toggle',
  label: 'Comments',
  icon: '💬',               // Octicon name or emoji
  group: 'tools',            // 'tools' (primary) | 'dev' (secondary)
  order: 10,                 // Sort order within group
  active: () => isCommentModeActive(),  // Optional: is this tool "on"?
  enabled: () => isAuthenticated(),     // Optional: grayed out if false
  action: () => toggleCommentMode(),    // Click handler
})

// A plugin can also register tools for multiple modes at once
registerModeTool(['inspect', 'present'], { ... })

// Or for ALL modes
registerModeTool('*', { ... })

// Remove a tool
unregisterModeTool('comments-toggle')
```

### Tool data structure

```ts
interface ModeTool {
  id: string
  label: string
  icon?: string
  group: 'tools' | 'dev'
  order?: number               // default 100
  active?: () => boolean       // reactive — re-evaluated on render
  enabled?: () => boolean      // reactive — controls disabled state
  badge?: () => string | number | null  // e.g. unread comment count
  action: () => void
}
```

### Where tools come from

| Source | Example tools | Modes |
|--------|--------------|-------|
| **Core** | Scene switcher, Override reset, Hide mode toggle | `*` (all modes) |
| **Comments plugin** | Toggle comments, Open drawer, Sign in | `present` |
| **Workshop plugin** | Create page, Open workshop | `inspect` |
| **DevTools** | Scene info, Feature flags | `*` or `inspect` |
| **Future plugins** | Multiplayer cursors, Export, etc. | Various |

### Internal state

```
_modeTools: Map<string, ModeTool[]>
  'prototype' → [tool1, tool2]
  'inspect'   → [tool3, tool4]
  'present'   → [tool5, tool6]
  '*'         → [tool7]  // shown in all modes
```

When the toolbar renders for mode X, it merges `_modeTools.get(X)` + `_modeTools.get('*')`, sorted by `group` then `order`.

### Toolbar Component (Svelte)

The toolbar is a **core-owned Svelte component** that:
- Reads tools for the current mode from the tool registry
- Groups them into `tools` (primary) and `dev` (secondary) sections
- Renders each tool as a button with icon, label, active/disabled state
- Re-evaluates `active()`, `enabled()`, `badge()` on each render cycle
- Supports keyboard navigation within the toolbar

```
┌──────────────┐
│   Tools      │
│ ┌──────────┐ │
│ │ 💬 Cmnts │ │  ← active (highlighted)
│ │ 📋 Drawer│ │
│ └──────────┘ │
│              │
│   Dev        │
│ ┌──────────┐ │
│ │ 🔍 Scene │ │
│ │ 🔄 Reset │ │
│ └──────────┘ │
└──────────────┘
```

### Plugin → Mode interaction

Plugins interact with modes through two patterns:

1. **Tool registration** — `registerModeTool()` adds tools to the toolbar
2. **Event bus** — `on('mode:change', ...)` to react to mode switches (e.g., comments auto-disables when leaving Collaborate mode)
3. **Mode query** — `getCurrentMode()` to check which mode is active

Plugins do NOT:
- Create their own toolbars (the core toolbar is the only toolbar)
- Register new modes (modes are core-defined)
- Override mode behavior

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

---

## Todos

### 1. Tool registry in modes.js
Add `registerModeTool()`, `unregisterModeTool()`, `getToolsForMode()` to `modes.js`. Add `_modeTools` internal state. Include `subscribeToTools()` for reactivity. Tests.

### 2. Core mode auto-registration
Move the 4 `registerMode()` calls from `_app.jsx` into a new `initModes()` function in `modes.js` (or a `modes-init.js`). Called automatically during storyboard init. `_app.jsx` just calls `initModes()` or it happens as a side effect of importing modes.

### 3. Svelte tool store
Create `toolStore.ts` in svelte-plugin-ui — a readable Svelte store that provides `{ tools: ModeTool[], devTools: ModeTool[] }` for the current mode. Subscribes to both mode changes and tool registry changes.

### 4. Redesign Toolbar component
Rewrite `ToolbarShell.svelte` to read from the tool store instead of static arrays from mode config. Render tool buttons with icon, label, active state, disabled state, badge. Group into `tools` and `dev` sections.

### 5. Core tool registration
Register built-in tools that ship with core: scene switcher (or scene info), override reset, hide mode toggle. These register into `'*'` (all modes) or specific modes.

### 6. Plugin tool registration examples
Update comments plugin to call `registerModeTool('present', ...)` instead of providing menu items through `getCommentsMenuItems()`. Update devtools to register its tools via the registry instead of building its own menu.

### 7. Remove static tools/devTools from registerMode config
The `tools` and `devTools` arrays in `registerMode()` config are superseded by the tool registry. Remove them and update all consumers.

### 8. Update _app.jsx
Simplify to just `initModes()` + `mountDesignModesUI()` (or even just one call). Mode registration is internal. Plugin tool registration happens in each plugin's init.

### 9. Active plugins panel (stretch)
A panel (accessible from the toolbar or a keyboard shortcut) that shows all active plugins, their registered tools, and plugin-specific options. This is a future enhancement — define the data shape now but defer the UI.

---

## Notes

- **Modes are NOT extensible by plugins.** The 4 core modes are fixed. Plugins register tools into existing modes, they don't create new modes. This keeps the UX consistent and predictable.
- **Tool registration is idempotent.** Calling `registerModeTool()` with the same `id` overwrites. This is safe for HMR.
- **The `active()` / `enabled()` / `badge()` callbacks are reactive.** The toolbar re-evaluates them. For Svelte, this means calling them in the template (they become reactive via `$derived` or store subscriptions). They should be cheap to evaluate.
- **The event bus (`on`/`off`/`emit`) remains the cross-plugin communication channel.** Tool registration is a higher-level API built on top.
- **The svelte-plugin-ui framework is generic.** It can be used by any plugin to build custom UI (overlays, modals, panels). But the toolbar is core-owned — plugins feed tools into it, they don't replace it.
