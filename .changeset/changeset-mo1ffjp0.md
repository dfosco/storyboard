---
"@dfosco/storyboard-core": patch
---

Flash-free snapshot hotswap with dual-theme layering

- Both themed snapshot images always in DOM, CSS-swapped for instant theme switching
- Iframe stays mounted until snapshots captured and preloaded — no flash on exit
- Intermediate snapshot publish before alt-theme capture prevents placeholder flash
- Shared resolveCanvasTheme() fixes StoryWidget theme resolution
- Exit session tracking prevents stale capture callbacks from closing reopened iframes
