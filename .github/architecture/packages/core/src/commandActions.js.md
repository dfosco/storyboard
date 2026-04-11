# `packages/core/src/commandActions.js`

<!--
source: packages/core/src/commandActions.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Config-driven registry for command menu entries in the storyboard toolbar. The command section of `toolbar.config.json` declares action metadata (id, label, type, modes, excludeRoutes), and plugins wire up handlers at runtime. Supports three handler shapes: default (`() => void`), toggle (`{ execute(), getState() }`), and submenu (`{ getChildren() }`). Also supports dynamic actions that are registered at runtime and inserted before the footer in the menu.

The module provides mode-aware filtering (actions declare which modes they appear in via a `modes` array), route-based exclusion (via `excludeRoutes` regex patterns matched against the app-relative pathname), and a reactive subscription system compatible with React's `useSyncExternalStore`.

## Composition

### Initialization

**`initCommandActions(config)`** — Seeds the registry from a menu config object (typically from `toolbar.config.json`). Called once at app startup.

```js
export function initCommandActions(config) {
  _config = { ...config }
  _notify()
}
```

### Handler Registration

**`registerCommandAction(id, handler)`** — Register a handler for a declared action. Handler can be a plain function, a toggle object with `execute()`/`getState()`, or a submenu object with `getChildren()`.

**`unregisterCommandAction(id)`** — Remove a previously registered handler.

### Dynamic Actions

**`setDynamicActions(group, actions, handlers?)`** — Add runtime actions (e.g., comments menu items) grouped by a key for bulk replacement. Previous entries for the group are removed first.

```js
export function setDynamicActions(group, actions, handlers = {}) {
  _dynamicActions = _dynamicActions.filter(a => a._group !== group)
  for (const action of actions) {
    _dynamicActions.push({ ...action, type: action.type || 'default', _group: group })
  }
  for (const [id, handler] of Object.entries(handlers)) {
    _handlers.set(id, handler)
  }
  _notify()
}
```

**`clearDynamicActions(group)`** — Remove all dynamic actions and their handlers for a group.

### Resolution

**`setRoutingBasePath(basePath)`** — Sets the base path used for route exclusion matching (strips the base so patterns match app-relative paths).

**`isExcludedByRoute(item)`** — Checks if an item's `excludeRoutes` regex patterns match the current pathname (after stripping the base path).

**`getActionsForMode(mode)`** — Returns resolved actions for the current mode. Filters config actions by mode visibility and route exclusion, inserts dynamic actions before the footer, and attaches handler references and toggle state.

**`executeAction(id)`** — Executes an action by id — calls the handler function or its `execute()` method.

**`getActionChildren(id)`** — Returns submenu children from a submenu-type handler's `getChildren()`.

**`hasChildrenProvider(id)`** — Checks if a handler has `getChildren`, used by [`CoreUIBar.svelte`](./CoreUIBar.svelte.md) to distinguish action-menu tools from custom-component menus.

### Reactivity

**`subscribeToCommandActions(callback)`** / **`getCommandActionsSnapshot()`** — Compatible with `useSyncExternalStore`. Snapshot is an incrementing version number.

**`_resetCommandActions()`** — Test-only helper that clears all internal state.

## Dependencies

No external dependencies. Pure JavaScript module.

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public functions
- `packages/core/src/CoreUIBar.svelte` — Imports action resolution and execution for the command menu UI
- `packages/core/src/CommandMenu.svelte` — Imports `getActionsForMode`, `executeAction`, `getActionChildren`
- `packages/core/src/ActionMenuButton.svelte` — Imports command action functions for action menu buttons

## Notes

- Dynamic actions are inserted before the `footer`-type action in the config, so the footer always stays at the bottom of the menu.
- Route exclusion uses `RegExp` matching, so patterns like `"^/$"` (root only) or `"^/Signup"` work.
- The `localOnly` flag on actions indicates they should only appear in local development (not branch deploys).
