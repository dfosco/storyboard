# `packages/core/src/toolStateStore.js`

<!--
source: packages/core/src/toolStateStore.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Runtime state management for toolbar tools. Each tool declared in `toolbar.config.json` can be in one of five states: `active` (normal), `inactive` (disabled-looking), `hidden` (invisible but shortcuts work), `dimmed` (reduced opacity, still clickable), or `disabled` (completely removed). Tools default to `active` unless config declares otherwise or the tool is dev-only in a non-dev environment.

## Composition

**Constants:**
- `TOOL_STATES` — frozen enum: `{ ACTIVE, INACTIVE, HIDDEN, DIMMED, DISABLED }`

**Initialization:**
- `initToolbarToolStates(toolsConfig, options?)` — seeds states from config, applying dev-only/disabled rules

**Runtime:**
- `setToolbarToolState(id, state)` — change tool state at runtime (validates against `VALID_STATES`)
- `getToolbarToolState(id)` — returns current state (defaults to `'active'` for unknown IDs)
- `isToolbarToolLocalOnly(id)` — whether the tool is dev-only

**Reactivity:**
- `subscribeToToolbarToolStates(callback)` / `getToolbarToolStatesSnapshot()` — `useSyncExternalStore`-compatible

**Test helper:** `_resetToolbarToolStates()`

## Dependencies

None (framework-agnostic, zero npm dependencies).

## Dependents

- [`./paletteProviders.js`](./paletteProviders.js.md) — reads tool state to filter palette items
- `packages/core/src/CommandMenu.svelte` — reads tool states for menu rendering
- `packages/core/src/CoreUIBar.svelte` — reads tool states for toolbar rendering
- `packages/core/src/index.js` — re-exports
