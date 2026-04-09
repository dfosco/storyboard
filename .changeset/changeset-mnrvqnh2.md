---
"@dfosco/storyboard-core": minor
---

Canvas editing improvements and image paste support

- Paste images directly onto the canvas — retina-aware sizing, privacy toggle, aspect-ratio-correct rendering
- Figma embed widget for pasted Figma URLs
- Persist viewport position (scroll x/y) and zoom across sessions via localStorage
- Per-client HMR guard — canvas pages suppress reloads while editing, other tabs unaffected
- Color picker renders below trigger with seamless hover bridge
- Widget toolbar improvements: Primer Tooltips, Octicon icons, ESC to deselect, open-in-new-tab for prototype embeds
- Fix: use relative imports for Vite plugins so worktrees load their own source
