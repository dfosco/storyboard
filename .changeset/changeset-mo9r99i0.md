---
"@dfosco/storyboard-core": minor
---

Terminal widget expand/collapse fixes and persistence

- Fix expand: always render xterm container to prevent black screen on expand/collapse
- Auto-focus terminal and set interactive mode on expand
- Persist expanded state across page refreshes (URL hash)
- Store terminal widget's own props in config (agents can read prettyName, etc.)
- Use tmux session name as stable config lookup key
- Refresh terminal config on every canvas mutation
- Persist hide-chrome setting across page reloads
- Improve toolbar tooltip shortcut labels
- Command palette fixes (resilient config loading, empty state fix)
- Rename surfaces: main-toolbar → command-toolbar, command-list → command-palette
- BranchBar: blue accent, show on main in dev
- Show both proxy and localhost URLs on dev server start
- Change private image prefix from underscore to tilde (~)
- Unified config store for all storyboard configuration
- Enable folder grouping in all viewfinder nav views
- Auto-discover root toolbar.config.json for client-repo tool overrides
