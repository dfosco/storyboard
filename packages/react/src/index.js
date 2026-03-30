/**
 * @dfosco/storyboard-react — React framework binding for Storyboard.
 *
 * Provides hooks, context, and provider for React apps.
 * Design-system-agnostic — no Primer, Reshaped, or other UI library deps.
 */

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

// Design mode hook (keep — React apps may still read mode state)
// ModeSwitch and ToolbarShell UI moved to @dfosco/storyboard-svelte-ui

// Viewfinder dashboard
export { default as Viewfinder } from './Viewfinder.jsx'

// Canvas
export { default as CanvasPage } from './canvas/CanvasPage.jsx'
export { useCanvas } from './canvas/useCanvas.js'
