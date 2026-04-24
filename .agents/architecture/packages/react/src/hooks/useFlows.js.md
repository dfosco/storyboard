# `packages/react/src/hooks/useFlows.js`

<!--
source: packages/react/src/hooks/useFlows.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Lists all flows scoped to the current prototype and provides a `switchFlow` function for navigating between them. Used by flow selector UI components to display available flows and switch the active one.

## Composition

```js
export function useFlows() → { flows, activeFlow, switchFlow, prototypeName }
```

- Reads `flowName` and `prototypeName` from [`StoryboardContext`](../StoryboardContext.js.md)
- Calls `getFlowsForPrototype(prototypeName)` to get scoped flows
- Enriches each flow with `title` (from flow meta) and `route` (from `resolveFlowRoute`)
- `switchFlow(flowKey)` navigates via `window.location.href`

Throws if used outside `<StoryboardProvider>`.

## Dependencies

- `react` (useContext, useMemo, useCallback)
- `@dfosco/storyboard-core` — getFlowsForPrototype, resolveFlowRoute, getFlowMeta
- [`StoryboardContext`](../StoryboardContext.js.md)

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
