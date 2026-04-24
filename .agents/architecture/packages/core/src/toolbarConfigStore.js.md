# `packages/core/src/toolbarConfigStore.js`

<!--
source: packages/core/src/toolbarConfigStore.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Reactive toolbar configuration store with layered overrides. Manages the merged toolbar config through three priority layers: core defaults (`toolbar.config.json`) → client-repo overrides → prototype-level overrides. The merged result drives which tools, menus, and buttons appear in the CoreUIBar. Framework-agnostic with `useSyncExternalStore`-compatible reactivity.

## Composition

**Initialization:**
- `initToolbarConfig(config)` — sets the base config (core + client), called once at startup
- `setClientToolbarOverrides(config)` — stores client overrides (called from Vite virtual module at import time)
- `consumeClientToolbarOverrides()` — returns and clears pending client overrides (called once by `mountStoryboardCore`)

**Prototype overrides:**
- `setPrototypeToolbarConfig(config)` — sets prototype-level overrides on route change
- `clearPrototypeToolbarConfig()` — clears on navigating away

**Access:**
- `getToolbarConfig()` — returns the current merged config

**Reactivity:**
- `subscribeToToolbarConfig(callback)` — subscribe (Svelte store compatible, calls immediately)
- `getToolbarConfigSnapshot()` — version string for `useSyncExternalStore`

**Test helper:** `_resetToolbarConfig()`

## Dependencies

- `./loader.js` — `deepMerge` for layered config merging

## Dependents

- [`./mountStoryboardCore.js`](./mountStoryboardCore.js.md) — initializes with merged config
- `packages/core/src/CoreUIBar.svelte` — subscribes for reactive toolbar rendering
- `packages/core/src/configStore.js` — references for unified config
- `packages/core/src/inspector/highlighter.js` — reads toolbar config
- `packages/core/src/index.js` — re-exports
