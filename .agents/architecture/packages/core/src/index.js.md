# `packages/core/src/index.js`

<!--
source: packages/core/src/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Barrel module for `@dfosco/storyboard-core`. Re-exports every public API from the core package so consumers have a single import path. This is the package entry point — every framework-agnostic utility (data loading, URL session, body classes, modes, tools, feature flags, config, devtools, etc.) is funneled through here.

The file has zero logic of its own; it purely aggregates exports from internal modules. Adding a new core capability means adding an export line here.

## Composition

Pure re-export barrel. Key export groups:

```js
// Data layer
export { init, loadFlow, listFlows, flowExists, loadRecord, findRecord, loadObject, deepMerge, ... } from './loader.js'
export { getByPath, setByPath, deepClone } from './dotPath.js'

// URL session
export { getParam, setParam, getAllParams, removeParam } from './session.js'

// Reactivity
export { subscribeToHash, getHashSnapshot } from './hashSubscribe.js'

// Body classes, modes, tools, feature flags, config, devtools, etc.
```

## Dependencies

All sibling modules in `packages/core/src/`:
- [`loader.js`](./loader.js.md), [`dotPath.js`](./dotPath.js.md), [`hashSubscribe.js`](./hashSubscribe.js.md), [`bodyClasses.js`](./bodyClasses.js.md), [`featureFlags.js`](./featureFlags.js.md), [`commandActions.js`](./commandActions.js.md), [`canvasConfig.js`](./canvasConfig.js.md), [`commandPaletteConfig.js`](./commandPaletteConfig.js.md), [`configStore.js`](./configStore.js.md), [`customerModeConfig.js`](./customerModeConfig.js.md), [`devtools-consumer.js`](./devtools-consumer.js.md), [`fuzzySearch.js`](./fuzzySearch.js.md)
- Also: `session.js`, `localStorage.js`, `hideMode.js`, `interceptHideParams.js`, `modes.js`, `sceneDebug.js`, `mountStoryboardCore.js`, `viewfinder.js`, `plugins.js`, `uiConfig.js`, `toolRegistry.js`, `toolbarConfigStore.js`, `toolStateStore.js`, `comments/config.js`, `stores/themeStore.js`, `recentArtifacts.js`

## Dependents

Consumed via `@dfosco/storyboard-core` by virtually every package in the monorepo:

- `packages/react/src/context.jsx`, `packages/react/src/Viewfinder.jsx`, `packages/react/src/CommandPalette/CommandPalette.jsx`
- `packages/react/src/hooks/` — `useOverride.js`, `useObject.js`, `useRecord.js`, `useFlows.js`, `useFeatureFlag.js`, `useMode.js`, `useHideMode.js`, `useUndoRedo.js`, `useConfig.js`, `useThemeState.js`, `useLocalStorage.js`, `useSceneData.js`
- `packages/react/src/canvas/` — `CanvasPage.jsx`, `CanvasControls.jsx`, `useCanvas.js`, `widgets/pasteRules.js`, `widgets/TerminalWidget.jsx`, `widgets/embedTheme.js`
- `packages/react/src/vite/data-plugin.js`
- `packages/react-primer/src/DevTools/DevTools.jsx`, `FeatureFlagsPanel.jsx`, `SceneDebug.jsx`
- `packages/react-reshaped/src/StoryboardForm.jsx`
- `packages/core/src/mountStoryboardCore.js`, `sceneDebug.js`, `devtools.js`, `svelte-plugin-ui/` stores and tests
- `src/index.jsx`, `src/components/StoryboardForm/StoryboardForm.jsx`

## Notes

Deprecated aliases (`loadScene`, `listScenes`, `sceneExists`, `setSceneClass`, `mountSceneDebug`) are re-exported for backwards compatibility.
