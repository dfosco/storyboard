# `packages/core/src/devtools.js`

<!--
source: packages/core/src/devtools.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Implements the Storyboard DevTools — a vanilla JS floating toolbar for development. Framework-agnostic: mounts itself directly to the DOM with no React/Vue dependency. Provides a beaker button (bottom-right corner) that opens a dropdown menu with actions: show flow info (overlay with resolved flow JSON), navigate to viewfinder, reset all hash params, toggle hide mode, and manage feature flags. Toggleable with `Cmd+.` / `Ctrl+.`. Also dynamically loads comments menu items when the comments system is enabled. Respects the plugin configuration — skips mounting when `devtools` is disabled via `storyboard.config.json`.

## Composition

**`mountDevTools(options?)`** — Mount the devtools to the DOM. Idempotent (safe to call multiple times). Accepts `{ container, basePath, plugins }` options. If `plugins` is passed, calls `initPlugins()` to avoid timing issues.

The function builds the entire DOM structure imperatively:
- Floating trigger button with beaker icon
- Dropdown menu with viewfinder, flow info, reset, and hide mode toggle buttons
- Feature flags panel (shown when flags are configured)
- Overlay panel for displaying resolved flow JSON
- Keyboard shortcut handler (`Cmd+.` / `Ctrl+.`)
- Dynamic comments menu items via lazy import

All CSS is defined as a template string constant (`STYLES`) and injected via a `<style>` element. SVG icons are inline strings to avoid external dependencies.

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — `loadFlow` for displaying flow data in the info panel
- [`packages/core/src/hideMode.js`](./hideMode.js.md) — `isHideMode`, `activateHideMode`, `deactivateHideMode` for hide mode toggle
- [`packages/core/src/featureFlags.js`](./featureFlags.js.md) — `getAllFlags`, `toggleFlag`, `getFlagKeys` for the feature flags panel
- [`packages/core/src/plugins.js`](./plugins.js.md) — `isPluginEnabled`, `initPlugins` for gating devtools mounting
- `packages/core/src/comments/config.js` — `isCommentsEnabled` for conditional comments menu

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `mountDevTools`
- [`src/index.jsx`](../../../src/index.jsx.md) — Calls `mountDevTools()` at app startup
