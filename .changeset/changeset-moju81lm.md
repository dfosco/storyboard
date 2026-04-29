---
"@dfosco/storyboard-core": patch
---

Fix singleton state split in dynamically-loaded components

- Convert relative imports in CanvasAgentsMenu, CanvasCreateMenu, ActionMenuButton, CreateMenuButton, ThemeMenuButton, and handler modules (comments, devtools, paletteTheme) to use `@dfosco/storyboard-core` self-reference
- Fixes agent tool button not rendering despite guard passing, and command palette showing empty results in consumer apps
