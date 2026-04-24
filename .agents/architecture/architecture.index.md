# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

This is a **Storyboard** prototyping platform — a monorepo with 6 packages: the root app (`storyboard`), a framework-agnostic core library ([`@dfosco/storyboard-core`](./packages/core/package.json.md)), a React integration layer ([`@dfosco/storyboard-react`](./packages/react/package.json.md)), two UI adapter packages for Primer ([`@dfosco/storyboard-react-primer`](./packages/react-primer/package.json.md)) and Reshaped ([`@dfosco/storyboard-react-reshaped`](./packages/react-reshaped/package.json.md)), and a standalone canvas library ([`@dfosco/tiny-canvas`](./packages/tiny-canvas/package.json.md)).

## Storyboard System

The Storyboard system is split into a **core** layer and a **React** layer. The core (`@dfosco/storyboard-core`) is framework-agnostic JavaScript with zero framework dependencies — it handles data loading, URL hash session state, configuration, display modes, devtools, toolbar/tool management, and the command palette. The React layer (`@dfosco/storyboard-react`) wraps core functionality in React hooks and context providers, enabling components to consume flow data, records, objects, overrides, and session state reactively.

Data flows through a well-defined pipeline: JSON data files (flows, objects, records) are discovered at build time by the [Vite data plugin](./packages/react/src/vite/data-plugin.js.md), which generates a virtual module that seeds the [loader](./packages/core/src/loader.js.md) via `init()`. At runtime, the [StoryboardProvider](./packages/react/src/context.jsx.md) loads flow data into React context, and hooks like [`useFlows`](./packages/react/src/hooks/useFlows.js.md), [`useObject`](./packages/react/src/hooks/useObject.js.md), and [`useRecord`](./packages/react/src/hooks/useRecord.js.md) provide access to resolved data. Session state is stored entirely in the URL hash via [`session.js`](./packages/core/src/session.js.md) and [`hashSubscribe.js`](./packages/core/src/hashSubscribe.js.md), making prototypes shareable by URL.

The UI adapter packages (`react-primer` and `react-reshaped`) provide form components, devtools panels, and theme synchronization that are specific to their respective design systems. The toolbar system is managed by [`toolbarConfigStore.js`](./packages/core/src/toolbarConfigStore.js.md), [`toolRegistry.js`](./packages/core/src/toolRegistry.js.md), and [`toolStateStore.js`](./packages/core/src/toolStateStore.js.md), with tool definitions loaded from JSON config. The [tiny-canvas](./packages/tiny-canvas/src/index.js.md) package provides a lightweight infinite canvas with draggable widgets, used for the canvas page feature.

### Core Package (`@dfosco/storyboard-core`)

