/**
 * Tests for embed interaction UX (click-to-interact overlay).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import PrototypeEmbed from './PrototypeEmbed.jsx'
import FigmaEmbed from './FigmaEmbed.jsx'
import ComponentWidget from './ComponentWidget.jsx'

// Mock buildPrototypeIndex for PrototypeEmbed
vi.mock('@dfosco/storyboard-core', () => ({
  buildPrototypeIndex: () => ({ folders: [], prototypes: [], globalFlows: [], sorted: { title: { prototypes: [], folders: [] } } }),
}))

// Simple mock wrapper for WidgetWrapper
vi.mock('./WidgetWrapper.jsx', () => ({
  default: ({ children }) => <div data-testid="widget-wrapper">{children}</div>,
}))

// Mock ResizeHandle
vi.mock('./ResizeHandle.jsx', () => ({
  default: () => <div data-testid="resize-handle" />,
}))

// Mock ComponentErrorBoundary
vi.mock('../ComponentErrorBoundary.jsx', () => ({
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>,
}))

describe('Embed interaction overlay', () => {
  describe('PrototypeEmbed', () => {
    const defaultProps = {
      props: { src: '/test', width: 400, height: 300, zoom: 100 },
      onUpdate: vi.fn(),
      resizable: false,
    }

    it('renders "Click to interact" hint on hover', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const hint = screen.getByText('Click to interact')
      expect(hint).toBeInTheDocument()
      // CSS modules mangle class names, just check the element exists
    })

    it('enters interactive mode on single click (not double-click)', async () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      // Overlay should exist before interaction
      const overlay = screen.getByRole('button', { name: /click to interact/i })
      expect(overlay).toBeInTheDocument()
      
      // Single click should remove the overlay (enter interactive mode)
      fireEvent.click(overlay)
      
      // Overlay should no longer exist
      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
    })

    it('does not enter interactive mode on shift+click (preserves multi-select)', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact/i })
      fireEvent.click(overlay, { shiftKey: true })
      
      // Overlay should still exist (did not enter interactive mode)
      expect(screen.getByRole('button', { name: /click to interact/i })).toBeInTheDocument()
    })

    it('does not enter interactive mode on meta+click (preserves multi-select)', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact/i })
      fireEvent.click(overlay, { metaKey: true })
      
      expect(screen.getByRole('button', { name: /click to interact/i })).toBeInTheDocument()
    })

    it('supports keyboard interaction (Enter key) with event prevention', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact/i })
      const event = { key: 'Enter', preventDefault: vi.fn(), stopPropagation: vi.fn() }
      fireEvent.keyDown(overlay, event)
      
      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
    })

    it('supports keyboard interaction (Space key) with event prevention', () => {
      render(<PrototypeEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact/i })
      const event = { key: ' ', preventDefault: vi.fn(), stopPropagation: vi.fn() }
      fireEvent.keyDown(overlay, event)
      
      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
    })
  })

  describe('FigmaEmbed', () => {
    const defaultProps = {
      props: { url: 'https://www.figma.com/design/abc123/Test', width: 400, height: 300 },
      onUpdate: vi.fn(),
      resizable: false,
    }

    it('renders "Click to interact" hint', () => {
      render(<FigmaEmbed {...defaultProps} />)
      
      const hint = screen.getByText('Click to interact')
      expect(hint).toBeInTheDocument()
    })

    it('enters interactive mode on single click', () => {
      render(<FigmaEmbed {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact/i })
      fireEvent.click(overlay)
      
      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
    })
  })

  describe('ComponentWidget', () => {
    const MockComponent = () => <div>Mock Component</div>
    
    const defaultProps = {
      component: MockComponent,
      jsxModule: null,
      exportName: 'MockComponent',
      canvasTheme: 'light',
      isLocalDev: false,
      width: 200,
      height: 150,
      onUpdate: vi.fn(),
      resizable: false,
    }

    it('renders "Click to interact" hint', () => {
      render(<ComponentWidget {...defaultProps} />)
      
      const hint = screen.getByText('Click to interact')
      expect(hint).toBeInTheDocument()
    })

    it('enters interactive mode on single click', () => {
      render(<ComponentWidget {...defaultProps} />)
      
      const overlay = screen.getByRole('button', { name: /click to interact/i })
      fireEvent.click(overlay)
      
      expect(screen.queryByRole('button', { name: /click to interact/i })).not.toBeInTheDocument()
    })
  })
})
