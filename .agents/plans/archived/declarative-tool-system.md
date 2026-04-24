# Plan: Declarative Tool System for Storyboard Toolbar

## Problem

The toolbar system (`CoreUIBar.svelte`) is a mix of config-driven menus and hardcoded rendering logic. Each "tool" type (create, comments, theme, inspector, docs, devtools, feature-flags, flows) has its own bespoke wiring:

- **Hardcoded rendering branches** in the Svelte template (`{:else if menu.key === 'create'}`, `{:else if menu.key === 'comments'}`, etc.)
- **Hardcoded component loading** in `onMount` — each tool has its own try/catch import block
- **Hardcoded handler registration** — devtools and feature-flags register children inline
- **No concept of toolbar placement** — everything is implicitly right-side; the canvas toolbar is a separate hardcoded block
- **Some tools treated as second-class** — devtools and feature-flags are registered imperatively as command menu submenus, not declared alongside button tools

## Goal

Every tool is **100% declarative** — defined in `toolbar.config.json` (or overrides in `storyboard.config.json`) with a standard shape. Code is only a nugget of execution. Tools declare:

1. **What they are** — id, label, icon, type
2. **Where they render** — `toolbar: "main-toolbar"` (right), `toolbar: "secondary-toolbar"` (left), or `toolbar: "command-list"` (inside the command menu)
3. **How they render** — `render: "button"`, `render: "sidepanel"`, `render: "menu"`, `render: "submenu"`
4. **Their actions/children** — inline or via registered handlers
5. **Visibility rules** — modes, routes, localOnly, environment gates

All tools are equal regardless of their toolbar target. A tool targeting `command-list` is the same kind of tool as one targeting `main-toolbar` — just rendered in a different location. In the future, users can move tools between toolbars by changing the `toolbar` value.

---

## Current State Analysis

### What exists today

| Tool | Config entry | Rendering | Button component | Handler registration |
|------|-------------|-----------|-----------------|---------------------|
| Command menu | `menus.command` | Hardcoded as `CommandMenu` | `CommandMenu.svelte` | `initCommandActions()` |
| Create | `menus.create` | `menu.key === 'create'` branch | `CreateMenuButton.svelte` | Workshop feature registry |
| Flows | `menus.flows` | `menu.action` branch | `ActionMenuButton.svelte` | `registerCommandAction('core/flows')` |
| Comments | `menus.comments` | `menu.key === 'comments'` branch | `CommentsMenuButton.svelte` | Inline `isCommentsEnabled()` |
| Docs | `menus.docs` | `menu.sidepanel` branch | `TriggerButton` (generic) | `togglePanel('docs')` |
| Theme | `menus.theme` | `menu.key === 'theme'` branch | `ThemeMenuButton.svelte` | None (self-contained) |
| Inspector | `menus.inspector` | `menu.sidepanel` branch | `TriggerButton` (generic) | `togglePanel('inspector')` |
| Devtools | `menus.command.actions` | Command menu submenu only | None | Inline `getChildren()` in onMount |
| Feature Flags | `menus.command.actions` | Command menu submenu only | None | Inline `getChildren()` in onMount |
| Canvas toolbar | `canvasToolbar` | Hardcoded left-side block | `CanvasCreateMenu.svelte` | Event-based |

### What's hardcoded that shouldn't be

1. **Component imports in `onMount`** — 8 separate try/catch blocks, each for a specific tool
2. **Template branches** — `{:else if menu.key === 'create'}`, `{:else if menu.key === 'comments'}`, etc.
3. **Handler registration** — devtools/feature-flags children are built inline in `onMount`
4. **Canvas toolbar** — entirely separate rendering path
5. **Keyboard shortcuts** — `Cmd+D` for docs, `Cmd+I` for inspector are hardcoded

---

## Proposed Architecture

### 1. Unified Tool Definition

Each tool is a **tool module** that exports a standard interface:

```js
// tools/create.js
export default {
  id: 'create',
  component: () => import('./CreateMenuButton.svelte'),
  handler: null,
  setup: async (ctx) => { /* load features, etc. */ },
  guard: async (ctx) => { /* e.g., check if features exist */ return true },
}
```

### 2. Toolbar Targets

Three rendering targets, all equal:

| Target | Location | Description |
|--------|----------|-------------|
| `main-toolbar` | Bottom-right bar | Primary toolbar buttons |
| `secondary-toolbar` | Bottom-left bar | Canvas and contextual tools |
| `command-list` | Inside command menu | Rendered as menu entries/submenus |

A tool's `toolbar` value simply determines where it appears. Any tool can be moved between targets by changing this value — no code changes needed.

### 3. New Config Shape

