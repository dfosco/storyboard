# `packages/react-primer/src/TextInput.jsx`

<!--
source: packages/react-primer/src/TextInput.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Primer TextInput wrapper that integrates with [`StoryboardForm`](StoryboardForm.jsx.md). Buffers values locally inside a form and uses session values as initial defaults. Outside a form, behaves as a normal controlled Primer TextInput.

## Composition

```jsx
export default function TextInput({ name, onChange, value: controlledValue, ...props })
```

Same `FormContext` + `useOverride` pattern as [`Textarea`](Textarea.jsx.md), [`Select`](Select.jsx.md), and [`Checkbox`](Checkbox.jsx.md).

## Dependencies

- `@primer/react` — `TextInput` (as `PrimerTextInput`)
- `@dfosco/storyboard-react` — `FormContext`, `useOverride`

## Dependents

- [`./index.js`](index.js.md) — re-exports as `TextInput`
- [`./SceneDataDemo.jsx`](SceneDataDemo.jsx.md) — used in demo form
