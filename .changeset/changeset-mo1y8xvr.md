---
"@dfosco/storyboard-core": patch
---

Canvas JSONL compaction to prevent performance degradation

- `storyboard compact` command to compact bloated canvas JSONL files
- Auto-compacts on `storyboard dev` startup and every 15 minutes
- Threshold: 500KB — eliminates redundant `widgets_replaced` history
