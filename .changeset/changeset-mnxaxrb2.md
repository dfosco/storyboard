---
"@dfosco/storyboard-react": patch
---

Fix debug ESM/CJS interop: inject `debug` into Vite `optimizeDeps.include` via the storyboard-data plugin so consumer repos don't need manual vite.config.js changes.
