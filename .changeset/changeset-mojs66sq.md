---
"@dfosco/storyboard-core": patch
---

Fix singleton state split in tool handlers

- Tool handlers (canvasAgents, featureFlags, canvasToolbar, devtools, flows) now import from `@dfosco/storyboard-core` instead of relative paths
- Prevents Vite from creating separate module instances when pre-bundling, which caused configStore to appear empty in the toolbar (no agent tool, empty command palette)
