---
"@dfosco/storyboard-core": minor
---

Multi-widget operations, PageSelector improvements, and branch deploy fixes

- Multi-widget copy/paste on canvas
- Add "Add new page" action to canvas PageSelector dropdown
- Consolidate PAT auth into single React modal
- Add agent-browser, ship, and canvas skills to scaffolding
- Rename ViewfinderNew to Viewfinder
- Use relative paths for font URLs (fixes 502 on branch deploys)
- Offset canvas elements and viewfinder sidebar for BranchBar height
- Respect `disabled: true` in toolbar tool config
- Fix viewfinder sidebar styling (remove blue links, snap footer)
- Add direct Cmd+K listener for command palette
- Run npm install at end of storyboard setup
- Fix switch-branch proxy port derivation and BranchBar body padding
- Detect port collisions across repos in getPort
