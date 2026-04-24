# `packages/react-primer/src/Select.jsx`

<!--
source: packages/react-primer/src/Select.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Primer Select wrapper that integrates with [`StoryboardForm`](StoryboardForm.jsx.md). Inside a form, values are buffered locally and flushed on submit. Outside a form, behaves as a normal controlled Primer Select.

## Composition

```jsx
export default function Select({ name, onChange, value: controlledValue, children, ...props })
```

Follows the same `FormContext` + `useOverride` pattern as other form wrappers. Forwards Primer's static sub-components:

```js
Select.Option = PrimerSelect.Option
```

## Dependencies

- `@primer/react` — `Select` (as `PrimerSelect`)
- `@dfosco/storyboard-react` — `FormContext`, `useOverride`

## Dependents

- [`./index.js`](index.js.md) — re-exports as `Select`
