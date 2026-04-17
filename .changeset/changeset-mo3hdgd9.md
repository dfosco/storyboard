---
"@dfosco/storyboard-core": minor
---

Config restructuring and theme fixes

- Extract commandPalette config into standalone commandpalette.config.json (like toolbar.config)
- Add customerMode config object to storyboard.config.json
- Canvas theme variables for all Primer themes including high contrast
- Fix command palette dark mode rendering on light theme
- Migrate AuthModal to BaseUI Dialog with Primer theme support
- Fix CoreUIBar visible state sync when chrome-hidden toggled externally
- Fix smooth-corners CSS variable alignment with paint worklet
