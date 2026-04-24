# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Storyboard System

This monorepo currently publishes five npm packages: `@dfosco/storyboard-core`, `@dfosco/storyboard-react`, `@dfosco/storyboard-react-primer`, `@dfosco/storyboard-react-reshaped`, and `@dfosco/tiny-canvas`. The runtime architecture is centered on the core + React pair (`@dfosco/storyboard-core` provides framework-agnostic state/loader/runtime primitives, and `@dfosco/storyboard-react` provides React integration), while the Primer/Reshaped adapters and tiny-canvas package extend UI and canvas capabilities.

Data flows through a pipeline: the Vite data plugin ([`data-plugin.js`](./packages/react/src/vite/data-plugin.js.md)) discovers `.flow.json`, `.object.json`, `.record.json`, `.canvas.jsonl`, and `.prototype.json` files at build time, pre-parses them, and generates a virtual module that seeds the data index via [`loader.js`](./packages/core/src/loader.js.md). The loader resolves `$ref` and `$global` references, supports prototype-scoped name resolution with folder awareness, and returns deep clones to prevent mutation. On the React side, [`StoryboardProvider`](./packages/react/src/context.jsx.md) loads flow data into React context, automatically matching flows to routes (including canvas routes) and supporting prototype scoping.

State management is URL-driven: overrides live in the URL hash (managed by [`session.js`](./packages/core/src/session.js.md)), with hide mode ([`hideMode.js`](./packages/core/src/hideMode.js.md)) providing clean URLs by shadowing overrides in localStorage. The [`bodyClasses.js`](./packages/core/src/bodyClasses.js.md) module mirrors overrides, flows, and feature flags as CSS classes on `<body>`, enabling CSS-driven state styling. React hooks (`useSceneData`, `useOverride`, `useObject`, `useRecord`, `useFeatureFlag`, `useMode`, `useFlows`) expose all this through `useSyncExternalStore` for reactive rendering.

The toolbar system is declarative and config-driven: [`toolbarConfigStore.js`](./packages/core/src/toolbarConfigStore.js.md) manages layered config merging (base → prototype overrides), [`toolRegistry.js`](./packages/core/src/toolRegistry.js.md) connects tool declarations to code modules, and [`toolStateStore.js`](./packages/core/src/toolStateStore.js.md) manages five-state runtime tool visibility. The design modes system ([`modes.js`](./packages/core/src/modes.js.md)) provides a mode registry, switching engine, cross-plugin event bus, and tool registry — enabling multi-mode experiences with lifecycle hooks. The Svelte-based UI chrome is mounted via [`mountStoryboardCore.js`](./packages/core/src/mountStoryboardCore.js.md), which orchestrates toolbar initialization, feature flags, body class sync, and UI config. Feature flags ([`featureFlags.js`](./packages/core/src/featureFlags.js.md)) and [`devtools.js`](./packages/core/src/devtools.js.md) provide runtime configuration and development tooling.

Dev tooling is managed by the **Storyboard CLI** (`storyboard` / `sb`), published in `@dfosco/storyboard-core`. The CLI orchestrates Vite dev servers with worktree-aware base paths and a Caddy reverse proxy for clean URLs. The [`worktree/port.js`](./packages/core/src/worktree/port.js.md) module manages a port registry (`.worktrees/ports.json`) that assigns unique ports per worktree, while the [`cli/`](./packages/core/src/cli/index.js.md) modules handle dev server startup, proxy config generation, environment setup, and feature flag updates.

