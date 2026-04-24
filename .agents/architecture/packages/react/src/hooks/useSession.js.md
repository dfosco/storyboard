# `packages/react/src/hooks/useSession.js`

<!--
source: packages/react/src/hooks/useSession.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Deprecated re-export of [`useOverride`](./useOverride.js.md) under the old name `useSession`. Exists solely for backwards compatibility.

## Composition

```js
export { useOverride as useSession } from './useOverride.js'
```

## Dependencies

- [`hooks/useOverride.js`](./useOverride.js.md)

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — also re-exports `useSession` directly from `useOverride.js`
