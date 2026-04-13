---
"@dfosco/storyboard-core": patch
---

Fix debug ESM/CJS interop error in dev mode.

- fix: add `debug` to Vite `optimizeDeps.include` so micromark's development build resolves correctly
