---
"@dfosco/storyboard-core": patch
---

Fix ghostty-web import crash for consumers without the package

- Add @vite-ignore to dynamic import to prevent Vite pre-transform errors
- Catch import failures gracefully instead of crashing
- Declare ghostty-web as optional peerDependency
