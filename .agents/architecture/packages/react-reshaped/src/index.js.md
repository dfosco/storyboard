# `packages/react-reshaped/src/index.js`

<!--
source: packages/react-reshaped/src/index.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Public entry point for `@dfosco/storyboard-react-reshaped`. Barrel file re-exporting storyboard-aware form components backed by the Reshaped design system — a Primer-free alternative for prototypes using Reshaped.

## Composition

```js
export { default as TextInput } from './TextInput.jsx'
export { default as Select } from './Select.jsx'
export { default as Checkbox } from './Checkbox.jsx'
export { default as Textarea } from './Textarea.jsx'
export { default as StoryboardForm } from './StoryboardForm.jsx'
```

Five named exports — mirrors the form subset of the [`react-primer`](../../react-primer/src/index.js.md) package (without ThemeSync or SceneDataDemo).

## Dependencies

- `./TextInput.jsx`, `./Select.jsx`, `./Checkbox.jsx`, `./Textarea.jsx`, `./StoryboardForm.jsx`

## Dependents

- `vite.config.js` — alias configuration
- No direct app imports currently (available for Reshaped-based prototypes).
