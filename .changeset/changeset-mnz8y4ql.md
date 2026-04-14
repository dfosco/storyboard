---
"@dfosco/storyboard-core": minor
---

Mobile experience and canvas improvements

- **Mobile toolbar**: On viewports narrower than 500px, main-toolbar tools move into the ⌘ command menu (flows, theme, comments, inspector). Canvas toolbar stays visible.
- **Pinch-to-zoom on canvas**: Two-finger pinch gesture zooms canvas widgets on mobile. Browser-level zoom is disabled so only the canvas responds.
- **Pull-to-refresh prevention**: Added `overscroll-behavior-y: contain` to prevent pull-to-refresh interference.
- **PWA install prompt**: Mobile-only "Add to Home Screen" banner using `beforeinstallprompt` API with localStorage dismiss.
- **Canvas viewport persistence**: Zoom level and scroll position saved per-canvas in localStorage, with time-gated restore (15 min) and zoom-to-fit fallback.
- **Figma embed snapshots**: Canvas Figma embeds now generate preview snapshots.
- **Snapshots CLI**: New `storyboard snapshots` command for batch canvas preview generation.
- **Setup improvements**: `storyboard setup` now scaffolds git hooks and installs Playwright for snapshot generation.
- **Story source in prod**: Deploy story source as JSON endpoint for production builds.
