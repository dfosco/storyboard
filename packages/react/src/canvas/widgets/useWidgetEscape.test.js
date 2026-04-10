import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import useWidgetEscape from './useWidgetEscape.js'

describe('useWidgetEscape', () => {
  it('calls exitFn when Escape is pressed while active', () => {
    const exitFn = vi.fn()
    renderHook(() => useWidgetEscape(true, exitFn))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(exitFn).toHaveBeenCalledOnce()
  })

  it('does not call exitFn when active is false', () => {
    const exitFn = vi.fn()
    renderHook(() => useWidgetEscape(false, exitFn))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(exitFn).not.toHaveBeenCalled()
  })

  it('ignores non-Escape keys', () => {
    const exitFn = vi.fn()
    renderHook(() => useWidgetEscape(true, exitFn))

    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'a' })

    expect(exitFn).not.toHaveBeenCalled()
  })

  it('stops listening when active changes from true to false', () => {
    const exitFn = vi.fn()
    const { rerender } = renderHook(
      ({ active }) => useWidgetEscape(active, exitFn),
      { initialProps: { active: true } }
    )

    // Active — should respond
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(exitFn).toHaveBeenCalledOnce()

    // Deactivate
    rerender({ active: false })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(exitFn).toHaveBeenCalledOnce() // still 1, no new call
  })

  it('starts listening when active changes from false to true', () => {
    const exitFn = vi.fn()
    const { rerender } = renderHook(
      ({ active }) => useWidgetEscape(active, exitFn),
      { initialProps: { active: false } }
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(exitFn).not.toHaveBeenCalled()

    rerender({ active: true })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(exitFn).toHaveBeenCalledOnce()
  })

  it('stops propagation of the Escape event', () => {
    const exitFn = vi.fn()
    renderHook(() => useWidgetEscape(true, exitFn))

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    const stopSpy = vi.spyOn(event, 'stopPropagation')

    document.dispatchEvent(event)

    expect(stopSpy).toHaveBeenCalled()
  })

  it('cleans up listener on unmount', () => {
    const exitFn = vi.fn()
    const { unmount } = renderHook(() => useWidgetEscape(true, exitFn))

    unmount()
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(exitFn).not.toHaveBeenCalled()
  })
})
