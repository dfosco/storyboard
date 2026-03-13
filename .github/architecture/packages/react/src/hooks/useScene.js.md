# `packages/react/src/hooks/useScene.js`

<!--
source: packages/react/src/hooks/useScene.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides the current flow name and a function to programmatically switch flows by updating the `?flow=` query parameter (with `?scene=` cleanup for backward compatibility). Used for flow switching UI and navigation.

## Composition

**`useFlow()`** — Primary hook. Returns `{ flowName, switchFlow }`.

```js
export function useFlow() {
  const context = useContext(StoryboardContext)
  // throws if outside StoryboardProvider

  const switchFlow = useCallback((name) => {
    const url = new URL(window.location.href)
    url.searchParams.delete('scene')
    url.searchParams.set('flow', name)
    window.location.href = url.toString() // preserves hash
  }, [])

  return { flowName: context.flowName, switchFlow }
}
```

**`useScene()`** — Deprecated alias wrapping `useFlow()`. Returns `{ sceneName, switchScene }` for backward compatibility.

## Dependencies

- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — Reads `flowName` from context

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useFlow` and deprecated `useScene`
