---
"@dfosco/storyboard-core": patch
---

Sequential iframe queue for canvas embeds and CI snapshot generation

- Canvas embeds without snapshots now load one at a time via a sequential queue, preventing browser jams
- Snapshot generation moved to CI with stable naming and dirty detection
- Undo history cap reverted to 100
