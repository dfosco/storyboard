# `packages/core/src/modes.js`

<!--
source: packages/core/src/modes.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Design Modes — the central mode registry, switching engine, and cross-plugin event bus for the storyboard system. Modes (e.g., `prototype`, `present`, `canvas`) determine which tools are visible, which CSS classes are applied to `<html>`, and which plugin lifecycle hooks fire. The active mode is stored in the `?mode=` URL search param for shareability and bookmarkability. Also manages an inline tool registry for mode-specific toolbar tools.

## Composition

**Mode registry:**
- `registerMode(name, config)` / `unregisterMode(name)` — register/remove mode plugins
- `getRegisteredModes()` — list all modes

**Switching:**
- `getCurrentMode()` — reads `?mode=` param (falls back to `'prototype'`)
- `activateMode(name, options)` — switch modes with lifecycle callbacks
- `deactivateMode()` — return to default mode

**Reactivity:**
- `subscribeToMode(callback)` / `getModeSnapshot()` — `useSyncExternalStore`-compatible

**Event bus:**
- `on(event, callback)` / `off(event, callback)` / `emit(event, ...args)` — cross-plugin communication

**Configuration:**
- `initModesConfig({ enabled, locked })` — set whether modes UI is enabled/locked
- `isModesEnabled()` / `getLockedMode()` / `isModeSwitcherVisible()`

**Tool registry (legacy, inline):**
- `initTools(config)` / `setToolAction(id, action)` / `setToolState(id, state)` / `getToolState(id)`
- `getToolsForMode(modeName)` / `subscribeToTools(callback)` / `getToolsSnapshot()`
- `syncModeClasses()` — applies CSS classes for initial mode on first load

**Test helper:** `_resetModes()`

## Dependencies

None (framework-agnostic, zero npm dependencies).

## Dependents

- `packages/react/src/hooks/useMode.js` — React hook for current mode
- `packages/react/src/context.jsx` — mode context integration
- `packages/react/src/vite/data-plugin.js` — seeds mode config
- `packages/core/src/svelte-plugin-ui/components/ModeSwitch.svelte`, `ToolbarShell.svelte` — Svelte UI
- `packages/core/src/ui/design-modes.ts` — Svelte mount for design modes UI
- `packages/core/src/configSchema.js` — validates mode config

## Notes

- When `_lockedMode` is set, `activateMode()` becomes a no-op and the mode switcher is hidden.
- Mode classes follow the pattern `storyboard-mode-{name}` plus any custom `className` from config.
- The inline tool registry (`initTools`, `setToolAction`, etc.) manages tools declared per-mode in `modes.config.json`.
