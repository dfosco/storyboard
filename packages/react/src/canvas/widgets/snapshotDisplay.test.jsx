/**
 * Tests for iframe snapshot display — layered dual-theme rendering.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, waitFor, act } from '@testing-library/react'
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
}), { virtual: true })

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
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-abc123--light.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('snapshot-proto-abc123--light.webp')
      expect(img.alt).toContain('snapshot')
      expect(container.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('switches snapshot src on theme change', async () => {
      const { container } = render(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-abc123--light.webp?v=1',
            snapshotDark: '/_storyboard/canvas/images/snapshot-proto-abc123--dark.webp?v=1',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('--light.webp')

      act(() => {
        document.dispatchEvent(new CustomEvent('storyboard:theme:changed', {
          detail: { canvasResolved: 'dark' },
        }))
      })

      await waitFor(() => {
        const switched = container.querySelector('img')
        expect(switched.src).toContain('--dark.webp')
      })
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
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-abc123--light.webp?v=123',
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

    it('ignores snapshot that does not match widget ID', () => {
      const { container } = render(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshotLight: '/_storyboard/canvas/images/snapshot-other-widget--light.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      // Should show placeholder, not the mismatched snapshot
      expect(container.querySelector('img')).not.toBeInTheDocument()
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
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-ext--light.webp?v=123',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      // External URLs should never show snapshots
      expect(container.querySelector('img')).not.toBeInTheDocument()
    })

    it('falls back to light snapshot when dark snapshot is missing', () => {
      const { container } = render(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-abc123--light.webp?v=1',
            // no snapshotDark — light snapshot should show regardless of theme
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const imgs = container.querySelectorAll('img')
      expect(imgs).toHaveLength(1)
      expect(imgs[0].src).toContain('--light.webp')
      // Should be visible (no visibility: hidden) since it's the only snapshot
      expect(imgs[0].style.visibility).not.toBe('hidden')
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
            snapshotLight: '/_storyboard/canvas/images/snapshot-story-abc123--light.webp?v=456',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('snapshot-story-abc123--light.webp')
      expect(container.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('switches snapshot src on theme change', async () => {
      const { container } = render(
        <StoryWidget
          id="story-abc123"
          props={{
            storyId: 'button-patterns',
            snapshotLight: '/_storyboard/canvas/images/snapshot-story-abc123--light.webp?v=1',
            snapshotDark: '/_storyboard/canvas/images/snapshot-story-abc123--dark.webp?v=1',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('--light.webp')

      act(() => {
        document.dispatchEvent(new CustomEvent('storyboard:theme:changed', {
          detail: { canvasResolved: 'dark' },
        }))
      })

      await waitFor(() => {
        const switched = container.querySelector('img')
        expect(switched.src).toContain('--dark.webp')
      })
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
            snapshotLight: '/_storyboard/canvas/images/snapshot-story-abc123--light.webp?v=456',
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
