import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CanvasPage from './CanvasPage.jsx'
import { getCanvasPrimerAttrs, getCanvasThemeVars } from './canvasTheme.js'
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
        data-testid="drag-widget-negative"
        onClick={() => onDragEnd?.('widget-1', { x: -50, y: -30 })}
      >
        drag widget negative
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
  useCanvas: () => ({
    canvas: mockCanvas,
    jsxExports: {
      PrimaryButtons: () => <div data-testid="jsx-widget-content">jsx widget</div>,
    },
    loading: false,
  }),
}))

vi.mock('./widgets/index.js', () => ({
  getWidgetComponent: () => function MockWidget() { return <div>mock widget</div> },
}))

vi.mock('./widgets/WidgetChrome.jsx', () => ({
  default: ({ children }) => <div data-testid="widget-chrome">{children}</div>,
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

  it('clamps negative drag positions to zero', async () => {
    render(<CanvasPage name="design-overview" />)

    fireEvent.click(screen.getByTestId('drag-widget-negative'))
    await waitFor(() => {
      expect(updateCanvas).toHaveBeenCalledWith(
        'design-overview',
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              id: 'widget-1',
              position: { x: 0, y: 0 },
            }),
          ]),
        })
      )
    })
  })
})

describe('getCanvasThemeVars', () => {
  it('returns a distinct dark-dimmed background token', () => {
    expect(getCanvasThemeVars('light')['--sb--canvas-bg']).toBe('#f6f8fa')
    expect(getCanvasThemeVars('light')['--tc-bg-muted']).toBe('#f6f8fa')
    expect(getCanvasThemeVars('dark')['--sb--canvas-bg']).toBe('#161b22')
    expect(getCanvasThemeVars('dark')['--bgColor-muted']).toBe('#161b22')
    expect(getCanvasThemeVars('dark')['--tc-bg-muted']).toBe('#161b22')
    expect(getCanvasThemeVars('dark_dimmed')['--sb--canvas-bg']).toBe('#22272e')
    expect(getCanvasThemeVars('dark_dimmed')['--bgColor-muted']).toBe('#22272e')
    expect(getCanvasThemeVars('dark_dimmed')['--tc-bg-muted']).toBe('#22272e')
    expect(getCanvasThemeVars('dark_dimmed')['--tc-dot-color']).toBe('rgba(205, 217, 229, 0.22)')
    expect(getCanvasThemeVars('dark_dimmed')['--overlay-backdrop-bgColor']).toBe('rgba(205, 217, 229, 0.22)')
  })
})

describe('getCanvasPrimerAttrs', () => {
  it('maps canvas theme to local Primer mode attrs', () => {
    expect(getCanvasPrimerAttrs('light')).toEqual({
      'data-color-mode': 'light',
      'data-dark-theme': 'dark',
      'data-light-theme': 'light',
    })
    expect(getCanvasPrimerAttrs('dark')).toEqual({
      'data-color-mode': 'dark',
      'data-dark-theme': 'dark',
      'data-light-theme': 'light',
    })
    expect(getCanvasPrimerAttrs('dark_dimmed')).toEqual({
      'data-color-mode': 'dark',
      'data-dark-theme': 'dark_dimmed',
      'data-light-theme': 'light',
    })
  })
})

describe('canvas target fallback', () => {
  it('stays light when canvas target is unchecked even if stale canvas attribute is dark', () => {
    localStorage.setItem('sb-theme-sync', JSON.stringify({
      prototype: true,
      toolbar: true,
      codeBoxes: true,
      canvas: false,
    }))
    localStorage.setItem('sb-color-scheme', 'dark')
    document.documentElement.setAttribute('data-sb-canvas-theme', 'dark')

    render(<CanvasPage name="design-overview" />)

    const scroll = document.querySelector('[data-storyboard-canvas-scroll]')
    const jsxWidget = document.getElementById('jsx-PrimaryButtons')
    expect(scroll?.style.getPropertyValue('--sb--canvas-bg')).toBe('#f6f8fa')
    expect(scroll?.style.getPropertyValue('--tc-bg-muted')).toBe('#f6f8fa')
    expect(scroll?.getAttribute('data-color-mode')).toBe('light')
    expect(jsxWidget?.getAttribute('data-color-mode')).toBe('light')
    expect(jsxWidget?.style.getPropertyValue('--bgColor-default')).toBe('#ffffff')
  })
})
