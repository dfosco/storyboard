# `packages/react/src/index.js`

<!--
source: packages/react/src/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Barrel export for `@dfosco/storyboard-react` — the React framework binding for the storyboard system. Re-exports the provider, context, all hooks, the hash preserver, and the form context. This is the main entry point for React consumers of the storyboard data system. It is design-system-agnostic — no Primer, Reshaped, or other UI library dependencies.

## Composition

```js
// Context & Provider
export { default as StoryboardProvider } from './context.jsx'
export { StoryboardContext } from './StoryboardContext.js'

// Hooks
export { useFlowData, useFlowLoading } from './hooks/useSceneData.js'
// Deprecated aliases
export { useSceneData, useSceneLoading } from './hooks/useSceneData.js'
export { useOverride } from './hooks/useOverride.js'
export { useOverride as useSession } from './hooks/useOverride.js' // deprecated alias
export { useFlow, useScene } from './hooks/useScene.js'
export { useFlows } from './hooks/useFlows.js'
export { useRecord, useRecords } from './hooks/useRecord.js'
export { useObject } from './hooks/useObject.js'
export { useLocalStorage } from './hooks/useLocalStorage.js'
export { useHideMode } from './hooks/useHideMode.js'
export { useUndoRedo } from './hooks/useUndoRedo.js'
export { useFeatureFlag } from './hooks/useFeatureFlag.js'
export { useMode } from './hooks/useMode.js'

// React Router integration
export { installHashPreserver } from './hashPreserver.js'

// Form context (for design system packages to use)
export { FormContext } from './context/FormContext.js'

// Viewfinder dashboard
export { default as Viewfinder } from './Viewfinder.jsx'

// Canvas
export { default as CanvasPage } from './canvas/CanvasPage.jsx'
export { useCanvas } from './canvas/useCanvas.js'
```

The current export surface includes the preferred `useFlowData`/`useFlowLoading` names alongside deprecated `useSceneData`/`useSceneLoading` aliases, plus `useFlow`/`useScene` for flow switching, `useFlows` for listing prototype flows, `useFeatureFlag` for feature flags, `useMode` for design mode state, `Viewfinder` for the dashboard view, and canvas-related exports (`CanvasPage`, `useCanvas`).

## Dependencies

- [`packages/react/src/context.jsx`](./context.jsx.md) — StoryboardProvider component
- [`packages/react/src/StoryboardContext.js`](./StoryboardContext.js.md) — React context object
- [`packages/react/src/hashPreserver.js`](./hashPreserver.js.md) — Hash preservation across navigations
- [`packages/react/src/context/FormContext.js`](./context/FormContext.js.md) — Form context for design system packages
- [`packages/react/src/Viewfinder.jsx`](./Viewfinder.jsx.md) — Viewfinder dashboard component
- [`packages/react/src/canvas/CanvasPage.jsx`](./canvas/CanvasPage.jsx.md) — Canvas page component
- [`packages/react/src/canvas/useCanvas.js`](./canvas/useCanvas.js.md) — Canvas hook
- All hooks in [`packages/react/src/hooks/`](./hooks/) — including [`useFlows`](./hooks/useFlows.js.md), [`useFeatureFlag`](./hooks/useFeatureFlag.js.md), [`useMode`](./hooks/useMode.js.md)

## Dependents

- [`src/pages/_app.jsx`](../../../src/pages/_app.jsx.md) — Imports `StoryboardProvider`
- [`src/index.jsx`](../../../src/index.jsx.md) — Imports `installHashPreserver`
- Any page or component that uses storyboard hooks
