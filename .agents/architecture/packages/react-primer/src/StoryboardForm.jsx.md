# `packages/react-primer/src/StoryboardForm.jsx`

<!--
source: packages/react-primer/src/StoryboardForm.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Form wrapper that buffers child input values locally and only persists them to the URL hash on submit. The `data` prop sets the root path — child inputs read/write draft state while typing, then flush `data.name` params on submission.

## Composition

```jsx
export default function StoryboardForm({ data, onSubmit, children, ...props })
```

Provides a `FormContext.Provider` with `{ prefix, getDraft, setDraft, subscribe }`. On submit, flushes all drafts via `setParam` (normal mode) or `setShadow` (hide mode, checked via `isHideMode()`).

## Dependencies

- `@dfosco/storyboard-react` — `FormContext`
- `@dfosco/storyboard-core` — `setParam`, `isHideMode`, `setShadow`

## Dependents

- [`./index.js`](index.js.md) — re-exports as `StoryboardForm`
- [`./SceneDataDemo.jsx`](SceneDataDemo.jsx.md) — uses as form container
