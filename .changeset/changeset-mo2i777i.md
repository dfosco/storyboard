---
"@dfosco/storyboard-core": minor
---

Remove snapshot capture system — iframes load directly like pre-beta.24

- Removed useSnapshotCapture, refreshQueue, theme-change auto-refresh
- 741 → 421 lines in PrototypeEmbed (320 lines of complexity removed)
- Eliminates iframe auto-mount cascades, re-render storms, and capture timeouts
- Prototype embeds now load instantly on click with no intermediate states