- [`packages/core/src/index.js`](./packages/core/src/index.js.md) — Public API barrel export for the core package
- [`packages/core/src/loader.js`](./packages/core/src/loader.js.md) — Data loader: resolves flows, objects, records with `$ref`/`$global` support
- [`packages/core/src/session.js`](./packages/core/src/session.js.md) — URL hash-based session state (read/write/subscribe)
- [`packages/core/src/hashSubscribe.js`](./packages/core/src/hashSubscribe.js.md) — Low-level hash change subscription with batched notifications
- [`packages/core/src/dotPath.js`](./packages/core/src/dotPath.js.md) — Dot-notation path utilities (`getByPath`, `setByPath`)
- [`packages/core/src/configSchema.js`](./packages/core/src/configSchema.js.md) — JSON schema validation for `storyboard.config.json`
- [`packages/core/src/configStore.js`](./packages/core/src/configStore.js.md) — Reactive config store with subscription support
- [`packages/core/src/modes.js`](./packages/core/src/modes.js.md) — Display mode management (design, customer, prod modes)
- [`packages/core/src/hideMode.js`](./packages/core/src/hideMode.js.md) — Hide-mode state for concealing storyboard chrome
- [`packages/core/src/interceptHideParams.js`](./packages/core/src/interceptHideParams.js.md) — Intercepts URL params to trigger hide mode
- [`packages/core/src/bodyClasses.js`](./packages/core/src/bodyClasses.js.md) — Manages CSS classes on `<body>` for mode-driven styling
- [`packages/core/src/canvasConfig.js`](./packages/core/src/canvasConfig.js.md) — Canvas widget configuration and schema
- [`packages/core/src/commandActions.js`](./packages/core/src/commandActions.js.md) — Command palette action definitions
- [`packages/core/src/commandPaletteConfig.js`](./packages/core/src/commandPaletteConfig.js.md) — Command palette configuration and provider setup
- [`packages/core/src/customerModeConfig.js`](./packages/core/src/customerModeConfig.js.md) — Customer-mode-specific configuration
- [`packages/core/src/devtools.js`](./packages/core/src/devtools.js.md) — Devtools panel registration and state management
- [`packages/core/src/devtools-consumer.js`](./packages/core/src/devtools-consumer.js.md) — Devtools consumer for external integrations
- [`packages/core/src/featureFlags.js`](./packages/core/src/featureFlags.js.md) — Feature flag system with localStorage persistence
- [`packages/core/src/fuzzySearch.js`](./packages/core/src/fuzzySearch.js.md) — Fuzzy string matching for command palette and viewfinder
- [`packages/core/src/localStorage.js`](./packages/core/src/localStorage.js.md) — Safe localStorage wrapper with JSON serialization
- [`packages/core/src/mobileViewport.js`](./packages/core/src/mobileViewport.js.md) — Mobile viewport meta tag management
- [`packages/core/src/mountStoryboardCore.js`](./packages/core/src/mountStoryboardCore.js.md) — Bootstrap orchestrator that initializes all core subsystems
- [`packages/core/src/paletteProviders.js`](./packages/core/src/paletteProviders.js.md) — Data providers for command palette items
- [`packages/core/src/plugins.js`](./packages/core/src/plugins.js.md) — Plugin system for extending storyboard functionality
- [`packages/core/src/prodMode.js`](./packages/core/src/prodMode.js.md) — Production mode detection and configuration
- [`packages/core/src/recentArtifacts.js`](./packages/core/src/recentArtifacts.js.md) — Recently-viewed prototype tracking
- [`packages/core/src/scaffold.js`](./packages/core/src/scaffold.js.md) — Project scaffolding utilities
- [`packages/core/src/sceneDebug.js`](./packages/core/src/sceneDebug.js.md) — Scene debugging utilities for flow data inspection
- [`packages/core/src/smoothCorners.js`](./packages/core/src/smoothCorners.js.md) — Smooth corner rendering with superellipse CSS
- [`packages/core/src/toolbarConfigStore.js`](./packages/core/src/toolbarConfigStore.js.md) — Toolbar configuration store loaded from JSON
- [`packages/core/src/toolRegistry.js`](./packages/core/src/toolRegistry.js.md) — Tool handler registry for toolbar actions
- [`packages/core/src/toolStateStore.js`](./packages/core/src/toolStateStore.js.md) — Reactive state store for active tool state
- [`packages/core/src/ui-entry.js`](./packages/core/src/ui-entry.js.md) — UI runtime entry point for Svelte-based core UI
- [`packages/core/src/uiConfig.js`](./packages/core/src/uiConfig.js.md) — UI configuration (sidebar, panels, layout)
- [`packages/core/src/viewfinder.js`](./packages/core/src/viewfinder.js.md) — Viewfinder (prototype browser/navigator) data and search

### Core Tests

- [`packages/core/src/bodyClasses.test.js`](./packages/core/src/bodyClasses.test.js.md) — Tests for body class management
- [`packages/core/src/canvasConfig.test.js`](./packages/core/src/canvasConfig.test.js.md) — Tests for canvas configuration
- [`packages/core/src/configSchema.test.js`](./packages/core/src/configSchema.test.js.md) — Tests for config schema validation
- [`packages/core/src/devtools.test.js`](./packages/core/src/devtools.test.js.md) — Tests for devtools registration
- [`packages/core/src/dotPath.test.js`](./packages/core/src/dotPath.test.js.md) — Tests for dot-notation path utilities
- [`packages/core/src/fuzzySearch.test.js`](./packages/core/src/fuzzySearch.test.js.md) — Tests for fuzzy search matching
- [`packages/core/src/hashSubscribe.test.js`](./packages/core/src/hashSubscribe.test.js.md) — Tests for hash subscription
- [`packages/core/src/hideMode.test.js`](./packages/core/src/hideMode.test.js.md) — Tests for hide mode state
- [`packages/core/src/interceptHideParams.test.js`](./packages/core/src/interceptHideParams.test.js.md) — Tests for URL param interception
- [`packages/core/src/loader.test.js`](./packages/core/src/loader.test.js.md) — Tests for data loader (flows, refs, records)
- [`packages/core/src/localStorage.test.js`](./packages/core/src/localStorage.test.js.md) — Tests for localStorage wrapper
- [`packages/core/src/mobileViewport.test.js`](./packages/core/src/mobileViewport.test.js.md) — Tests for mobile viewport management
- [`packages/core/src/modes.test.js`](./packages/core/src/modes.test.js.md) — Tests for display mode logic
- [`packages/core/src/paletteProviders.test.js`](./packages/core/src/paletteProviders.test.js.md) — Tests for palette data providers
- [`packages/core/src/plugins.test.js`](./packages/core/src/plugins.test.js.md) — Tests for plugin system
- [`packages/core/src/recentArtifacts.test.js`](./packages/core/src/recentArtifacts.test.js.md) — Tests for recent artifacts tracking
- [`packages/core/src/sceneDebug.test.js`](./packages/core/src/sceneDebug.test.js.md) — Tests for scene debugging
- [`packages/core/src/session.test.js`](./packages/core/src/session.test.js.md) — Tests for session state management
- [`packages/core/src/toolStateStore.test.js`](./packages/core/src/toolStateStore.test.js.md) — Tests for tool state store
- [`packages/core/src/uiConfig.test.js`](./packages/core/src/uiConfig.test.js.md) — Tests for UI configuration
- [`packages/core/src/viewfinder.test.js`](./packages/core/src/viewfinder.test.js.md) — Tests for viewfinder data and search