```jsonc
// toolbar.config.json
{
  "tools": {
    "create": {
      "label": "Create",
      "icon": "iconoir/plus-circle",
      "meta": { "strokeWeight": 2, "scale": 1.1 },
      "render": "menu",
      "toolbar": "main-toolbar",
      "modes": ["*"],
      "localOnly": true,
      "menuWidth": "260px",
      "actions": [
        { "type": "header", "label": "Create" },
        { "id": "workshop/create-prototype", "label": "New prototype", "feature": "createPrototype" },
        { "id": "workshop/create-flow", "label": "New flow", "feature": "createFlow" },
        { "id": "workshop/create-canvas", "label": "New canvas", "feature": "createCanvas" },
        { "type": "footer", "label": "Only available in dev environment" }
      ]
    },
    "devtools": {
      "label": "Devtools",
      "icon": "primer/tools",
      "render": "submenu",
      "toolbar": "command-list",
      "modes": ["*"],
      "handler": "core/devtools"
    },
    "feature-flags": {
      "label": "Feature Flags",
      "icon": "primer/flag",
      "render": "submenu",
      "toolbar": "command-list",
      "modes": ["*"],
      "handler": "core/feature-flags"
    },
    "flows": {
      "label": "Flows",
      "icon": "feather/fast-forward",
      "render": "menu",
      "toolbar": "main-toolbar",
      "modes": ["*"],
      "menuWidth": "260px",
      "handler": "core/flows"
    },
    "theme": {
      "label": "Theme",
      "icon": "primer/sun",
      "meta": { "strokeWeight": 2 },
      "render": "menu",
      "toolbar": "main-toolbar",
      "modes": ["*"],
      "menuWidth": "220px"
    },
    "comments": {
      "label": "Comments",
      "icon": "primer/comment",
      "render": "button",
      "toolbar": "main-toolbar",
      "modes": ["*"],
      "excludeRoutes": ["^/$", "/viewfinder"]
    },
    "docs": {
      "label": "Documentation",
      "icon": "primer/book",
      "render": "sidepanel",
      "toolbar": "main-toolbar",
      "sidepanel": "docs",
      "modes": ["*"],
      "shortcut": { "key": "d", "label": "⌘D" }
    },
    "inspector": {
      "label": "Inspect",
      "icon": "iconoir/square-dashed",
      "render": "sidepanel",
      "toolbar": "main-toolbar",
      "sidepanel": "inspector",
      "modes": ["*"],
      "excludeRoutes": ["^/$", "/viewfinder", "/canvas/"],
      "meta": { "strokeWeight": 2, "scale": 1.1 },
      "shortcut": { "key": "i", "label": "⌘I" }
    },
    "viewfinder": {
      "label": "Index page",
      "icon": "primer/home",
      "render": "link",
      "toolbar": "command-list",
      "modes": ["*"],
      "url": "/"
    },
    "repository": {
      "label": "Go to repository",
      "icon": "primer/mark-github",
      "render": "link",
      "toolbar": "command-list",
      "modes": ["*"],
      "url": "https://github.com/dfosco/storyboard"
    }
  },
  "command": {
    "icon": "iconoir/key-command",
    "meta": { "strokeWeight": 2 },
    "shortcut": { "key": "k", "label": "⌘K" }
  },
  "modes": [
    { "name": "prototype", "label": "Prototype", "hue": "#2a2a2a" },
    { "name": "inspect", "label": "Inspect", "hue": "#2a2a2a" },
    { "name": "present", "label": "Collaborate", "hue": "#2a9d8f" }
  ]
}
```

### 4. Tool Registry (`toolRegistry.js`)

New framework-agnostic module that:
- Holds the tool definitions (from config + code modules)
- Resolves which tools are visible for a given toolbar/mode/route
- Provides reactive subscriptions for the UI

```js
// Core API
initToolRegistry(config)                        // seed from toolbar.config.json
registerToolModule(id, moduleExports)            // register code module
getToolsForToolbar('main-toolbar', mode)         // → visible tools for right toolbar
getToolsForToolbar('secondary-toolbar', mode)    // → visible tools for left toolbar  
getToolsForToolbar('command-list', mode)          // → tools for command menu
subscribeToToolRegistry(callback)                 // reactive
```

### 5. Tool Module Registry (`tools/registry.js`)

Maps tool IDs to their code modules (component + handler + setup):

```js
export const toolModules = {
  create:           () => import('./tools/create.js'),
  theme:            () => import('./tools/theme.js'),
  comments:         () => import('./tools/comments.js'),
  flows:            () => import('./tools/flows.js'),
  docs:             () => import('./tools/docs.js'),
  inspector:        () => import('./tools/inspector.js'),
  devtools:         () => import('./tools/devtools.js'),
  'feature-flags':  () => import('./tools/featureFlags.js'),
}
```

