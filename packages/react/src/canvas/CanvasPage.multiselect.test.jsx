import { fireEvent, render, screen, act } from '@testing-library/react'
import CanvasPage from './CanvasPage.jsx'
import { updateCanvas, removeWidget } from './canvasApi.js'

const MOCK_UNDO_REDO = {
  snapshot: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  reset: vi.fn(),
  canUndo: false,
  canRedo: false,
}

vi.mock('./useUndoRedo.js', () => ({
  default: () => MOCK_UNDO_REDO,
}))

// Expose onDragEnd so tests can trigger drags with specific IDs
let capturedOnDragEnd = null
vi.mock('@dfosco/tiny-canvas', () => ({
  Canvas: ({ children, onDragEnd }) => {
    capturedOnDragEnd = onDragEnd
    return <div data-testid="tiny-canvas">{children}</div>
  },
}))

const mockCanvas = {
  title: 'Multi-Select Test',
  widgets: [
    { id: 'w1', type: 'sticky-note', position: { x: 100, y: 100 }, props: {} },
    { id: 'w2', type: 'sticky-note', position: { x: 300, y: 100 }, props: {} },
    { id: 'w3', type: 'markdown', position: { x: 500, y: 200 }, props: {} },
  ],
  sources: [],
  centered: false,
  dotted: false,
  grid: false,
  gridSize: 18,
  colorMode: 'auto',
}

vi.mock('./useCanvas.js', () => ({
  useCanvas: () => ({
    canvas: mockCanvas,
    jsxExports: null,
    loading: false,
  }),
}))

vi.mock('./widgets/index.js', () => ({
  getWidgetComponent: () => function MockWidget({ id }) {
    return <div data-testid={`widget-content-${id}`}>widget</div>
  },
}))

// WidgetChrome mock that exposes onSelect with shift parameter
vi.mock('./widgets/WidgetChrome.jsx', () => ({
  default: ({ children, onSelect, selected, multiSelected, widgetId }) => (
    <div
      data-testid={`chrome-${widgetId}`}
      data-selected={selected || undefined}
      data-multi-selected={multiSelected || undefined}
    >
      {children}
      <button
        className="tc-drag-handle"
        data-testid={`select-${widgetId}`}
        onClick={(e) => { e.stopPropagation(); onSelect?.(false) }}
      >
        select
      </button>
      <button
        className="tc-drag-handle"
        data-testid={`shift-select-${widgetId}`}
        onClick={(e) => { e.stopPropagation(); onSelect?.(true) }}
      >
        shift-select
      </button>
    </div>
  ),
}))

vi.mock('./widgets/widgetProps.js', () => ({
  schemas: {},
  getDefaults: () => ({}),
}))

vi.mock('./widgets/widgetConfig.js', () => ({
  getFeatures: () => [],
  isResizable: () => false,
  schemas: {},
  getMenuWidgetTypes: () => [],
}))

vi.mock('./widgets/figmaUrl.js', () => ({
  isFigmaUrl: () => false,
  sanitizeFigmaUrl: (url) => url,
}))

vi.mock('./canvasApi.js', () => ({
  addWidget: vi.fn(),
  updateCanvas: vi.fn(() => Promise.resolve({ success: true })),
  removeWidget: vi.fn(() => Promise.resolve({ success: true })),
  uploadImage: vi.fn(),
}))

