---
"@dfosco/storyboard-core": minor
---

Widget URLs, overflow menu, and config-driven widget tools

- Each widget has a unique URL (?widget=id) that centers the viewport on load
- Widget toolbar "..." overflow menu with "Copy link to widget" and "Delete widget"
- Widget tools (icons, labels, menu placement) fully driven by widgets.config.json
- Config variables system ($label:duplicate, etc.) for shared text
- Fix: comment deep links (?comment=id) now open the comment box on cache hit
- Prototype embed navigation persisted with undo/redo support
