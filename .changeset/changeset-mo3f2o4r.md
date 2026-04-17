---
"@dfosco/storyboard-core": patch
---

Auto-render BranchBar and AuthModal from StoryboardCommandPalette

- Port BranchBar and AuthModal from consumer app to @dfosco/storyboard-react
- StoryboardCommandPalette now auto-renders BranchBar and AuthModal
- Consumers mounting StoryboardCommandPalette get all three with zero extra setup
- Both components also exported standalone for custom usage
