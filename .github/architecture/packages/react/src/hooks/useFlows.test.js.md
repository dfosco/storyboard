# `packages/react/src/hooks/useFlows.test.js`

<!--
source: packages/react/src/hooks/useFlows.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Test suite for the [`useFlows`](./useFlows.js.md) hook and the core `getFlowsForPrototype` utility. Validates prototype-scoped flow listing, flow metadata resolution, and hook behavior inside and outside `<StoryboardProvider>`. Uses `@testing-library/react`'s `renderHook` with a custom wrapper that provides `StoryboardContext` directly (no router needed).

The tests cover both the low-level core function (`getFlowsForPrototype`) and the React hook (`useFlows`) to ensure the full data path from init to hook output is correct.

## Composition

**Test data setup:**

```js
const SCOPED_FLOWS = {
  'default': { meta: { title: 'Default' } },
  'Signup/empty-form': { meta: { title: 'Empty Form' }, _route: '/Signup' },
  'Signup/validation-errors': { meta: { title: 'Validation Errors' }, _route: '/Signup' },
  'Signup/prefilled-review': { meta: { title: 'Prefilled Review' }, _route: '/Signup' },
  'Signup/error-state': { meta: { title: 'Error State' }, _route: '/Signup' },
  'Example/basic': { meta: { title: 'Example Data Flow' }, _route: '/Example' },
}

function seedScopedData() {
  init({ flows: SCOPED_FLOWS, objects: {}, records: {} })
}
```

**`getFlowsForPrototype` tests** (7 cases):
- Returns flows scoped to a prototype with correct names and keys
- Returns empty for nonexistent, null, or empty-string prototypes
- Excludes global flows (no prototype prefix)
- Handles prototypes with a single flow

**`useFlows` hook tests** (7 cases):
- Returns flows with correct titles from metadata
- Returns the active flow key from context
- Returns `prototypeName` from context
- Returns empty flows when no prototype
- `switchFlow` is a function
- Flow titles include all scoped flow titles
- Throws when used outside `<StoryboardProvider>`

**Custom wrapper pattern:**

```js
function createWrapperWithPrototype(flowName = 'default', prototypeName = null) {
  return function Wrapper({ children }) {
    return createElement(
      StoryboardContext.Provider,
      { value: { data: {}, error: null, loading: false, flowName, sceneName: flowName, prototypeName } },
      children,
    )
  }
}
```

## Dependencies

- [`packages/react/src/hooks/useFlows.js`](./useFlows.js.md) — The hook under test
- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — Context provider used in wrapper
- [`packages/core/src/loader.js`](../../../core/src/loader.js.md) — `init`, `getFlowsForPrototype` for data seeding and direct testing
- `@testing-library/react` — `renderHook` for hook testing

## Dependents

None (test file).
