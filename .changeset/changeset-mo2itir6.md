---
"@dfosco/storyboard-core": patch
---

Remove all snapshot code from StoryWidget, fix prototype titles

- StoryWidget cleaned of snapshot system (490 → 276 lines)
- Prototype titles show "PrototypeName · FlowName" instead of URLs
- Removed refresh-thumbnail action from prototype and story configs
- Deleted useSnapshotCapture.js and refreshQueue.js
