# `packages/react-primer/src/SceneDebug.jsx`

<!--
source: packages/react-primer/src/SceneDebug.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Debug component that displays loaded flow data as formatted JSON. Used to verify the flow loader is working correctly. Reads flow name from `?flow=` (or `?scene=` alias) URL param, a prop, or defaults to `"default"`.

## Composition

```jsx
export default function SceneDebug({ flowName, sceneName } = {})
```

Uses `useMemo` to call `loadFlow()` once per active flow name. Renders error state or a `<pre>` block with `JSON.stringify` output.

## Dependencies

- `react-router-dom` — `useSearchParams`
- `@primer/react` — `Text`
- `@dfosco/storyboard-core` — `loadFlow`
- `./SceneDebug.module.css`

## Dependents

- Not currently re-exported from [`./index.js`](index.js.md) or imported elsewhere. Available as an internal debugging utility.
