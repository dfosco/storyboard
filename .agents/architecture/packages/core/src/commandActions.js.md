# `packages/core/src/commandActions.js`

<!--
source: packages/core/src/commandActions.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Config-driven registry for command menu entries. Actions are declared in `toolbar.config.json` and their handlers are registered at runtime. Supports three handler types: `default` (simple callback), `toggle` (with `getState()`), and `submenu` (with `getChildren()`). Also supports dynamic runtime actions (e.g., comments menu items) and route-based exclusion filtering.

The registry is reactive — subscribers are notified on any change, making it compatible with `useSyncExternalStore`.

## Composition

```js
// Initialization
export function initCommandActions(config)                    // Seed from toolbar config

// Handler registration
export function registerCommandAction(id, handler)            // Register handler for action id
export function unregisterCommandAction(id)                   // Remove handler

// Dynamic actions (runtime-added, grouped for bulk ops)
export function setDynamicActions(group, actions, handlers)   // Add/replace dynamic actions
export function clearDynamicActions(group)                    // Remove group

// Resolution
export function setRoutingBasePath(basePath)                  // Set base path for route matching
export function isExcludedByRoute(item)                       // Check excludeRoutes patterns
export function getActionsForMode(mode)                       // Get resolved actions for a mode
export function executeAction(id)                             // Execute handler by id
export function getActionChildren(id)                         // Get submenu children
export function hasChildrenProvider(id)                       // Check for getChildren on handler

// Reactivity
export function subscribeToCommandActions(callback)           // Subscribe (useSyncExternalStore)
export function getCommandActionsSnapshot()                   // Snapshot version string
```

## Dependencies

None (zero npm dependencies). Uses `window.location.pathname` for route matching.

## Dependents

- [`index.js`](./index.js.md) — re-exports all public APIs
- `CoreUIBar.svelte`, `CommandMenu.svelte`, `ActionMenuButton.svelte`, `CreateMenuButton.svelte` — Svelte UI components
- `paletteProviders.js` — command palette integration

## Notes

- `getActionsForMode` filters config actions by `modes` array and `excludeRoutes`, then inserts dynamic actions before any `footer`-type action.
- Route exclusion strips `_basePath` before testing regex patterns, so patterns match against app-relative paths.
