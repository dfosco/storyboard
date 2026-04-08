import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { readProp, getDefaults, stickyNoteSchema } from './widgetProps.js'
import StickyNote from './StickyNote.jsx'

describe('stickyNoteSchema', () => {
  it('includes width and height in the size category', () => {
    expect(stickyNoteSchema.width).toEqual(
      expect.objectContaining({ type: 'number', category: 'size' })
    )
    expect(stickyNoteSchema.height).toEqual(
      expect.objectContaining({ type: 'number', category: 'size' })
    )
  })

  it('does not include default values for width/height so new widgets size naturally', () => {
    const defaults = getDefaults(stickyNoteSchema)
    expect(defaults).not.toHaveProperty('width')
    expect(defaults).not.toHaveProperty('height')
  })

  it('returns null when width/height are not saved in props', () => {
    const props = { text: 'hello', color: 'yellow' }
    expect(readProp(props, 'width', stickyNoteSchema)).toBeNull()
    expect(readProp(props, 'height', stickyNoteSchema)).toBeNull()
  })

  it('returns saved width/height when present in props', () => {
    const props = { text: 'hello', width: 300, height: 200 }
    expect(readProp(props, 'width', stickyNoteSchema)).toBe(300)
    expect(readProp(props, 'height', stickyNoteSchema)).toBe(200)
  })
})

describe('StickyNote', () => {
  it('renders without explicit dimensions when width/height are not saved', () => {
    const { container } = render(<StickyNote props={{ text: 'Hi' }} onUpdate={vi.fn()} />)
    const sticky = container.querySelector('article')
    expect(sticky.style.width).toBe('')
    expect(sticky.style.height).toBe('')
  })

  it('applies saved dimensions as inline styles', () => {
    const { container } = render(
      <StickyNote props={{ text: 'Hi', width: 300, height: 200 }} onUpdate={vi.fn()} />
    )
    const sticky = container.querySelector('article')
    expect(sticky.style.width).toBe('300px')
    expect(sticky.style.height).toBe('200px')
  })

  it('renders a resize handle', () => {
    const { container } = render(<StickyNote props={{ text: 'Hi' }} onUpdate={vi.fn()} />)
    const handle = container.querySelector('[role="separator"]')
    expect(handle).not.toBeNull()
  })

  it('calls onUpdate with new dimensions on resize drag', () => {
    const onUpdate = vi.fn()
    const { container } = render(
      <StickyNote props={{ text: 'Hi', width: 200, height: 150 }} onUpdate={onUpdate} />
    )
    const handle = container.querySelector('[role="separator"]')
    const sticky = container.querySelector('article')

    // Mock offsetWidth/offsetHeight since jsdom doesn't compute layout
    Object.defineProperty(sticky, 'offsetWidth', { value: 200, configurable: true })
    Object.defineProperty(sticky, 'offsetHeight', { value: 150, configurable: true })

    // Simulate drag: mousedown → mousemove → mouseup
    fireEvent.mouseDown(handle, { clientX: 200, clientY: 150 })
    fireEvent.mouseMove(document, { clientX: 250, clientY: 200 })
    fireEvent.mouseUp(document)

    expect(onUpdate).toHaveBeenCalledWith({ width: 250, height: 200 })
  })

  it('enforces minimum dimensions during resize', () => {
    const onUpdate = vi.fn()
    const { container } = render(
      <StickyNote props={{ text: 'Hi', width: 200, height: 150 }} onUpdate={onUpdate} />
    )
    const handle = container.querySelector('[role="separator"]')
    const sticky = container.querySelector('article')

    Object.defineProperty(sticky, 'offsetWidth', { value: 200, configurable: true })
    Object.defineProperty(sticky, 'offsetHeight', { value: 150, configurable: true })

    // Drag far to the left/up — should clamp to mins
    fireEvent.mouseDown(handle, { clientX: 200, clientY: 150 })
    fireEvent.mouseMove(document, { clientX: 0, clientY: 0 })
    fireEvent.mouseUp(document)

    expect(onUpdate).toHaveBeenCalledWith({ width: 180, height: 60 })
  })
})
