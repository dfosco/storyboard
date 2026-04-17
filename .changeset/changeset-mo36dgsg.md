---
"@dfosco/storyboard-core": patch
---

Fix client build error caused by svelte/store imports in core stores

- Replace svelte/store dependency in themeStore and sidePanelStore with inline framework-agnostic writable implementation