### 6. Simplified CoreUIBar

The template becomes a single generic loop per toolbar:

```svelte
<!-- Main toolbar (right side) -->
{#each mainTools as tool (tool.id)}
  <ToolButton {tool} />
{/each}

<!-- Secondary toolbar (left side) -->
{#each secondaryTools as tool (tool.id)}
  <ToolButton {tool} />
{/each}
```

`ToolButton.svelte` handles all render types:
- `render: "button"` → `TriggerButton` with icon
- `render: "menu"` → loads the tool's component (dropdown menu)
- `render: "sidepanel"` → `TriggerButton` that toggles a side panel
- `render: "submenu"` → rendered inside command menu, not on toolbar bar

---

## Implementation Phases

### Phase 1: Tool Config Schema
- Define the new `tools` shape in `toolbar.config.json`
- Migrate all current `menus.*` entries to `tools.*` with explicit `render` and `toolbar` fields
- Promote devtools, feature-flags, viewfinder, and repository from command menu actions to top-level tools with `toolbar: "command-list"`
- Maintain backward compat: if `menus` key exists and `tools` doesn't, use old behavior

### Phase 2: Tool Registry Module
- Create `src/toolRegistry.js` — config-driven tool state management
- `initToolRegistry(config)` seeds from config
- `registerToolModule(id, { component, handler, setup, guard })` registers code
- `getToolsForToolbar(toolbar, mode)` resolves visible tools for any target
- Reactive subscription API matching existing patterns

### Phase 3: Tool Module Extraction
- Extract each hardcoded tool into its own module under `src/tools/`:
  - `create.js` — workshop feature loading + CreateMenuButton
  - `theme.js` — ThemeMenuButton
  - `comments.js` — comments enabled check + CommentsMenuButton
  - `flows.js` — flow switcher handler
  - `docs.js` — sidepanel toggle
  - `inspector.js` — sidepanel toggle + auto-open from URL
  - `devtools.js` — submenu children builder
  - `featureFlags.js` — submenu children builder
- Each exports: `{ component?, handler?, setup?, guard? }`
- Create `src/tools/registry.js` mapping IDs to lazy imports

### Phase 4: CoreUIBar Refactor
- Replace hardcoded template branches with generic `ToolButton.svelte`
- Replace hardcoded `onMount` imports with tool registry loop
- Move keyboard shortcuts to config (`shortcut` field on tools)
- Unify main-toolbar and secondary-toolbar rendering into the same loop pattern
- `CoreUIBar.svelte` becomes ~200 lines instead of ~600

### Phase 5: Command Menu Integration
- Command menu reads `command-list` tools from the registry
- All tools are equal — `command-list` tools render as entries/submenus
- `main-toolbar` and `secondary-toolbar` tools also appear in command menu (searchable)
- Future: user can move tools between any toolbar target by changing config

---

## Migration Strategy

- **Phase 1 is backward-compatible** — old `menus` key still works
- **Phase 2–4 are internal refactors** — no config API changes
- **Phase 5 unifies command menu** — command actions become tools

Deprecation path:
1. Support both `menus` and `tools` keys during transition
2. Log a console warning if `menus` is used without `tools`
3. Remove `menus` support in a future major version

---

## Files to Create/Modify

### New files
- `packages/core/src/toolRegistry.js` — tool state management
- `packages/core/src/tools/registry.js` — lazy import map
- `packages/core/src/tools/create.js`
- `packages/core/src/tools/theme.js`
- `packages/core/src/tools/comments.js`
- `packages/core/src/tools/flows.js`
- `packages/core/src/tools/docs.js`
- `packages/core/src/tools/inspector.js`
- `packages/core/src/tools/devtools.js`
- `packages/core/src/tools/featureFlags.js`
- `packages/core/src/ToolButton.svelte` — generic tool renderer

### Modified files
- `packages/core/toolbar.config.json` — new `tools` schema
- `packages/core/src/CoreUIBar.svelte` — simplified to use tool registry
- `packages/core/src/commandActions.js` — integrate with tool registry
- `packages/core/src/mountStoryboardCore.js` — initialize tool registry
- `packages/core/vite.ui.config.js` — externalize `toolRegistry.js`
- `packages/core/src/ui-entry.js` — re-export tool registry init
- `packages/core/package.json` — export tool registry if needed

### Unchanged (still work as-is)
- All existing `*MenuButton.svelte` components — just loaded by tool modules instead of CoreUIBar
- `SidePanel.svelte`, `CommandMenu.svelte` — still render the same, just sourced differently
- Workshop feature registry — still used by the create tool module
