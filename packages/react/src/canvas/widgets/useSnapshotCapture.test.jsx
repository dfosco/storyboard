/**
 * Tests for useSnapshotCapture hook — parent-side capture orchestration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSnapshotCapture } from './useSnapshotCapture.js'

// Mock canvasApi uploadImage
vi.mock('../canvasApi.js', () => ({
  uploadImage: vi.fn().mockResolvedValue({ filename: 'snapshot-test-widget--light.webp' }),
}))

import { uploadImage } from '../canvasApi.js'

function createMockIframeRef(contentWindow = null) {
  return { current: contentWindow ? { contentWindow } : null }
}

function createMockContentWindow() {
  return { postMessage: vi.fn() }
}

describe('useSnapshotCapture', () => {
  let listeners = []

  beforeEach(() => {
    vi.clearAllMocks()
    listeners = []
    const origAdd = window.addEventListener
    const origRemove = window.removeEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'message') listeners.push(fn)
      origAdd.call(window, type, fn, opts)
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'message') listeners = listeners.filter(l => l !== fn)
      origRemove.call(window, type, fn, opts)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function dispatchMessage(source, data) {
    const event = new MessageEvent('message', { source, data })
    listeners.forEach(fn => fn(event))
  }

  it('returns iframeReady=false initially', () => {
    const iframeRef = createMockIframeRef()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn() })
    )
    expect(result.current.iframeReady).toBe(false)
  })

  it('sets iframeReady=true when snapshot-ready message received', () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn() })
    )

    act(() => {
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' })
    })

    expect(result.current.iframeReady).toBe(true)
  })

  it('ignores messages from other sources', () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn() })
    )

    const otherWindow = createMockContentWindow()
    act(() => {
      dispatchMessage(otherWindow, { type: 'storyboard:embed:snapshot-ready' })
    })

    expect(result.current.iframeReady).toBe(false)
  })

  it('requestCapture is a no-op when onUpdate is null', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: null })
    )

    await act(async () => {
      await result.current.requestCapture()
    })
    expect(cw.postMessage).not.toHaveBeenCalled()
  })

  it('requestCapture is a no-op when iframe not ready', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn() })
    )

    await act(async () => {
      await result.current.requestCapture()
    })
    expect(cw.postMessage).not.toHaveBeenCalled()
  })

  it('sends capture postMessages when iframe is ready', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'test-widget', onUpdate })
    )

    // Signal ready
    act(() => {
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' })
    })

    // Start capture — respond to postMessages as they come
    uploadImage.mockResolvedValue({ filename: 'snapshot-test-widget--light.webp' })

    await act(async () => {
      // Start capture in background
      const promise = result.current.requestCapture()

      // Give microtask a chance to send first postMessage
      await new Promise(r => setTimeout(r, 10))

      // Respond to first capture (light)
      dispatchMessage(cw, {
        type: 'storyboard:embed:snapshot',
        requestId: 1,
        dataUrl: 'data:image/webp;base64,LIGHT',
      })

      // Give microtask a chance to send second postMessage
      await new Promise(r => setTimeout(r, 10))

      // Respond to second capture (dark)
      dispatchMessage(cw, {
        type: 'storyboard:embed:snapshot',
        requestId: 2,
        dataUrl: 'data:image/webp;base64,DARK',
      })

      await promise
    })

    // Should have sent 2 capture postMessages (light + dark)
    expect(cw.postMessage).toHaveBeenCalledTimes(2)
    expect(uploadImage).toHaveBeenCalledTimes(2)
  })
})
