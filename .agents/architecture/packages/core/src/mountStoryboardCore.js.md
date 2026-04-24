# `packages/core/src/mountStoryboardCore.js`

<!--
source: packages/core/src/mountStoryboardCore.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

The single entry point for consumer apps to initialize all storyboard systems. `mountStoryboardCore()` orchestrates startup: applies the saved theme to prevent FOUC, installs URL state listeners (hide params, history sync, body classes), initializes all config-driven subsystems (feature flags, plugins, UI config, canvas, command palette, comments, customer mode, toolbar), injects compiled UI styles, and mounts the Svelte-based CoreUIBar and comments system.

For embed iframes (`?_sb_embed`), it skips UI mounting and instead installs `postMessage` bridges for navigation and zoom forwarding to the parent canvas.

## Composition

**Main export:**
- `mountStoryboardCore(config?, options?)` — idempotent (only mounts once)
  - `config` — contents of `storyboard.config.json`
  - `options.basePath` — base URL (e.g. `import.meta.env.BASE_URL`)
  - `options.container` — mount target (default: `document.body`)
  - `options.handlers` — custom tool handler lazy loaders

**Internal functions:**
- `applyEarlyTheme()` — reads `sb-color-scheme` from localStorage and sets `data-color-mode`, `data-sb-theme`, etc. on `<html>` before any framework mounts
- `injectUIStyles()` — dynamically imports `@dfosco/storyboard-core/ui-runtime/style.css`
- `handlePendingNavigation()` — checks `sessionStorage` for `sb-pending-navigate`
- `showPendingNotification()` / `showToast()` — displays post-reload creation notifications

```js
import { mountStoryboardCore } from '@dfosco/storyboard-core'
mountStoryboardCore(storyboardConfig, { basePath: import.meta.env.BASE_URL })
```

## Dependencies

- [`./interceptHideParams.js`](./interceptHideParams.js.md) — `installHideParamListener`
- [`./hideMode.js`](./hideMode.js.md) — `installHistorySync`
- `./bodyClasses.js` — `installBodyClassSync`
- `./comments/config.js` — `initCommentsConfig`, `isCommentsEnabled`
- `./featureFlags.js` — `initFeatureFlags`
- [`./plugins.js`](./plugins.js.md) — `initPlugins`
- [`./uiConfig.js`](./uiConfig.js.md) — `initUIConfig`
- `./canvasConfig.js` — `initCanvasConfig`
- `./commandPaletteConfig.js` — `initCommandPaletteConfig`
- [`./toolbarConfigStore.js`](./toolbarConfigStore.js.md) — `initToolbarConfig`, `consumeClientToolbarOverrides`
- `./customerModeConfig.js` — `initCustomerModeConfig`
- `./configStore.js` — `getConfig`
- `./loader.js` — `deepMerge`

## Dependents

- `src/index.jsx` — consumer app entry point
- `packages/core/src/index.js` — re-exports
- `packages/core/src/vite/server-plugin.js` — references

## Notes

- The theme is applied synchronously before any async work to prevent flash of wrong theme.
- Embed detection (`?_sb_embed`) short-circuits all UI mounting — only `postMessage` bridges are installed.
- Toolbar config merging has a legacy path (manual merge from `toolbar.config.json` + client overrides) and a unified store path.
