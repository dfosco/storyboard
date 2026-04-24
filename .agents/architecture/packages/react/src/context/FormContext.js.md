# `packages/react/src/context/FormContext.js`

<!--
source: packages/react/src/context/FormContext.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React context for passing form state from `<StoryboardForm>` to child input components. Provides a data path prefix and draft read/write functions.

## Composition

```js
export const FormContext = createContext(null)
```

**Expected value shape:**
```js
{ prefix: string, getDraft: (name) => any, setDraft: (name, value) => void }
```

## Dependencies

- `react` (createContext)

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports
- `src/components/StoryboardForm/`, `src/components/TextInput/`, `src/components/Textarea/`
- `packages/react-primer/src/` (Checkbox, Select, TextInput, Textarea, StoryboardForm)
- `packages/react-reshaped/src/` (Checkbox, Select, TextInput, Textarea, StoryboardForm)
