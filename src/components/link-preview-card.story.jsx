/**
 * LinkPreviewCard stories.
 * Each named export becomes a draggable widget on the canvas.
 */
import LinkPreviewCard from './LinkPreviewCard.jsx'

export function Default() {
  return (
    <LinkPreviewCard
      title="core"
      url="https://tangled.org/core"
      domain="tangled.org"
      domainIcon="⚙️"
      stats={{ stars: 799, pulls: 68, issues: 199 }}
      date="23 Feb 2025"
    />
  )
}

export function WithOgImage() {
  return (
    <LinkPreviewCard
      title="dev.css"
      url="https://devins.page/dev-css"
      domain="devins.page"
      domainIcon="🐸"
      ogImage="https://picsum.photos/320/280"
      stats={{ stars: 22, pulls: 0, issues: 4 }}
      date="26 Jan 2026"
    />
  )
}

export function MinimalLink() {
  return (
    <LinkPreviewCard
      title="Example Project"
      url="https://example.com/project"
      ogEmoji="📦"
    />
  )
}
