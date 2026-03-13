# `packages/core/src/modes.js`

<!--
source: packages/core/src/modes.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Design Modes — the mode registry, switching engine, cross-plugin event bus, and tool registry for the storyboard system. Framework-agnostic with zero npm dependencies. Modes are stored in the `?mode=` URL search param so they are shareable and bookmarkable. The default mode is `"prototype"`. This module also manages a tool registry seeded from `modes.config.json` that provides runtime tool state (enabled, active, busy, hidden, badge) and action callbacks for toolbar UIs.

The mode system is the backbone of the multi-mode storyboard experience — it allows plugins to register modes (e.g., "prototype", "present", "inspect"), switch between them with lifecycle hooks (`onActivate`/`onDeactivate`), apply CSS classes to `<html>`, and communicate via a lightweight event bus.

## Composition

### Mode Registry

**`registerMode(name, config)`** — Register a mode plugin with label, icon, className, and lifecycle hooks.

```js
export function registerMode(name, config = {}) {
  _modes.set(name, { name, label: config.label ?? name, ...config })
  _notify()
}
```

**`unregisterMode(name)`** — Remove a mode (cannot unregister the default "prototype" mode).

**`getRegisteredModes()`** — Returns all registered modes in insertion order.

### Mode Switching

**`getCurrentMode()`** — Reads `?mode=` from the URL, falls back to `"prototype"`.

**`activateMode(name, options)`** — Switches modes: deactivates previous (removes CSS classes, calls `onDeactivate`), updates URL param, activates new (applies CSS classes, calls `onActivate`), emits events.

**`deactivateMode()`** — Returns to the default "prototype" mode.

### Reactivity

**`subscribeToMode(callback)`** / **`getModeSnapshot()`** — Compatible with React's `useSyncExternalStore`. Also listens to `popstate` for browser back/forward sync.

### Event Bus

**`on(event, callback)`** / **`off(event, callback)`** / **`emit(event, ...args)`** — Lightweight cross-plugin event system. Errors in listeners are caught and logged, never propagated.

### Configuration

**`initModesConfig(config)`** — Initialize modes from storyboard.config.json. Controls whether modes UI is enabled.

**`isModesEnabled()`** — Returns whether the modes UI should be shown.

### Tool Registry

**`initTools(config)`** — Seeds tool declarations from `modes.config.json`. Tools are keyed by mode name or `*` (all modes).

```js
export function initTools(config = {}) {
  for (const [modeKey, tools] of Object.entries(config)) {
    for (const tool of tools) {
      _tools.set(tool.id, { id: tool.id, label, group, icon, order, modes: [modeKey] })
      _toolState.set(tool.id, { ...DEFAULT_TOOL_STATE })
    }
  }
}
```

**`setToolAction(id, action)`** — Wire up a click handler for a declared tool.

**`setToolState(id, state)`** — Partial state update (enabled, active, busy, hidden, badge).

**`getToolState(id)`** — Read current tool state.

**`getToolsForMode(modeName)`** — Returns tools for a mode (merged with `*` wildcard), sorted by group then order, with hidden tools excluded.

**`subscribeToTools(callback)`** / **`getToolsSnapshot()`** — Reactivity for tool state changes.

**`_resetModes()`** — Test-only helper that clears all internal state.

## Dependencies

No external dependencies. Pure JavaScript module.

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all mode and tool registry functions
- [`packages/core/src/modes.test.js`](./modes.test.js.md) — Test file
- [`packages/react/src/hooks/useMode.js`](../../react/src/hooks/useMode.js.md) — React hook wrapping mode functions
- `packages/core/src/ui/design-modes.ts` — Svelte UI for mode switching
- `packages/core/src/svelte-plugin-ui/stores/` — Svelte stores wrapping mode state

## Notes

- CSS classes are applied to `<html>` (not `<body>`): automatic `storyboard-mode-{name}` plus any custom `className` from the mode config.
- Tool state defaults: `{ enabled: true, active: false, busy: false, hidden: false, badge: null }`.
- The snapshot pattern (`getModeSnapshot`, `getToolsSnapshot`) returns serialized strings that change on any state mutation, triggering React re-renders via `useSyncExternalStore`.
