---
"@dfosco/storyboard-core": minor
---

useFlowData optional flag, advanced copy-paste, and workshop branch-deploy fixes

- feat: add { optional } flag to useFlowData to suppress missing-path warnings
- feat: advanced copy-paste with canvasName/widgetId clipboard format
- fix: workshop create forms now work on branch deploys (use __STORYBOARD_BASE_PATH__)
- fix: snap-to-grid race condition between React and Svelte toolbar
- fix: sync snapToGrid and gridSize when canvas data loads
- fix: elevate stacking context of hovered/selected canvas widgets
- refactor: remove redundant Shift+C shortcut