### React Package (`@dfosco/storyboard-react`)

- [`packages/react/src/index.js`](./packages/react/src/index.js.md) — Public API barrel export for the React package
- [`packages/react/src/context.jsx`](./packages/react/src/context.jsx.md) — StoryboardProvider: React context provider for flow data
- [`packages/react/src/StoryboardContext.js`](./packages/react/src/StoryboardContext.js.md) — React context object definition
- [`packages/react/src/hashPreserver.js`](./packages/react/src/hashPreserver.js.md) — Preserves URL hash across React Router navigations
- [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) — Vite plugin for discovering and serving data files
- [`packages/react/src/hooks/useConfig.js`](./packages/react/src/hooks/useConfig.js.md) — Hook for accessing storyboard config
- [`packages/react/src/hooks/useFeatureFlag.js`](./packages/react/src/hooks/useFeatureFlag.js.md) — Hook for reading feature flags
- [`packages/react/src/hooks/useFlows.js`](./packages/react/src/hooks/useFlows.js.md) — Hook for accessing flow data by dot-notation path
- [`packages/react/src/hooks/useHideMode.js`](./packages/react/src/hooks/useHideMode.js.md) — Hook for hide mode state
- [`packages/react/src/hooks/useLocalStorage.js`](./packages/react/src/hooks/useLocalStorage.js.md) — Hook for reactive localStorage access
- [`packages/react/src/hooks/useMode.js`](./packages/react/src/hooks/useMode.js.md) — Hook for reading/setting display mode
- [`packages/react/src/hooks/useObject.js`](./packages/react/src/hooks/useObject.js.md) — Hook for loading data objects by name
- [`packages/react/src/hooks/useOverride.js`](./packages/react/src/hooks/useOverride.js.md) — Hook for reading/writing hash overrides
- [`packages/react/src/hooks/useRecord.js`](./packages/react/src/hooks/useRecord.js.md) — Hook for loading record entries by URL param
- [`packages/react/src/hooks/useScene.js`](./packages/react/src/hooks/useScene.js.md) — Hook for scene-level metadata and navigation
- [`packages/react/src/hooks/useSceneData.js`](./packages/react/src/hooks/useSceneData.js.md) — Hook for combined scene + flow data access
- [`packages/react/src/hooks/useSession.js`](./packages/react/src/hooks/useSession.js.md) — Hook for URL hash session state
- [`packages/react/src/hooks/useThemeState.js`](./packages/react/src/hooks/useThemeState.js.md) — Hook for theme state (color mode, scheme)
- [`packages/react/src/hooks/useUndoRedo.js`](./packages/react/src/hooks/useUndoRedo.js.md) — Hook for undo/redo on hash state changes
- [`packages/react/src/context/FormContext.js`](./packages/react/src/context/FormContext.js.md) — Form context for storyboard form components

### React Hook Tests

- [`packages/react/src/hooks/useFlows.test.js`](./packages/react/src/hooks/useFlows.test.js.md) — Tests for flow data hook
- [`packages/react/src/hooks/useHideMode.test.js`](./packages/react/src/hooks/useHideMode.test.js.md) — Tests for hide mode hook
- [`packages/react/src/hooks/useLocalStorage.test.js`](./packages/react/src/hooks/useLocalStorage.test.js.md) — Tests for localStorage hook
- [`packages/react/src/hooks/useObject.test.js`](./packages/react/src/hooks/useObject.test.js.md) — Tests for object hook
- [`packages/react/src/hooks/useOverride.test.js`](./packages/react/src/hooks/useOverride.test.js.md) — Tests for override hook
- [`packages/react/src/hooks/useRecord.test.js`](./packages/react/src/hooks/useRecord.test.js.md) — Tests for record hook
- [`packages/react/src/hooks/useScene.test.js`](./packages/react/src/hooks/useScene.test.js.md) — Tests for scene hook
- [`packages/react/src/hooks/useSceneData.test.js`](./packages/react/src/hooks/useSceneData.test.js.md) — Tests for scene data hook
- [`packages/react/src/hooks/useSession.test.js`](./packages/react/src/hooks/useSession.test.js.md) — Tests for session hook
- [`packages/react/src/hooks/useThemeState.test.js`](./packages/react/src/hooks/useThemeState.test.js.md) — Tests for theme state hook
- [`packages/react/src/hooks/useUndoRedo.test.js`](./packages/react/src/hooks/useUndoRedo.test.js.md) — Tests for undo/redo hook

