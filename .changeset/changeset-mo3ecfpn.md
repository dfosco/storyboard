---
"@dfosco/storyboard-core": minor
---

Port CommandPalette to @dfosco/storyboard-react, canvas UX improvements, and embed fixes

- Port CommandPalette from consumer app into @dfosco/storyboard-react so all consumers get it automatically
- Add Storyboard logo as homepage link on canvas pages
- Add canvas card Pages dropdown for multi-page canvases
- Add marquee multi-select drag on canvas background
- Add selected widgets bridge for Copilot context
- Add npm sync script for local library testing
- Convert single-page canvas to multi-page folder on add page
- Hide branch bar in prototype and story embeds via _sb_hide_branch_bar param
- Fix SidePanel offset to account for branch bar height
- Fix react-cmdk CJS/ESM compatibility and Vite pre-bundling
- Fix smooth-corners worklet registration for React canvas pages
- Remove deprecated .canvas.jsx companion support
