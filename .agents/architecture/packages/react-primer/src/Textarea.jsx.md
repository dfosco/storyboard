# `packages/react-primer/src/Textarea.jsx`

<!--
source: packages/react-primer/src/Textarea.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Primer Textarea wrapper that integrates with [`StoryboardForm`](StoryboardForm.jsx.md). Buffers values locally inside a form, behaves as a normal controlled Primer Textarea outside.

## Composition

```jsx
export default function Textarea({ name, onChange, value: controlledValue, ...props })
```

Same `FormContext` + `useOverride` pattern as [`TextInput`](TextInput.jsx.md) and other form wrappers.

## Dependencies

- `@primer/react` — `Textarea` (as `PrimerTextarea`)
- `@dfosco/storyboard-react` — `FormContext`, `useOverride`

## Dependents

- [`./index.js`](index.js.md) — re-exports as `Textarea`
- [`./SceneDataDemo.jsx`](SceneDataDemo.jsx.md) — used in demo form
