---
"@dfosco/storyboard-core": minor
---

GitHub embeds, canvas snapshot improvements, and story route cleanup

- **feat:** GitHub embed hydration — paste issue/PR/discussion/comment URLs for rich cards with full markdown, signed images, videos, author avatars
- **feat:** Collapse/expand height for GitHub embeds with viewport pan
- **feat:** Title bar with GitHub mark icon, clickable title and author links
- **feat:** Pull Request URL support for embeds
- **feat:** Widget chrome actions — refresh data, open in new tab, copy markdown
- **feat:** Canvas embed snapshot wave-refresh with theme-aware captures
- **feat:** Keep Figma embeds alive for 2min after deselect
- **fix:** Signed image URLs via body_html (JWT tokens, no broken proxy)
- **fix:** Video blinking, checkbox accent color, clickable links in body
- **refactor:** Strip layout chrome from story routes
