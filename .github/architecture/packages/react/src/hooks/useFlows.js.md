# `packages/react/src/hooks/useFlows.js`

<!--
source: packages/react/src/hooks/useFlows.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook that lists all flows for the current prototype and provides a function to switch between them. This powers flow-switching UIs (e.g. toolbar flow pickers) by exposing the available flows, their titles, routes, and the currently active flow — all scoped to the prototype derived from the current route.

The hook bridges two core utilities — `getFlowsForPrototype` for discovering prototype-scoped flows and `getFlowMeta` for reading flow metadata (titles) — with React context to provide a reactive, prototype-aware interface.

## Composition

```js
export function useFlows() {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useFlows must be used within a <StoryboardProvider>')
  }

  const { flowName: activeFlow, prototypeName } = context

  const flows = useMemo(() => {
    if (!prototypeName) return []
    return getFlowsForPrototype(prototypeName).map(f => {
      const meta = getFlowMeta(f.key)
      return {
        key: f.key,
        name: f.name,
        title: meta?.title || f.name,
        route: resolveFlowRoute(f.key),
      }
    })
  }, [prototypeName])

  const switchFlow = useCallback((flowKey) => {
    const flow = flows.find(f => f.key === flowKey)
    if (flow) {
      window.location.href = flow.route
    }
  }, [flows])

  return { flows, activeFlow, switchFlow, prototypeName }
}
```

Return value shape:
- **`flows`** — Array of `{ key, name, title, route }` for all flows scoped to the current prototype. Empty when no `prototypeName` is available (e.g. at the root route).
- **`activeFlow`** — The current flow key from context (e.g. `"Signup/empty-form"`)
- **`switchFlow(flowKey)`** — Navigates to the given flow's route via `window.location.href`
- **`prototypeName`** — The current prototype name from context (e.g. `"Signup"`)

Flow titles are resolved from `getFlowMeta(key)?.title`, falling back to the flow's short name.

## Dependencies

- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — React context for `flowName` and `prototypeName`
- [`packages/core/src/loader.js`](../../../core/src/loader.js.md) — `getFlowsForPrototype` for listing flows scoped to a prototype, `getFlowMeta` for reading flow metadata, `resolveFlowRoute` for computing the navigation URL

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useFlows`
- [`packages/react/src/hooks/useFlows.test.js`](./useFlows.test.js.md) — Test file

## Notes

- `switchFlow` performs a full page navigation (`window.location.href`), not a React Router navigation, because flow switching may change the URL search params in ways that require a full reload of the provider.
- Returns an empty `flows` array when `prototypeName` is `null` — this is intentional for root-level pages that aren't inside a prototype.
- Throws if used outside `<StoryboardProvider>`.
