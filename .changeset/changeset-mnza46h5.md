---
"@dfosco/storyboard-core": patch
---

Fix story code view loading stuck in production builds

- Fix source code loading effect getting stuck on "Loading…" under StrictMode double-mount
- Install playwright as local devDependency for snapshot generation
