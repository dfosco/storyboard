# `packages/react/src/hooks/useFlows.test.js`

<!--
source: packages/react/src/hooks/useFlows.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`useFlows`](./useFlows.js.md) and the underlying `getFlowsForPrototype` core utility. Verifies prototype-scoped flow listing, flow metadata enrichment, and error handling.

## Composition

- `getFlowsForPrototype` returns flows scoped to a prototype, excludes global flows, handles null/empty/nonexistent prototypes
- `useFlows` returns flows for current prototype from context, exposes `activeFlow`, `prototypeName`, `switchFlow`
- Flow entries include `title` from meta
- Throws when used outside `<StoryboardProvider>`

## Dependencies

- [`useFlows.js`](./useFlows.js.md), [`StoryboardContext`](../StoryboardContext.js.md), `@dfosco/storyboard-core`

## Dependents

None (test file).
