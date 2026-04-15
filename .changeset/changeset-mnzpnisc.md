---
"@dfosco/storyboard-core": patch
---

Remove local snapshot generation from scaffold pre-push hook

- Scaffold pre-push hook still had stage_snapshots in STAGES array, causing client repos to run local snapshot generation on push
- Snapshot generation is now CI-only via snapshots.yml workflow
