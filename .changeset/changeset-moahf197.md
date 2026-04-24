---
"@dfosco/storyboard-core": minor
---

Expandable widgets, split-screen, agent system, and command palette overhaul

- Expandable modals for markdown and GitHub embed widgets (matching prototype/figma behavior)
- Split-screen mode: connected widget pairs render side-by-side fullscreen with shared top bar, focus tracking, and x-coordinate ordering
- Agent widget system with canvas toolbar integration, add-agent menu, and config-driven visibility
- React Icon component supporting Primer Octicons, Feather, and Iconoir icon sources
- Command palette rebuilt with cmdk (React 19 compatible), with icons and improved search
- Terminal widget fixes: font-size scaling, non-resizable mode, viewport scroll prevention
- Undo/redo fix: HMR echo no longer resets the history stack
