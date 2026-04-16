/**
 * Tests for iframe snapshot display — static thumbnail rendering.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PrototypeEmbed from './PrototypeEmbed.jsx'
import StoryWidget from './StoryWidget.jsx'

vi.mock('@dfosco/storyboard-core', () => ({
  buildPrototypeIndex: () => ({
    folders: [],
    prototypes: [
      {
        name: 'Design Overview',
        dirName: 'examples',
        isExternal: false,
        hideFlows: true,
        flows: [{ route: '/test', name: 'default', meta: { title: 'Design Overview' } }],
      },
    ],
    globalFlows: [],
    sorted: { title: { prototypes: [], folders: [] } },
  }),
  getStoryData: (storyId) => ({ _route: `/components/${storyId}` }),
}))

vi.mock('./WidgetWrapper.jsx', () => ({
  default: ({ children }) => <div data-testid="widget-wrapper">{children}</div>,
}))

vi.mock('@dfosco/storyboard-core/inspector/highlighter', () => ({
  createInspectorHighlighter: async () => ({
    codeToHtml: () => '<pre><code></code></pre>',
  }),
}))

vi.mock('./ResizeHandle.jsx', () => ({
  default: () => <div data-testid="resize-handle" />,
}))

describe('Snapshot display', () => {
  describe('PrototypeEmbed', () => {
    it('shows snapshot image when valid snapshot prop exists', () => {
      const { container } = render(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-abc123--latest.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('snapshot-proto-abc123--latest.webp')
      expect(img.alt).toContain('snapshot')
      // No iframe should be mounted
      expect(container.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('shows placeholder when no snapshot exists', () => {
      const { container } = render(
        <PrototypeEmbed
          id="proto-xyz"
          props={{ src: '/test', width: 400, height: 300, zoom: 100 }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(container.querySelector('img')).not.toBeInTheDocument()
      expect(container.querySelector('iframe')).not.toBeInTheDocument()
      expect(screen.getByText('Design Overview prototype')).toBeInTheDocument()
    })

    it('falls back to placeholder when snapshot image fails to load', () => {
      const { container } = render(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-abc123--latest.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()

      fireEvent.error(img)

      // After error, img should be gone and placeholder shown
      expect(container.querySelector('img')).not.toBeInTheDocument()
      expect(screen.getByText('Design Overview prototype')).toBeInTheDocument()
    })

    it('ignores snapshot that does not match widget ID', () => {
      const { container } = render(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshotLight: '/_storyboard/canvas/images/snapshot-other-widget--latest.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      // Should show placeholder, not the mismatched snapshot
      expect(container.querySelector('img')).not.toBeInTheDocument()
      expect(screen.getByText('Design Overview prototype')).toBeInTheDocument()
    })

    it('does not show snapshot for external URLs', () => {
      const { container } = render(
        <PrototypeEmbed
          id="proto-ext"
          props={{
            src: 'https://example.com',
            width: 400,
            height: 300,
            zoom: 100,
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-ext--latest.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      // External URLs should never show snapshots
      expect(container.querySelector('img')).not.toBeInTheDocument()
    })
  })

  describe('StoryWidget', () => {
    it('shows snapshot image when valid snapshot prop exists', () => {
      const { container } = render(
        <StoryWidget
          id="story-abc123"
          props={{
            storyId: 'button-patterns',
            exportName: 'Primary',
            width: 400,
            height: 300,
            snapshotLight: '/_storyboard/canvas/images/snapshot-story-abc123--latest.webp?v=456',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('snapshot-story-abc123--latest.webp')
      expect(container.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('shows placeholder when no snapshot exists', () => {
      const { container } = render(
        <StoryWidget
          id="story-xyz"
          props={{
            storyId: 'button-patterns',
            exportName: 'Primary',
            width: 400,
            height: 300,
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(container.querySelector('img')).not.toBeInTheDocument()
      expect(container.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('falls back to placeholder when snapshot image fails to load', () => {
      const { container } = render(
        <StoryWidget
          id="story-abc123"
          props={{
            storyId: 'button-patterns',
            exportName: 'Primary',
            width: 400,
            height: 300,
            snapshotLight: '/_storyboard/canvas/images/snapshot-story-abc123--latest.webp?v=456',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()

      fireEvent.error(img)

      // After error, img should be gone and placeholder shown
      expect(container.querySelector('img')).not.toBeInTheDocument()
    })
  })
})
