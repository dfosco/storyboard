---
"@dfosco/storyboard-core": major
---

CLI update commands and dev domain config

- **CLI update channels** — `storyboard update`, `update:beta`, `update:alpha`, and `update:<version>` shorthand
- **Dev domain config** — `devDomain` key in storyboard.config.json to customize dev server domain
- **Fix** — route any `update:*` command correctly instead of showing "Unknown command"
