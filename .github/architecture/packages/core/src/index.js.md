# `packages/core/src/index.js`

<!--
source: packages/core/src/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

This is the barrel export for `@dfosco/storyboard-core` — the framework-agnostic data layer of the storyboard system. It re-exports every public API from the core package's internal modules, providing a single import path for consumers. Any frontend framework (React, Vue, Svelte, vanilla JS) can use these utilities directly without framework-specific bindings.

The file organizes exports into logical groups: data initialization, flow/record loading, scoped name resolution, prototype metadata, dot-notation path utilities, URL hash session state, localStorage persistence, hide mode (clean URLs with undo/redo), hash change subscriptions, body class sync, design modes, tool registry, dev tools, viewfinder utilities, feature flags, plugin configuration, and comments system.

## Composition

The file is purely re-exports with no local logic. Key export groups:

```js
// Data index initialization
export { init } from './loader.js'

// Flow, object & record loading
export { loadFlow, listFlows, flowExists, loadRecord, findRecord, loadObject, deepMerge } from './loader.js'
// Scoped name resolution
export { resolveFlowName, resolveRecordName } from './loader.js'
// Prototype metadata
export { listPrototypes, getPrototypeMetadata } from './loader.js'
// Deprecated scene aliases
export { loadScene, listScenes, sceneExists } from './loader.js'

// Dot-notation path utilities
export { getByPath, setByPath, deepClone } from './dotPath.js'

// URL hash session state
export { getParam, setParam, getAllParams, removeParam } from './session.js'

// localStorage persistence
export { getLocal, setLocal, removeLocal, getAllLocal, subscribeToStorage, getStorageSnapshot } from './localStorage.js'

// Hide mode (clean URLs)
export { isHideMode, activateHideMode, deactivateHideMode, getShadow, setShadow, removeShadow, getAllShadows, pushSnapshot, getOverrideHistory, getCurrentSnapshot, getCurrentRoute, getCurrentIndex, getNextIndex, canUndo, canRedo, undo, redo, syncHashToHistory, installHistorySync } from './hideMode.js'
export { interceptHideParams, installHideParamListener } from './interceptHideParams.js'

// Hash change subscription
export { subscribeToHash, getHashSnapshot } from './hashSubscribe.js'

// Body class sync (overrides + flow → <body> classes)
export { installBodyClassSync, setFlowClass, syncOverrideClasses } from './bodyClasses.js'

// Design modes (mode registry, switching, event bus)
export { registerMode, unregisterMode, getRegisteredModes, getCurrentMode, activateMode, deactivateMode, subscribeToMode, getModeSnapshot, syncModeClasses, on, off, emit, initModesConfig, isModesEnabled } from './modes.js'

// Tool registry
export { initTools, setToolAction, setToolState, getToolState, getToolsForMode, subscribeToTools, getToolsSnapshot } from './modes.js'

// Dev tools & viewfinder
export { mountDevTools } from './devtools.js'
export { mountFlowDebug } from './sceneDebug.js'
export { hash, resolveFlowRoute, getFlowMeta, buildPrototypeIndex } from './viewfinder.js'

// Feature flags
export { initFeatureFlags, getFlag, setFlag, toggleFlag, getAllFlags, resetFlags, getFlagKeys, syncFlagBodyClasses } from './featureFlags.js'

// Plugin configuration
export { initPlugins, isPluginEnabled, getPluginsConfig } from './plugins.js'

// Comments system
export { initCommentsConfig, getCommentsConfig, isCommentsEnabled } from './comments/config.js'
```

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — Flow/record loading and data index
- [`packages/core/src/dotPath.js`](./dotPath.js.md) — Dot-notation path utilities
- [`packages/core/src/session.js`](./session.js.md) — URL hash session state
- [`packages/core/src/localStorage.js`](./localStorage.js.md) — localStorage persistence
- [`packages/core/src/hideMode.js`](./hideMode.js.md) — Hide mode and undo/redo history
- [`packages/core/src/interceptHideParams.js`](./interceptHideParams.js.md) — URL param interception
- [`packages/core/src/hashSubscribe.js`](./hashSubscribe.js.md) — Hash change subscription
- [`packages/core/src/bodyClasses.js`](./bodyClasses.js.md) — Body class sync
- [`packages/core/src/modes.js`](./modes.js.md) — Design modes and tool registry
- [`packages/core/src/devtools.js`](./devtools.js.md) — DevTools UI
- [`packages/core/src/sceneDebug.js`](./sceneDebug.js.md) — Flow debug panel
- [`packages/core/src/viewfinder.js`](./viewfinder.js.md) — Viewfinder utilities
- [`packages/core/src/featureFlags.js`](./featureFlags.js.md) — Feature flags
- [`packages/core/src/plugins.js`](./plugins.js.md) — Plugin configuration
- `packages/core/src/comments/config.js` — Comments system config

## Dependents

- [`packages/react/src/vite/data-plugin.js`](../../react/src/vite/data-plugin.js.md) — Generated virtual module imports `init`
- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — Imports core utilities
- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — Imports core utilities
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — Imports `loadRecord`, `deepClone`, `setByPath`
- [`packages/react/src/hooks/useObject.js`](../../react/src/hooks/useObject.js.md) — Imports `loadObject`, path utilities, hide mode
- [`packages/react/src/hooks/useFeatureFlag.js`](../../react/src/hooks/useFeatureFlag.js.md) — Imports `getFlag`, subscriptions
- [`packages/react/src/hooks/useMode.js`](../../react/src/hooks/useMode.js.md) — Imports mode functions
- [`packages/react/src/hooks/useHideMode.js`](../../react/src/hooks/useHideMode.js.md) — Imports hide mode functions
- [`packages/react/src/hooks/useUndoRedo.js`](../../react/src/hooks/useUndoRedo.js.md) — Imports undo/redo functions
- [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) — Imports localStorage and hash functions
- [`packages/react/src/context.jsx`](../../react/src/context.jsx.md) — Imports `loadFlow`, `flowExists`, `findRecord`, `deepMerge`
- [`packages/react/src/hashPreserver.js`](../../react/src/hashPreserver.js.md) — Imports `interceptHideParams`
- [`src/index.jsx`](../../../src/index.jsx.md) — Imports `installHideParamListener`, `installHistorySync`, `mountDevTools`
