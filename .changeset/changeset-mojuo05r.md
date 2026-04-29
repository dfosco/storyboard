---
"@dfosco/storyboard-core": patch
---

Fix command palette empty sections in consumer apps

- Convert mountStoryboardCore singleton imports to @dfosco/storyboard-core self-reference
- Export initCommandPaletteConfig and consumeClientToolbarOverrides from barrel
- Fixes command palette showing "No results found" due to singleton state split between prebundled and source module instances
