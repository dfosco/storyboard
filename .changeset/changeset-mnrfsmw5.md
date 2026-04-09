---
"@dfosco/storyboard-core": minor
---

Widget Chrome API & Canvas Interaction Overhaul

- Config-driven widget chrome toolbar with hover trigger dot, feature buttons, and select handle
- Select handle is the only drag source — click/double-click never triggers drag
- Drag gate with 150ms delay + 8px distance threshold (bypasses neodrag's broken distance calc for positioned elements)
- StickyNote color picker and PrototypeEmbed zoom/edit controls extracted into chrome toolbar
- JSX source blocks wrapped in Component widget chrome with resize support
- ComponentWidget double-click-to-interact overlay for stateful markup
- Prototype embed URL matching supports branch deploy prefixes
- Vite alias for tiny-canvas source resolution
- widgets.config.json as single source of truth for widget definitions
