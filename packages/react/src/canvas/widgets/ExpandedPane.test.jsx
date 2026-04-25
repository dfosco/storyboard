import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ExpandedPane from './ExpandedPane.jsx'

// Mock createPortal to render inline for testing
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: (children) => children,
  }
})

// Polyfill ResizeObserver for jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    constructor(cb) { this._cb = cb }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

function makeReactPane(id, label = `Pane ${id}`) {
  return {
    id,
    label,
    kind: 'react',
    render: () => <div data-testid={`content-${id}`}>{label} content</div>,
  }
}

function makeExternalPane(id, label = `External ${id}`) {
  const detach = vi.fn()
  const attach = vi.fn(() => detach)
  const onResize = vi.fn()
  return {
    pane: { id, label, kind: 'external', attach, onResize },
    attach,
    detach,
    onResize,
  }
}

describe('ExpandedPane', () => {
  describe('single-pane modal variant', () => {
    it('renders modal container with title and content', () => {
      const pane = makeReactPane('md-1', 'Markdown · Notes')
      render(<ExpandedPane initialPanes={[pane]} variant="modal" onClose={vi.fn()} />)
      expect(screen.getByText('Markdown · Notes')).toBeTruthy()
      expect(screen.getByText('Markdown · Notes content')).toBeTruthy()
      expect(screen.getByLabelText('Close expanded view')).toBeTruthy()
    })

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn()
      render(<ExpandedPane initialPanes={[makeReactPane('md-1')]} variant="modal" onClose={onClose} />)
      fireEvent.click(screen.getByLabelText('Close expanded view'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('calls onClose on Escape key', () => {
      const onClose = vi.fn()
      render(<ExpandedPane initialPanes={[makeReactPane('md-1')]} variant="modal" onClose={onClose} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe('single-pane full variant', () => {
    it('renders full-screen container with top bar', () => {
      const pane = makeReactPane('term-1', 'Terminal · wren')
      render(<ExpandedPane initialPanes={[pane]} variant="full" onClose={vi.fn()} />)
      expect(screen.getByText('Terminal · wren')).toBeTruthy()
      expect(screen.getByText('Terminal · wren content')).toBeTruthy()
      expect(screen.getByLabelText('Close expanded view')).toBeTruthy()
    })
  })

  describe('multi-pane (split) layout', () => {
    it('renders both panes with grid layout', () => {
      const paneA = makeReactPane('term-1', 'Terminal · wren')
      const paneB = makeReactPane('proto-1', 'Prototype · /Signup')
      const { container } = render(
        <ExpandedPane initialPanes={[paneA, paneB]} variant="full" onClose={vi.fn()} />
      )
      expect(screen.getByText('Terminal · wren content')).toBeTruthy()
      expect(screen.getByText('Prototype · /Signup content')).toBeTruthy()
      // Check grid exists
      const grid = container.querySelector('[class*="grid"]')
      expect(grid).toBeTruthy()
    })

    it('renders 3 panes', () => {
      const panes = [
        makeReactPane('a', 'Pane A'),
        makeReactPane('b', 'Pane B'),
        makeReactPane('c', 'Pane C'),
      ]
      render(<ExpandedPane initialPanes={panes} variant="full" onClose={vi.fn()} />)
      expect(screen.getByText('Pane A content')).toBeTruthy()
      expect(screen.getByText('Pane B content')).toBeTruthy()
      expect(screen.getByText('Pane C content')).toBeTruthy()
    })

    it('shows remove buttons in split mode', () => {
      const panes = [makeReactPane('a', 'Pane A'), makeReactPane('b', 'Pane B')]
      render(<ExpandedPane initialPanes={panes} variant="full" onClose={vi.fn()} />)
      expect(screen.getAllByLabelText(/Remove .+ pane/).length).toBe(2)
    })

    it('renders divider between panes', () => {
      const panes = [makeReactPane('a'), makeReactPane('b')]
      const { container } = render(
        <ExpandedPane initialPanes={panes} variant="full" onClose={vi.fn()} />
      )
      const dividers = container.querySelectorAll('[role="separator"]')
      expect(dividers.length).toBe(1)
    })

    it('renders N-1 dividers for N panes', () => {
      const panes = [makeReactPane('a'), makeReactPane('b'), makeReactPane('c')]
      const { container } = render(
        <ExpandedPane initialPanes={panes} variant="full" onClose={vi.fn()} />
      )
      const dividers = container.querySelectorAll('[role="separator"]')
      expect(dividers.length).toBe(2)
    })
  })

  describe('external pane attach/detach', () => {
    it('calls attach with container element on mount', async () => {
      const { pane, attach, detach } = makeExternalPane('term-1')
      render(<ExpandedPane initialPanes={[pane]} variant="full" onClose={vi.fn()} />)
      // useLayoutEffect runs synchronously in test
      expect(attach).toHaveBeenCalledOnce()
      expect(attach.mock.calls[0][0]).toBeInstanceOf(HTMLElement)
    })

    it('calls detach on unmount', () => {
      const { pane, detach } = makeExternalPane('term-1')
      const { unmount } = render(
        <ExpandedPane initialPanes={[pane]} variant="full" onClose={vi.fn()} />
      )
      unmount()
      expect(detach).toHaveBeenCalled()
    })
  })

  describe('returns null for empty panes', () => {
    it('returns null when no panes provided', () => {
      const { container } = render(
        <ExpandedPane initialPanes={[]} variant="modal" onClose={vi.fn()} />
      )
      // Modal variant with no panes returns null
      expect(container.innerHTML).toBe('')
    })
  })
})
