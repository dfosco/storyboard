---
"@dfosco/storyboard-core": patch
---

Fix react-dom version mismatch in ui-runtime bundle

- Use regex patterns for React externals to catch all subpath imports (`react-dom/client`, `react/jsx-runtime`, etc.)
- Prevents react-dom internals from being bundled, which caused a version mismatch crash and prevented the toolbar from mounting
- Bundle size reduced by ~900KB (2.6MB → 1.7MB)
