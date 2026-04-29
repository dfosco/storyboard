---
"@dfosco/storyboard-core": patch
---

Fix React.createElement not defined in ui-runtime

- Remove obsolete Svelte plugin from ui build config
- Add `esbuild.jsx: 'automatic'` to use the React automatic JSX runtime
- Eliminates 647 `React.createElement` calls that referenced an undefined `React` global
