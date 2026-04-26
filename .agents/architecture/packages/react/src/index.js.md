# `packages/react/src/index.js`

<!--
source: packages/react/src/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Public entry point for the `@dfosco/storyboard-react` package. Re-exports every hook, context, provider, and UI component that React consumers need. This is the single import surface for the entire React binding layer — no consumer should reach into internal paths.

The file is intentionally stateless: it contains no logic, only `export` statements that map internal modules to the public API.

## Composition

Pure re-export barrel file. Key exports grouped by category:

**Context & Provider**
```js
export { default as StoryboardProvider } from './context.jsx'
export { StoryboardContext } from './StoryboardContext.js'
```

**Hooks**
```js
export { useFlowData, useFlowLoading } from './hooks/useSceneData.js'
export { useOverride } from './hooks/useOverride.js'
export { useFlow, useScene } from './hooks/useScene.js'
export { useFlows } from './hooks/useFlows.js'
export { useRecord, useRecords } from './hooks/useRecord.js'
export { useObject } from './hooks/useObject.js'
export { useLocalStorage } from './hooks/useLocalStorage.js'
export { useHideMode } from './hooks/useHideMode.js'
export { useUndoRedo } from './hooks/useUndoRedo.js'
export { useFeatureFlag } from './hooks/useFeatureFlag.js'
export { useMode } from './hooks/useMode.js'
export { useThemeState, useThemeSyncTargets } from './hooks/useThemeState.js'
export { useConfig } from './hooks/useConfig.js'
```

**Utilities & UI**
```js
export { installHashPreserver } from './hashPreserver.js'
export { FormContext } from './context/FormContext.js'
export { default as Workspace } from './Workspace.jsx'
// Deprecated alias — use Workspace instead
export { default as Viewfinder } from './Workspace.jsx'
export { default as StoryboardCommandPalette } from './CommandPalette/CommandPalette.jsx'
export { default as BranchBar } from './BranchBar/BranchBar.jsx'
export { default as AuthModal } from './AuthModal/AuthModal.jsx'
export { default as CanvasPage } from './canvas/CanvasPage.jsx'
export { useCanvas } from './canvas/useCanvas.js'
export { default as Icon } from './Icon.jsx'
```

Deprecated aliases: `useSceneData` → `useFlowData`, `useSceneLoading` → `useFlowLoading`, `useSession` → `useOverride`, `Viewfinder` → `Workspace`.

## Dependencies

Every module under `packages/react/src/` — this file imports from all of them.

## Dependents

Consumed via `@dfosco/storyboard-react` by:
- `src/index.jsx`, `src/prototypes/_app.jsx`, `src/prototypes/viewfinder.jsx`, and prototype pages
- `src/components/ThemeSync/`, `src/components/TextInput/`, `src/components/Textarea/`, `src/components/StoryboardForm/`
- `packages/react-primer/src/` (ThemeSync, TextInput, Textarea, Select, Checkbox, StoryboardForm, SceneDataDemo)
- `packages/react-reshaped/src/` (TextInput, Textarea, Select, Checkbox, StoryboardForm)

## Notes

`useSession` is exported as a deprecated alias for `useOverride`. `useSceneData`/`useSceneLoading` are deprecated aliases for `useFlowData`/`useFlowLoading`.
