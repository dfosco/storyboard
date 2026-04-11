---
"@dfosco/storyboard-core": minor
---

Config-driven widget resize and dark mode fix

- Widget resize is now controlled via `resize: { enabled, prod }` in widgets.config.json
- New `isResizable(type)` helper respects config + build environment + mutability
- Fix: select handle now shows correct accent color in dark mode
