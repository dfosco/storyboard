---
"@dfosco/storyboard-core": minor
---

Remove Svelte BranchBar, auto-render React CommandPalette from StoryboardProvider

- Delete BranchBar.svelte — moving toward React-only architecture
- CommandPalette (including BranchBar) now auto-renders from StoryboardProvider
- Client repos no longer need to manually import BranchBar or CommandPalette
