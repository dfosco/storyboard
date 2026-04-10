---
"@dfosco/storyboard-core": patch
---

Canvas expand modal, multi-select, and drag improvements

- feat: expand modal for prototype and figma embed widgets — iframe reparenting via moveBefore() for instant expand without reload
- feat: multi-select for canvas widgets with shift-click support
- feat: drag surface and improved widget selection UX
- feat: prod flag system for toolbar tool features
- fix: viewfinder FOUC from duplicate async CSS loading paths
- fix: drag boundary flicker eliminated via neodrag transform callback
- fix: canvas stuck on loading in production builds
- fix: drag handle detection supports multi-handle selectors
- fix: select handle uses onClick, better drag/select distinction
- fix: solid outline for multi-selected widgets
