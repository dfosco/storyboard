# `packages/react-reshaped/package.json`

<!--
source: packages/react-reshaped/package.json
category: config
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

Package manifest for `@dfosco/storyboard-react-reshaped` — a thin integration layer that bridges Storyboard's React hooks with the Reshaped UI library. It mirrors the component set of [`@dfosco/storyboard-react-primer`](../react-primer/package.json.md) but renders using Reshaped primitives instead of Primer. Provides `StoryboardForm`, `TextInput`, `Select`, `Checkbox`, and `Textarea` components.

## Composition

### Identity

- **name:** `@dfosco/storyboard-react-reshaped`
- **version:** `4.2.0-beta.17`
- **type:** `module`
- **license:** MIT

### Exports Map

```json
"exports": {
    ".": "./src/index.js"
}
```

### Dependencies

```json
"dependencies": {
    "@dfosco/storyboard-react": "4.2.0-beta.17"
}
```

### Peer Dependencies

```json
"peerDependencies": {
    "reshaped": ">=3",
    "react": ">=18"
}
```

### Published Files

```json
"files": ["src"]
```

Source is shipped directly — no build step.

## Dependencies

- [`@dfosco/storyboard-react`](../react/package.json.md) — core React hooks and providers

## Dependents

- [`vite.config.js`](../../vite.config.js.md) — aliases `@dfosco/storyboard-react-reshaped` to local source
- Currently referenced in `DOCS.md` but has minimal direct usage in the app's prototypes

## Notes

- This is the Reshaped counterpart to [`@dfosco/storyboard-react-primer`](../react-primer/package.json.md). Both adapters share the same API surface but render with different UI libraries.
