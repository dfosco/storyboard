# `packages/react-primer/src/SceneDataDemo.jsx`

<!--
source: packages/react-primer/src/SceneDataDemo.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Demo component showcasing `useOverride()` and `useScene()`. Renders user data with inline override controls and a `StoryboardForm` for editing, demonstrating the full storyboard data override workflow.

## Composition

```jsx
export default function SceneDataDemo()
```

Displays overridable user fields (`name`, `username`, `bio`, `location`), scene switching, and an embedded form with [`TextInput`](TextInput.jsx.md), [`Textarea`](Textarea.jsx.md), and [`StoryboardForm`](StoryboardForm.jsx.md).

## Dependencies

- `@primer/react` — `Text`, `Button`, `ButtonGroup`, `FormControl`
- `@dfosco/storyboard-react` — `useOverride`, `useScene`
- [`./StoryboardForm.jsx`](StoryboardForm.jsx.md), [`./TextInput.jsx`](TextInput.jsx.md), [`./Textarea.jsx`](Textarea.jsx.md)
- `./SceneDebug.module.css`

## Dependents

- [`./index.js`](index.js.md) — re-exports as `SceneDataDemo`