describe('CanvasPage multi-select', () => {
  beforeEach(() => {
    delete window.__storyboardCanvasBridgeState
    window.__SB_LOCAL_DEV__ = true
    vi.clearAllMocks()
    capturedOnDragEnd = null
  })

  afterEach(() => {
    delete window.__SB_LOCAL_DEV__
  })

  it('shift+click on select handle adds widget to selection', async () => {
    render(<CanvasPage name="test-canvas" />)

    // Select first widget
    fireEvent.click(screen.getByTestId('select-w1'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(screen.getByTestId('chrome-w1').dataset.selected).toBeDefined()

    // Shift+select second widget
    fireEvent.click(screen.getByTestId('shift-select-w2'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(screen.getByTestId('chrome-w1').dataset.selected).toBeDefined()
    expect(screen.getByTestId('chrome-w2').dataset.selected).toBeDefined()
  })

  it('shift+click on already selected widget removes it from selection', async () => {
    render(<CanvasPage name="test-canvas" />)

    // Select both
    fireEvent.click(screen.getByTestId('select-w1'))
    fireEvent.click(screen.getByTestId('shift-select-w2'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(screen.getByTestId('chrome-w1').dataset.selected).toBeDefined()
    expect(screen.getByTestId('chrome-w2').dataset.selected).toBeDefined()

    // Shift+click w1 again to remove it
    fireEvent.click(screen.getByTestId('shift-select-w1'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(screen.getByTestId('chrome-w1').dataset.selected).toBeUndefined()
    expect(screen.getByTestId('chrome-w2').dataset.selected).toBeDefined()
  })

  it('normal click replaces multi-selection with single', async () => {
    render(<CanvasPage name="test-canvas" />)

    // Multi-select
    fireEvent.click(screen.getByTestId('select-w1'))
    fireEvent.click(screen.getByTestId('shift-select-w2'))
    fireEvent.click(screen.getByTestId('shift-select-w3'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    // Normal click on w1 clears multi-select
    fireEvent.click(screen.getByTestId('select-w1'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    expect(screen.getByTestId('chrome-w1').dataset.selected).toBeDefined()
    expect(screen.getByTestId('chrome-w2').dataset.selected).toBeUndefined()
    expect(screen.getByTestId('chrome-w3').dataset.selected).toBeUndefined()
  })

  it('sets multiSelected on all selected widgets when multiple are selected', async () => {
    render(<CanvasPage name="test-canvas" />)

    fireEvent.click(screen.getByTestId('select-w1'))
    fireEvent.click(screen.getByTestId('shift-select-w2'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    expect(screen.getByTestId('chrome-w1').dataset.multiSelected).toBeDefined()
    expect(screen.getByTestId('chrome-w2').dataset.multiSelected).toBeDefined()
    // Unselected widget should not have multiSelected
    expect(screen.getByTestId('chrome-w3').dataset.multiSelected).toBeUndefined()
  })

  it('Escape clears all selection', async () => {
    render(<CanvasPage name="test-canvas" />)

    fireEvent.click(screen.getByTestId('select-w1'))
    fireEvent.click(screen.getByTestId('shift-select-w2'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    fireEvent.keyDown(document, { key: 'Escape' })
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    expect(screen.getByTestId('chrome-w1').dataset.selected).toBeUndefined()
    expect(screen.getByTestId('chrome-w2').dataset.selected).toBeUndefined()
  })

  it('Delete removes all selected widgets and calls updateCanvas', async () => {
    render(<CanvasPage name="test-canvas" />)

    // Multi-select w1 and w2
    fireEvent.click(screen.getByTestId('select-w1'))
    fireEvent.click(screen.getByTestId('shift-select-w2'))
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    // Press Delete
    fireEvent.keyDown(document, { key: 'Delete' })
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    // Should call updateCanvas with only w3 remaining
    expect(updateCanvas).toHaveBeenCalledWith(
      'test-canvas',
      expect.objectContaining({
        widgets: [expect.objectContaining({ id: 'w3' })],
      })
    )
    // Should NOT use individual removeWidget API for multi-delete
    expect(removeWidget).not.toHaveBeenCalled()
    // Should snapshot for undo
    expect(MOCK_UNDO_REDO.snapshot).toHaveBeenCalled()
  })

  it('single-select Delete uses removeWidget API', async () => {
    render(<CanvasPage name="test-canvas" />)

    fireEvent.click(screen.getByTestId('select-w1'))
    fireEvent.keyDown(document, { key: 'Backspace' })
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    expect(removeWidget).toHaveBeenCalledWith('test-canvas', 'w1')
  })

  it('multi-select move applies delta to all selected widgets', async () => {
    render(<CanvasPage name="test-canvas" />)

    // Multi-select w1 (100,100) and w2 (300,100)
    fireEvent.click(screen.getByTestId('select-w1'))
    fireEvent.click(screen.getByTestId('shift-select-w2'))

    // Wait for selectedIdsRef to sync
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    // Drag w1 to (150, 200) → delta is (+50, +100)
    expect(capturedOnDragEnd).toBeTruthy()
    act(() => {
      capturedOnDragEnd('w1', { x: 150, y: 200 })
    })
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })

    // w1 → (150, 200), w2 → (300+50, 100+100) = (350, 200)
    expect(updateCanvas).toHaveBeenCalledWith(
      'test-canvas',
      expect.objectContaining({
        widgets: expect.arrayContaining([
          expect.objectContaining({ id: 'w1', position: { x: 150, y: 200 } }),
          expect.objectContaining({ id: 'w2', position: { x: 350, y: 200 } }),
          // w3 unchanged
          expect.objectContaining({ id: 'w3', position: { x: 500, y: 200 } }),
        ]),
      })
    )
  })
})
