import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CanvasPage from './CanvasPage.jsx'
import { updateCanvas } from './canvasApi.js'

vi.mock('@dfosco/tiny-canvas', () => ({
  Canvas: ({ children, onDragEnd }) => (
    <div data-testid="tiny-canvas">
      {children}
      <button
        data-testid="drag-widget"
        onClick={() => onDragEnd?.('widget-1', { x: 111.4, y: 222.7 })}
      >
        drag widget
      </button>
      <button
        data-testid="drag-source"
        onClick={() => onDragEnd?.('jsx-PrimaryButtons', { x: 333.2, y: 444.8 })}
      >
        drag source
      </button>
    </div>
  ),
}))

const mockCanvas = {
  title: 'Bridge Test Canvas',
  widgets: [{ id: 'widget-1', type: 'mock-widget', position: { x: 10, y: 20 }, props: {} }],
  sources: [{ export: 'PrimaryButtons', position: { x: 1, y: 2 } }],
  centered: false,
  dotted: false,
  grid: false,
  gridSize: 18,
  colorMode: 'auto',
}

vi.mock('./useCanvas.js', () => ({
  useCanvas: () => ({ canvas: mockCanvas, jsxExports: null, loading: false }),
}))

vi.mock('./widgets/index.js', () => ({
  getWidgetComponent: () => function MockWidget() { return <div>mock widget</div> },
}))

vi.mock('./widgets/widgetProps.js', () => ({
  schemas: {},
  getDefaults: () => ({}),
}))

vi.mock('./canvasApi.js', () => ({
  addWidget: vi.fn(),
  updateCanvas: vi.fn(() => Promise.resolve({ success: true })),
  removeWidget: vi.fn(),
}))

describe('CanvasPage canvas bridge', () => {
  beforeEach(() => {
    delete window.__storyboardCanvasBridgeState
    vi.clearAllMocks()
  })

  it('publishes bridge state and responds to status requests', () => {
    const mountedHandler = vi.fn()
    const statusHandler = vi.fn()
    document.addEventListener('storyboard:canvas:mounted', mountedHandler)
    document.addEventListener('storyboard:canvas:status', statusHandler)

    const { unmount } = render(<CanvasPage name="design-overview" />)

    expect(window.__storyboardCanvasBridgeState).toEqual({
      active: true,
      name: 'design-overview',
      zoom: 100,
    })
    expect(mountedHandler).toHaveBeenCalled()

    document.dispatchEvent(new CustomEvent('storyboard:canvas:status-request'))
    expect(statusHandler).toHaveBeenCalled()
    expect(statusHandler.mock.calls.at(-1)?.[0]?.detail).toEqual({
      active: true,
      name: 'design-overview',
      zoom: 100,
    })

    unmount()

    document.removeEventListener('storyboard:canvas:mounted', mountedHandler)
    document.removeEventListener('storyboard:canvas:status', statusHandler)
  })

  it('marks bridge inactive on unmount', () => {
    const unmountedHandler = vi.fn()
    document.addEventListener('storyboard:canvas:unmounted', unmountedHandler)

    const { unmount } = render(<CanvasPage name="design-overview" />)
    unmount()

    expect(unmountedHandler).toHaveBeenCalled()
    expect(window.__storyboardCanvasBridgeState).toEqual({
      active: false,
      name: '',
      zoom: 100,
    })

    document.removeEventListener('storyboard:canvas:unmounted', unmountedHandler)
  })

  it('persists dragged JSON widgets and JSX sources to canvas JSONL via update API', async () => {
    render(<CanvasPage name="design-overview" />)

    fireEvent.click(screen.getByTestId('drag-widget'))
    await waitFor(() => {
      expect(updateCanvas).toHaveBeenCalledWith(
        'design-overview',
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              id: 'widget-1',
              position: { x: 111, y: 223 },
            }),
          ]),
        })
      )
    })

    fireEvent.click(screen.getByTestId('drag-source'))
    await waitFor(() => {
      expect(updateCanvas).toHaveBeenCalledWith(
        'design-overview',
        expect.objectContaining({
          sources: expect.arrayContaining([
            expect.objectContaining({
              export: 'PrimaryButtons',
              position: { x: 333, y: 445 },
            }),
          ]),
        })
      )
    })
  })
})
