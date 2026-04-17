---
"@dfosco/storyboard-core": patch
---

Fix iframe auto-mount when snapshot images are missing from disk

- Use ref to check hasSnap at callback time instead of stale closure value
- Prevents 404'd snapshots from triggering iframe mount cascade
