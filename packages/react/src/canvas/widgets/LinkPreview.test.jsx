import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LinkPreview from './LinkPreview.jsx'

describe('LinkPreview', () => {
  it('renders GitHub issue card with markdown body and author byline', () => {
    const { container } = render(
      <LinkPreview
        id="link-1"
        props={{
          url: 'https://github.com/dfosco/storyboard/issues/42',
          title: '#42 Ship GitHub embeds',
          github: {
            context: 'GitHub · dfosco/storyboard · Issue #42',
            body: '## Summary\n\nThis is a **bold** point.\n\n- Item one\n- Item two',
            authors: ['dfosco'],
            createdAt: '2026-01-01T00:00:00Z',
          },
        }}
      />,
    )

    // Title split: text + muted number
    expect(screen.getByText('Ship GitHub embeds')).toBeInTheDocument()
    expect(screen.getByText('#42')).toBeInTheDocument()

    // Markdown body renders headings, bold, lists
    const headings = container.querySelectorAll('h2')
    expect(headings.length).toBeGreaterThanOrEqual(1)
    // Find the body heading (not the title)
    const summaryHeading = Array.from(headings).find(h => h.textContent === 'Summary')
    expect(summaryHeading).toBeTruthy()
    expect(container.querySelectorAll('li')).toHaveLength(2)

    // Author byline
    expect(screen.getByText('dfosco')).toBeInTheDocument()
  })

  it('does not render GitHub layout for non-GitHub links', () => {
    render(
      <LinkPreview
        id="link-2"
        props={{
          url: 'https://example.com/docs',
          title: 'Example docs',
        }}
      />,
    )

    expect(screen.getByText('Example docs')).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()
  })

  it('renders plain link-preview without github data', () => {
    const { container } = render(
      <LinkPreview
        id="link-3"
        props={{
          url: 'https://figma.com/design/abc',
          title: 'My design',
          width: 320,
          height: 120,
        }}
      />,
    )

    expect(screen.getByText('My design')).toBeInTheDocument()
    // No issue card rendered
    expect(container.querySelector('header')).toBeNull()
  })
})
