---
"@dfosco/storyboard-core": patch
---

Performance: eliminate zoom re-render cascade and optimize snapshot capture

- Replace `flushSync(setZoom)` with imperative DOM mutation for smooth canvas zoom
- Pipeline dual-theme snapshot capture with non-blocking widget exit
- Memoize widget subtrees to prevent unnecessary re-renders
- Reduce snapshot pixelRatio from 2→1 for faster captures
