# `packages/react/src/StoryboardContext.js`

<!--
source: packages/react/src/StoryboardContext.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Creates the React context object that carries flow data, loading state, error state, and the active flow/prototype names through the component tree. This is the single shared context consumed by all storyboard hooks that need flow data.

## Composition

```js
import { createContext } from 'react'
export const StoryboardContext = createContext(null)
```

Single named export. Default value is `null` — hooks use this to detect usage outside a `<StoryboardProvider>`.

**Context value shape** (set by [`context.jsx`](./context.jsx.md)):
```js
{ data: object|null, error: string|null, loading: boolean, flowName: string|null, sceneName: string|null, prototypeName: string|null }
```

## Dependencies

- `react` (createContext)

## Dependents

- [`context.jsx`](./context.jsx.md) — wraps children with `StoryboardContext.Provider`
- [`index.js`](./index.js.md) — re-exports
- [`hooks/useFlows.js`](./hooks/useFlows.js.md), [`hooks/useSceneData.js`](./hooks/useSceneData.js.md), [`hooks/useRecord.js`](./hooks/useRecord.js.md), [`hooks/useObject.js`](./hooks/useObject.js.md), [`hooks/useOverride.js`](./hooks/useOverride.js.md), [`hooks/useLocalStorage.js`](./hooks/useLocalStorage.js.md), [`hooks/useScene.js`](./hooks/useScene.js.md)
- `packages/react/src/test-utils.js`
