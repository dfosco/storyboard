---
"@dfosco/storyboard-core": patch
---

Production mode simulation and canvas polish

- Add ?prodMode URL param and devtools toggle to simulate production rendering in dev
- Add gridSize edge padding to canvas boundary
- Faster multi-drag peer transition (150ms duration + 50ms delay)
- Canvas title renders as static h1 in prod (no hover/edit)
- Default cursor on all widgets in prod/locked mode
- Markdown widgets: text selection and copy works in prod, edit mode disabled
