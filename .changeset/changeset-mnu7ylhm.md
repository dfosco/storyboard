---
"@dfosco/storyboard-core": patch
---

Fix multi-select drag on canvas

- Any selected widget can now serve as the drag handler for the entire group
- Peers animate to new positions on drag end via delayed CSS transition
- Selection is preserved during and after drag (no longer collapses on click)
- Mixed selections of JSON + JSX component widgets now move together
