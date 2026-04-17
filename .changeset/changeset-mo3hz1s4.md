---
"@dfosco/storyboard-core": patch
---

Fix React BranchBar showing in prototype embeds on branch deploys

- Hide React BranchBar when `_sb_embed` or `_sb_hide_branch_bar` query params are present
- Brings React BranchBar to parity with the Svelte BranchBar embed checks