- [`packages/core/src/cli/index.js`](./packages/core/src/cli/index.js.md) — Storyboard CLI entry point (`storyboard dev`, `setup`, `proxy`, `update:version`)
- [`packages/core/src/worktree/port.js`](./packages/core/src/worktree/port.js.md) — Worktree port registry (port assignment, detection, slugify)
- [`packages/core/src/bodyClasses.js`](./packages/core/src/bodyClasses.js.md) — Mirrors overrides, flows, and feature flags as CSS classes on `<body>`
- [`packages/core/src/bodyClasses.test.js`](./packages/core/src/bodyClasses.test.js.md) — Tests for body class sync
- [`packages/core/src/commandActions.js`](./packages/core/src/commandActions.js.md) — Command menu action registry with mode/route filtering
- [`packages/core/src/devtools.js`](./packages/core/src/devtools.js.md) — Mounts the Svelte-based CoreUIBar toolbar chrome
- [`packages/core/src/devtools.test.js`](./packages/core/src/devtools.test.js.md) — Tests for DevTools mounting
- [`packages/core/src/devtools-consumer.js`](./packages/core/src/devtools-consumer.js.md) — Consumer-safe proxy for the compiled UI bundle
- [`packages/core/src/dotPath.js`](./packages/core/src/dotPath.js.md) — Dot-notation path utilities (`getByPath`, `setByPath`, `deepClone`)
- [`packages/core/src/dotPath.test.js`](./packages/core/src/dotPath.test.js.md) — Tests for dot-notation utilities
- [`packages/core/src/featureFlags.js`](./packages/core/src/featureFlags.js.md) — Feature flag system with localStorage → config priority
- [`packages/core/src/hashSubscribe.js`](./packages/core/src/hashSubscribe.js.md) — Hash change subscription for reactive frameworks
- [`packages/core/src/hashSubscribe.test.js`](./packages/core/src/hashSubscribe.test.js.md) — Tests for hash subscription
- [`packages/core/src/hideMode.js`](./packages/core/src/hideMode.js.md) — Hide mode: clean URLs via localStorage shadow state with undo/redo
- [`packages/core/src/hideMode.test.js`](./packages/core/src/hideMode.test.js.md) — Tests for hide mode
- [`packages/core/src/index.js`](./packages/core/src/index.js.md) — Barrel export for `@dfosco/storyboard-core`
- [`packages/core/src/interceptHideParams.js`](./packages/core/src/interceptHideParams.js.md) — URL param interception for `?hide`/`?show` triggers
- [`packages/core/src/interceptHideParams.test.js`](./packages/core/src/interceptHideParams.test.js.md) — Tests for hide param interception
- [`packages/core/src/loader.js`](./packages/core/src/loader.js.md) — Data index, flow/object/record/folder/canvas loading, `$ref`/`$global` resolution with scoping
- [`packages/core/src/loader.test.js`](./packages/core/src/loader.test.js.md) — Tests for the loader including scoped resolution
- [`packages/core/src/localStorage.js`](./packages/core/src/localStorage.js.md) — localStorage persistence with reactive subscriptions
- [`packages/core/src/localStorage.test.js`](./packages/core/src/localStorage.test.js.md) — Tests for localStorage
- [`packages/core/src/modes.js`](./packages/core/src/modes.js.md) — Design modes registry, switching, event bus, locked mode support
- [`packages/core/src/modes.test.js`](./packages/core/src/modes.test.js.md) — Tests for design modes including locked mode
- [`packages/core/src/mountStoryboardCore.js`](./packages/core/src/mountStoryboardCore.js.md) — Consumer app initialization: toolbar, flags, body classes, UI config
- [`packages/core/src/plugins.js`](./packages/core/src/plugins.js.md) — Plugin enable/disable configuration
- [`packages/core/src/plugins.test.js`](./packages/core/src/plugins.test.js.md) — Tests for plugin configuration
- [`packages/core/src/scaffold.js`](./packages/core/src/scaffold.js.md) — CLI entry for `npx storyboard-scaffold` file sync
- [`packages/core/src/sceneDebug.js`](./packages/core/src/sceneDebug.js.md) — Vanilla JS inline flow debug panel
- [`packages/core/src/sceneDebug.test.js`](./packages/core/src/sceneDebug.test.js.md) — Tests for flow debug panel
- [`packages/core/src/session.js`](./packages/core/src/session.js.md) — URL hash session state read/write
- [`packages/core/src/session.test.js`](./packages/core/src/session.test.js.md) — Tests for session state
- [`packages/core/src/toolbarConfigStore.js`](./packages/core/src/toolbarConfigStore.js.md) — Reactive toolbar config store with layered merging (base → prototype)
- [`packages/core/src/toolRegistry.js`](./packages/core/src/toolRegistry.js.md) — Config-driven registry connecting tool declarations to handler modules
- [`packages/core/src/toolStateStore.js`](./packages/core/src/toolStateStore.js.md) — Five-state runtime tool visibility and interaction management
- [`packages/core/src/toolStateStore.test.js`](./packages/core/src/toolStateStore.test.js.md) — Tests for tool state lifecycle and localOnly behavior
- [`packages/core/src/ui-entry.js`](./packages/core/src/ui-entry.js.md) — Vite library build entry aggregating Svelte UI mount functions + CSS
- [`packages/core/src/uiConfig.js`](./packages/core/src/uiConfig.js.md) — Project-level chrome visibility via `storyboard.config.json`
- [`packages/core/src/uiConfig.test.js`](./packages/core/src/uiConfig.test.js.md) — Tests for UI config initialization
- [`packages/core/src/viewfinder.js`](./packages/core/src/viewfinder.js.md) — Flow route resolution, metadata extraction, prototype/folder/canvas index builder
- [`packages/core/src/viewfinder.test.js`](./packages/core/src/viewfinder.test.js.md) — Tests for viewfinder utilities
- [`packages/react/src/context.jsx`](./packages/react/src/context.jsx.md) — StoryboardProvider: loads flow data into React context with prototype and canvas scoping
- [`packages/react/src/context/FormContext.js`](./packages/react/src/context/FormContext.js.md) — Form state context for storyboard forms
- [`packages/react/src/hashPreserver.js`](./packages/react/src/hashPreserver.js.md) — Client-side navigation interceptor preserving URL hash
- [`packages/react/src/hooks/useFeatureFlag.js`](./packages/react/src/hooks/useFeatureFlag.js.md) — React hook for reading feature flag values
- [`packages/react/src/hooks/useFlows.js`](./packages/react/src/hooks/useFlows.js.md) — React hook for listing available flows for the current prototype
- [`packages/react/src/hooks/useFlows.test.js`](./packages/react/src/hooks/useFlows.test.js.md) — Tests for useFlows
- [`packages/react/src/hooks/useHideMode.js`](./packages/react/src/hooks/useHideMode.js.md) — React hook for hide mode activation/status
- [`packages/react/src/hooks/useHideMode.test.js`](./packages/react/src/hooks/useHideMode.test.js.md) — Tests for useHideMode
- [`packages/react/src/hooks/useLocalStorage.js`](./packages/react/src/hooks/useLocalStorage.js.md) — React hook for reactive localStorage access
- [`packages/react/src/hooks/useLocalStorage.test.js`](./packages/react/src/hooks/useLocalStorage.test.js.md) — Tests for useLocalStorage
- [`packages/react/src/hooks/useMode.js`](./packages/react/src/hooks/useMode.js.md) — React hook for the design-mode system
- [`packages/react/src/hooks/useObject.js`](./packages/react/src/hooks/useObject.js.md) — React hook for loading object data with path access, overrides, and prototype scoping
- [`packages/react/src/hooks/useObject.test.js`](./packages/react/src/hooks/useObject.test.js.md) — Tests for useObject
- [`packages/react/src/hooks/useOverride.js`](./packages/react/src/hooks/useOverride.js.md) — React hook for reading/writing URL hash overrides
- [`packages/react/src/hooks/useOverride.test.js`](./packages/react/src/hooks/useOverride.test.js.md) — Tests for useOverride
- [`packages/react/src/hooks/useRecord.js`](./packages/react/src/hooks/useRecord.js.md) — React hooks for loading record collections with override support
- [`packages/react/src/hooks/useRecord.test.js`](./packages/react/src/hooks/useRecord.test.js.md) — Tests for useRecord/useRecords with scoped records
- [`packages/react/src/hooks/useRecordOverride.js`](./packages/react/src/hooks/useRecordOverride.js.md) — React hook for record-level overrides
- [`packages/react/src/hooks/useRecordOverride.test.js`](./packages/react/src/hooks/useRecordOverride.test.js.md) — Tests for useRecordOverride
- [`packages/react/src/hooks/useScene.js`](./packages/react/src/hooks/useScene.js.md) — React hook for flow name and switching (`useFlow` + deprecated `useScene`)
- [`packages/react/src/hooks/useScene.test.js`](./packages/react/src/hooks/useScene.test.js.md) — Tests for useFlow/useScene
- [`packages/react/src/hooks/useSceneData.js`](./packages/react/src/hooks/useSceneData.js.md) — React hook for accessing flow data by dot-notation path (`useFlowData`/`useFlowLoading`)
- [`packages/react/src/hooks/useSceneData.test.js`](./packages/react/src/hooks/useSceneData.test.js.md) — Tests for useFlowData/useSceneData
- [`packages/react/src/hooks/useSession.js`](./packages/react/src/hooks/useSession.js.md) — React hook for raw URL hash session state
- [`packages/react/src/hooks/useSession.test.js`](./packages/react/src/hooks/useSession.test.js.md) — Tests for useSession
- [`packages/react/src/hooks/useUndoRedo.js`](./packages/react/src/hooks/useUndoRedo.js.md) — React hook for undo/redo history navigation
- [`packages/react/src/hooks/useUndoRedo.test.js`](./packages/react/src/hooks/useUndoRedo.test.js.md) — Tests for useUndoRedo
- [`packages/react/src/index.js`](./packages/react/src/index.js.md) — Barrel export for `@dfosco/storyboard-react`
- [`packages/react/src/StoryboardContext.js`](./packages/react/src/StoryboardContext.js.md) — React context object for storyboard data
- [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) — Vite plugin for data file discovery, canvas support, virtual module generation, and config initialization

## Entry Points

The app entry point bootstraps the storyboard system. It initializes the core (toolbar, feature flags, body classes, hide mode) via `mountStoryboardCore`, sets up hash preservation for navigation, and renders the React app.

- [`src/index.jsx`](./src/index.jsx.md) — App entry point with storyboard system initialization and canvas redirect

## Routing

Routing uses `@generouted/react-router` for file-based route generation from `src/prototypes/`. The app layout wrapper provides the StoryboardProvider with automatic flow-to-route matching and canvas route detection.

- [`src/pages/_app.jsx`](./src/pages/_app.jsx.md) — Root layout wrapping all routes with StoryboardProvider

## Configuration

Build and project configuration files. The Vite config is notably complex due to workspace package aliases (for worktree support), multiple framework plugins (React + Svelte), Tailwind CSS v4 integration, and canvas reload guard.

- [`package.json`](./package.json.md) — Root monorepo manifest with workspaces, scripts, and dependencies
- [`vite.config.js`](./vite.config.js.md) — Vite configuration with storyboard plugins, workspace aliases, and build optimization

## Pages

- [`src/pages/index.jsx`](./src/pages/index.jsx.md) — Home page