### UI Adapter: Primer (`@dfosco/storyboard-react-primer`)

- [`packages/react-primer/src/index.js`](./packages/react-primer/src/index.js.md) — Barrel export for Primer adapter components
- [`packages/react-primer/src/DevTools/DevTools.jsx`](./packages/react-primer/src/DevTools/DevTools.jsx.md) — Devtools panel UI built with Primer components
- [`packages/react-primer/src/Checkbox.jsx`](./packages/react-primer/src/Checkbox.jsx.md) — Primer-styled checkbox form control
- [`packages/react-primer/src/SceneDataDemo.jsx`](./packages/react-primer/src/SceneDataDemo.jsx.md) — Demo component for scene data visualization
- [`packages/react-primer/src/SceneDebug.jsx`](./packages/react-primer/src/SceneDebug.jsx.md) — Debug panel for scene/flow data
- [`packages/react-primer/src/Select.jsx`](./packages/react-primer/src/Select.jsx.md) — Primer-styled select form control
- [`packages/react-primer/src/StoryboardForm.jsx`](./packages/react-primer/src/StoryboardForm.jsx.md) — Storyboard-aware form wrapper
- [`packages/react-primer/src/Textarea.jsx`](./packages/react-primer/src/Textarea.jsx.md) — Primer-styled textarea form control
- [`packages/react-primer/src/TextInput.jsx`](./packages/react-primer/src/TextInput.jsx.md) — Primer-styled text input form control
- [`packages/react-primer/src/ThemeSync.jsx`](./packages/react-primer/src/ThemeSync.jsx.md) — Synchronizes Primer theme with storyboard color mode

### UI Adapter: Reshaped (`@dfosco/storyboard-react-reshaped`)

- [`packages/react-reshaped/src/index.js`](./packages/react-reshaped/src/index.js.md) — Barrel export for Reshaped adapter components

### Tiny Canvas (`@dfosco/tiny-canvas`)

- [`packages/tiny-canvas/src/index.js`](./packages/tiny-canvas/src/index.js.md) — Public API: Canvas, Draggable, useResetCanvas, utilities
- [`packages/tiny-canvas/src/Canvas.jsx`](./packages/tiny-canvas/src/Canvas.jsx.md) — Infinite canvas container with pan/zoom support
- [`packages/tiny-canvas/src/Draggable.jsx`](./packages/tiny-canvas/src/Draggable.jsx.md) — Draggable widget wrapper for canvas elements
- [`packages/tiny-canvas/src/useResetCanvas.js`](./packages/tiny-canvas/src/useResetCanvas.js.md) — Hook to reset canvas viewport to default state
- [`packages/tiny-canvas/src/utils.js`](./packages/tiny-canvas/src/utils.js.md) — Canvas math and geometry utilities

## Entry Points

The application entry point bootstraps the React app with routing, theme providers, and storyboard core initialization.

- [`src/index.jsx`](./src/index.jsx.md) — Root app entry: mounts React with router, theme, and storyboard core

## Configuration

Package manifests and build configuration for the monorepo. The root `package.json` defines workspaces and dev scripts, while each package manifest declares its own dependencies, exports, and publishing metadata.

- [`package.json`](./package.json.md) — Root monorepo manifest with workspaces and dev scripts
- [`packages/core/package.json`](./packages/core/package.json.md) — `@dfosco/storyboard-core` manifest with ~20 export paths
- [`packages/react/package.json`](./packages/react/package.json.md) — `@dfosco/storyboard-react` manifest with hooks and Vite plugin
- [`packages/react-primer/package.json`](./packages/react-primer/package.json.md) — `@dfosco/storyboard-react-primer` Primer adapter manifest
- [`packages/react-reshaped/package.json`](./packages/react-reshaped/package.json.md) — `@dfosco/storyboard-react-reshaped` Reshaped adapter manifest
- [`packages/tiny-canvas/package.json`](./packages/tiny-canvas/package.json.md) — `@dfosco/tiny-canvas` standalone canvas library manifest
- [`vite.config.js`](./vite.config.js.md) — Vite build configuration with aliases, plugins, and CSS settings

