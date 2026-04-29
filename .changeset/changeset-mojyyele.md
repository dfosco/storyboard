---
"@dfosco/storyboard-core": patch
"@dfosco/storyboard-react": patch
---

Id-based array merge for config + remove scaffold config files

- `deepMergeBuild` now merges arrays of objects by `id` field instead of replacing wholesale
- Users can customize command palette sections by defining only the ones they want to add/override
- Removed `commandpalette.config.json` and `toolbar.config.json` from scaffold — they caused empty arrays to overwrite core defaults
