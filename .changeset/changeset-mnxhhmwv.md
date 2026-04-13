---
"@dfosco/storyboard-core": patch
---

Canvas dark mode fixes, widget menu alignment, and HMR reliability improvements.

- ComponentWidget now uses theme background color in dark mode
- Overflow menu properly aligned to button edge
- Fix nested $variable resolution in dropdown alt labels
- Canvas file changes correctly invalidate for fresh page loads
- Suppress noisy console errors (branches.json, smooth-corners)
