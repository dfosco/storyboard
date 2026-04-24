# `packages/react-primer/src/Checkbox.jsx`

<!--
source: packages/react-primer/src/Checkbox.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Primer Checkbox wrapper that integrates with [`StoryboardForm`](StoryboardForm.jsx.md). Inside a form, values are buffered as local draft state and flushed on submit. Stores `"true"`/`"false"` strings in the URL hash.

## Composition

```jsx
export default function Checkbox({ name, onChange, checked: controlledChecked, ...props })
```

Uses `FormContext` to detect if inside a `StoryboardForm`. When connected, subscribes to form draft updates and syncs initial session value on mount. Falls back to `controlledChecked` when standalone.

## Dependencies

- `@primer/react` — `Checkbox` (as `PrimerCheckbox`)
- `@dfosco/storyboard-react` — `FormContext`, `useOverride`

## Dependents

- [`./index.js`](index.js.md) — re-exports as `Checkbox`
