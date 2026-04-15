---
"@dfosco/storyboard-core": patch
---

Dev logs toggle, click-to-jump-queue, and scaffold workflow fixes

- Dev Logs toggle in Devtools toolbar — logs iframe queue and snapshot state transitions (gated behind feature flag)
- Clicking to interact on a queued embed now immediately starts its iframe and releases the queue slot
- Scaffold now includes preview.yml and snapshots.yml workflows for client repos
- Scaffold workflows updated to match client repo patterns (actions v6, node 22, .nojekyll)
