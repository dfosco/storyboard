# `packages/react-primer/package.json`

<!--
source: packages/react-primer/package.json
category: config
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

Package manifest for `@dfosco/storyboard-react-primer` — a thin integration layer that bridges Storyboard's React hooks with GitHub's Primer Design System. It provides Primer-specific form components (`TextInput`, `Select`, `Checkbox`, `Textarea`), `ThemeSync` for Primer ↔ Storyboard theme coordination, `SceneDebug` for development inspection, and `StoryboardForm` using Primer's form primitives.

This package exists so that `@dfosco/storyboard-react` stays UI-library-agnostic — Primer-specific components are isolated here.

## Composition

### Identity

- **name:** `@dfosco/storyboard-react-primer`
- **version:** `4.2.0-beta.17`
- **type:** `module`
- **license:** MIT

### Exports Map

```json
"exports": {
    ".": "./src/index.js"
}
```

Single entry point re-exporting all Primer-integrated components.

### Dependencies

```json
"dependencies": {
    "@dfosco/storyboard-react": "4.2.0-beta.17"
}
```

Depends on the base React package for hooks (`useFlowData`, `useOverride`, etc.).

### Peer Dependencies

```json
"peerDependencies": {
    "@primer/react": ">=37",
    "react": ">=18"
}
```

Consumers must provide Primer React and React themselves.

### Published Files

```json
"files": ["src"]
```

Source is shipped directly — no build step.

## Dependencies

- [`@dfosco/storyboard-react`](../react/package.json.md) — core React hooks and providers

## Dependents

- [`src/index.jsx`](../../src/index.jsx.md) — imports `ThemeSync`
- `src/prototypes/main.folder/Example/Forms.jsx` — imports Primer form components
- [`vite.config.js`](../../vite.config.js.md) — aliases `@dfosco/storyboard-react-primer` to local source

## Notes

- This is a UI-library adapter — the equivalent for Reshaped is [`@dfosco/storyboard-react-reshaped`](../react-reshaped/package.json.md). Both depend on `@dfosco/storyboard-react` and provide parallel component sets.
