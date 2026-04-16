/**
 * Tests for iframe snapshot display — layered dual-theme rendering.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
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

/** Helper: render a widget inside a container that has [data-sb-canvas-theme]. */
function renderWithCanvasTheme(ui, theme = 'light') {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-sb-canvas-theme', theme)
  document.body.appendChild(wrapper)
  const result = render(ui, { container: wrapper })
  return { ...result, canvasContainer: wrapper }
}

afterEach(() => {
  // Clean up any wrapper divs we added
  document.querySelectorAll('[data-sb-canvas-theme]').forEach(el => el.remove())
})

describe('Snapshot display', () => {
  describe('PrototypeEmbed', () => {
    it('shows snapshot image when valid snapshot prop exists', () => {
      const { canvasContainer } = renderWithCanvasTheme(
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

      const img = canvasContainer.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('snapshot-proto-abc123--light.webp')
      expect(img.alt).toContain('snapshot')
      expect(canvasContainer.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('switches snapshot src when ancestor data-sb-canvas-theme changes', async () => {
      const { canvasContainer } = renderWithCanvasTheme(
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
        />,
        'light'
      )

      const img = canvasContainer.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('--light.webp')

      // Simulate CanvasPage updating the theme attribute
      act(() => {
        canvasContainer.setAttribute('data-sb-canvas-theme', 'dark')
      })

      await waitFor(() => {
        const switched = canvasContainer.querySelector('img')
        expect(switched.src).toContain('--dark.webp')
      })
    })

    it('shows placeholder when no snapshot exists', () => {
      const { canvasContainer } = renderWithCanvasTheme(
        <PrototypeEmbed
          id="proto-xyz"
          props={{ src: '/test', width: 400, height: 300, zoom: 100 }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      expect(canvasContainer.querySelector('img')).not.toBeInTheDocument()
      expect(canvasContainer.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('falls back to placeholder when snapshot image fails to load', () => {
      const { canvasContainer } = renderWithCanvasTheme(
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

      const img = canvasContainer.querySelector('img')
      expect(img).toBeInTheDocument()

      fireEvent.error(img)

      // After error, img should be gone and placeholder shown
      expect(canvasContainer.querySelector('img')).not.toBeInTheDocument()
    })

    it('ignores snapshot that does not match widget ID', () => {
      const { canvasContainer } = renderWithCanvasTheme(
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
      expect(canvasContainer.querySelector('img')).not.toBeInTheDocument()
    })

    it('does not show snapshot for external URLs', () => {
      const { canvasContainer } = renderWithCanvasTheme(
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
      expect(canvasContainer.querySelector('img')).not.toBeInTheDocument()
    })

    it('falls back to light snapshot when dark snapshot is missing', () => {
      const { canvasContainer } = renderWithCanvasTheme(
        <PrototypeEmbed
          id="proto-abc123"
          props={{
            src: '/test',
            width: 400,
            height: 300,
            zoom: 100,
            snapshotLight: '/_storyboard/canvas/images/snapshot-proto-abc123--light.webp?v=1',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />
      )

      const imgs = canvasContainer.querySelectorAll('img')
      expect(imgs).toHaveLength(1)
      expect(imgs[0].src).toContain('--light.webp')
    })
  })

  describe('StoryWidget', () => {
    it('shows snapshot image when valid snapshot prop exists', () => {
      const { canvasContainer } = renderWithCanvasTheme(
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

      const img = canvasContainer.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('snapshot-story-abc123--light.webp')
      expect(canvasContainer.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('switches snapshot src when ancestor data-sb-canvas-theme changes', async () => {
      const { canvasContainer } = renderWithCanvasTheme(
        <StoryWidget
          id="story-abc123"
          props={{
            storyId: 'button-patterns',
            snapshotLight: '/_storyboard/canvas/images/snapshot-story-abc123--light.webp?v=1',
            snapshotDark: '/_storyboard/canvas/images/snapshot-story-abc123--dark.webp?v=1',
          }}
          onUpdate={vi.fn()}
          resizable={false}
        />,
        'light'
      )

      const img = canvasContainer.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('--light.webp')

      // Simulate CanvasPage updating the theme attribute
      act(() => {
        canvasContainer.setAttribute('data-sb-canvas-theme', 'dark')
      })

      await waitFor(() => {
        const switched = canvasContainer.querySelector('img')
        expect(switched.src).toContain('--dark.webp')
      })
    })

    it('shows placeholder when no snapshot exists', () => {
      const { canvasContainer } = renderWithCanvasTheme(
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

      expect(canvasContainer.querySelector('img')).not.toBeInTheDocument()
      expect(canvasContainer.querySelector('iframe')).not.toBeInTheDocument()
    })

    it('falls back to placeholder when snapshot image fails to load', () => {
      const { canvasContainer } = renderWithCanvasTheme(
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

      const img = canvasContainer.querySelector('img')
      expect(img).toBeInTheDocument()

      fireEvent.error(img)

      // After error, img should be gone and placeholder shown
      expect(canvasContainer.querySelector('img')).not.toBeInTheDocument()
    })
  })
})
