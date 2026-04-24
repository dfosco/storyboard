# `packages/react-primer/src/index.js`

<!--
source: packages/react-primer/src/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Public entry point for the `@dfosco/storyboard-react-primer` package. This barrel file re-exports every storyboard-aware form component backed by Primer React, plus the ThemeSync bridge and the SceneDataDemo widget. Consumers import from the package root and get all Primer-flavored storyboard UI in one import.

The file defines the package's public API surface — anything not exported here is considered internal. DevTools is intentionally omitted from this barrel (it lives at a sub-path and is not part of the default export).

## Composition

```js
// Storyboard form wrappers (Primer-backed)
export { default as TextInput } from './TextInput.jsx'
export { default as Select } from './Select.jsx'
export { default as Checkbox } from './Checkbox.jsx'
export { default as Textarea } from './Textarea.jsx'
export { default as StoryboardForm } from './StoryboardForm.jsx'

// Theme bridge
export { default as ThemeSync } from './ThemeSync.jsx'

// Scene data demo
export { default as SceneDataDemo } from './SceneDataDemo.jsx'
```

Seven named exports total — five form components, one theme bridge, one demo widget.

## Dependencies

- [`./TextInput.jsx`](TextInput.jsx.md)
- [`./Select.jsx`](Select.jsx.md)
- [`./Checkbox.jsx`](Checkbox.jsx.md)
- [`./Textarea.jsx`](Textarea.jsx.md)
- [`./StoryboardForm.jsx`](StoryboardForm.jsx.md)
- [`./ThemeSync.jsx`](ThemeSync.jsx.md)
- [`./SceneDataDemo.jsx`](SceneDataDemo.jsx.md)

## Dependents

- `src/index.jsx` — app root imports from `@dfosco/storyboard-react-primer`
- `src/prototypes/main.folder/Example/Forms.jsx` — example prototype page
- `vite.config.js` — alias configuration
