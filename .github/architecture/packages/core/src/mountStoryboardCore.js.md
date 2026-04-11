# `packages/core/src/mountStoryboardCore.js`

<!--
source: packages/core/src/mountStoryboardCore.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Single entry point for consumer apps to initialize all storyboard systems. `mountStoryboardCore` is called once at app startup with the contents of `storyboard.config.json` and optional runtime options. It orchestrates the initialization of URL state listeners, history sync, body class sync, feature flags, plugins, UI config, comments, toolbar config, theme application, and the compiled Svelte UI (CoreUIBar + comments).

This is the "glue" module — it imports from many core subsystems but contains no domain logic of its own. Its job is to call each subsystem's `init*` function in the correct order, merge toolbar configs, inject repository URLs, and mount the compiled UI bundle.

## Composition

### Early Theme Application

**`applyEarlyTheme()`** — Reads `sb-color-scheme` and `sb-theme-sync` from localStorage and applies Primer CSS `data-*` attributes to `<html>` before any framework mounts. Supports per-target sync settings (prototype, toolbar, codeBoxes, canvas) and the `_sb_theme_target` URL param for forced targeting.

```js
function applyEarlyTheme() {
  const stored = localStorage.getItem('sb-color-scheme')
  const theme = stored || 'system'
  // Resolves "system" via matchMedia, sets data-sb-theme, data-color-mode, etc.
}
```

### Main Mount Function

**`mountStoryboardCore(config, options?)`** — Orchestrates initialization in this order:

1. **Guard** — No-op if already mounted (idempotent via `_mounted` flag)
2. **Early theme** — `applyEarlyTheme()` prevents flash of wrong theme
3. **Framework-agnostic systems** — `installHideParamListener()`, `installHistorySync()`, `installBodyClassSync()`
4. **Config-driven systems** — `initFeatureFlags()`, `initPlugins()`, `initUIConfig()`
5. **Comments** — `initCommentsConfig()` if configured
6. **UI styles** — `injectUIStyles()` loads the compiled CSS
7. **Toolbar config** — Deep-merges `toolbar.config.json` defaults with consumer overrides, injects repository URL
8. **Toolbar config store** — `initToolbarConfig()` seeds the reactive store
9. **Embed guard** — Skips UI mounting when `?_sb_embed` is present (prototype embed iframe)
10. **UI mount** — Dynamically imports `@dfosco/storyboard-core/ui-runtime`, calls `mountDevTools()` and optionally `mountComments()`
11. **Pending notifications** — Shows toast for workshop creations that survived a Vite reload

```js
export async function mountStoryboardCore(config = {}, options = {}) {
  if (_mounted) return
  _mounted = true
  const basePath = options.basePath || '/'
  applyEarlyTheme()
  installHideParamListener()
  installHistorySync()
  installBodyClassSync()
  if (config.featureFlags) initFeatureFlags(config.featureFlags)
  // ... toolbar merge, UI mount, comments
}
```

### Toolbar Config Merging

The toolbar config is built by deep-merging the bundled `toolbar.config.json` defaults with any consumer-provided `config.toolbar` overrides. Repository URL is injected into both the new tools schema (`toolbarConfig.tools.repository`) and the legacy menus schema (`toolbarConfig.menus.command.actions`).

### Pending Notifications

**`showPendingNotification(basePath)`** — Checks `sessionStorage` for keys like `sb-canvas-created`, `sb-prototype-created`, `sb-flow-created` and shows a temporary toast. This handles the case where Vite does a full reload after file creation, losing the create form's success message.

## Dependencies

- [`packages/core/src/interceptHideParams.js`](./interceptHideParams.js.md) — `installHideParamListener`
- [`packages/core/src/hideMode.js`](./hideMode.js.md) — `installHistorySync`
- [`packages/core/src/bodyClasses.js`](./bodyClasses.js.md) — `installBodyClassSync`
- [`packages/core/src/comments/config.js`](./comments/config.js.md) — `initCommentsConfig`, `isCommentsEnabled`
- [`packages/core/src/featureFlags.js`](./featureFlags.js.md) — `initFeatureFlags`
- [`packages/core/src/plugins.js`](./plugins.js.md) — `initPlugins`
- [`packages/core/src/uiConfig.js`](./uiConfig.js.md) — `initUIConfig`
- [`packages/core/src/toolbarConfigStore.js`](./toolbarConfigStore.js.md) — `initToolbarConfig`
- [`packages/core/src/loader.js`](./loader.js.md) — `deepMerge` for toolbar config merging
- `toolbar.config.json` — Bundled toolbar defaults
- `@dfosco/storyboard-core/ui-runtime` — Compiled Svelte UI bundle (dynamically imported)

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `mountStoryboardCore` as the public API
- [`src/index.jsx`](../../../../src/index.jsx.md) — Source repo app entry point calls `mountStoryboardCore`

## Notes

- The `_mounted` flag ensures the function is idempotent — calling it twice is a no-op.
- When loaded inside a prototype embed iframe (`?_sb_embed`), all UI mounting is skipped. Only framework-agnostic systems and config are initialized.
- Theme is applied synchronously before any async work to prevent a flash of wrong-theme content.
- The toast notification uses inline styles and vanilla DOM — no framework dependency.
