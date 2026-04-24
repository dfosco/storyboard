# `packages/react/src/hooks/useScene.js`

<!--
source: packages/react/src/hooks/useScene.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Read the current flow name and programmatically switch flows by updating the `?flow=` query param. `useScene` is the deprecated alias that returns `{ sceneName, switchScene }`.

## Composition

```js
export function useFlow() → { flowName, switchFlow }
export function useScene() → { sceneName, switchScene }  // deprecated
```

- `switchFlow(name)` builds a new URL with `?flow={name}`, preserving the hash, and navigates via `window.location.href`
- Throws if used outside `<StoryboardProvider>`

## Dependencies

- `react` (useContext, useCallback)
- [`StoryboardContext`](../StoryboardContext.js.md)

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports both `useFlow` and `useScene`
- `packages/react-primer/src/SceneDataDemo.jsx`
