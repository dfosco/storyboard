---
"@dfosco/storyboard-core": patch
---

Externalize React from ui-runtime bundle

- Add `react`, `react-dom`, `react/jsx-runtime`, and `react/jsx-dev-runtime` to Rollup externals in `vite.ui.config.js`
- Fixes `Uncaught ReferenceError: React is not defined` when consuming `storyboard-ui.js` in Vite ESM dev server
