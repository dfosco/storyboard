---
"@dfosco/storyboard-core": patch
---

Fix iframe auto-mount cascade on canvas page load

- Replace double-mount-vulnerable canvasThemeInitRef with 3s mount-time guard
- Clear broken snapshot URLs from widget data on 404
- hasSnapRef defense-in-depth for stale closure protection
