/**
 * Tests for useSnapshotCapture hook — single-capture orchestration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSnapshotCapture } from './useSnapshotCapture.js'

vi.mock('../canvasApi.js', () => ({
  uploadImage: vi.fn().mockResolvedValue({ filename: 'snapshot-test-widget.webp' }),
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

  afterEach(() => { vi.restoreAllMocks() })

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

  it('sets iframeReady=true on snapshot-ready message', () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn() })
    )
    act(() => { dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' }) })
    expect(result.current.iframeReady).toBe(true)
  })

  it('no-ops when onUpdate is null', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: null })
    )
    await act(async () => { await result.current.requestCapture() })
    expect(cw.postMessage).not.toHaveBeenCalled()
  })

  it('no-ops when iframe not ready', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn() })
    )
    await act(async () => { await result.current.requestCapture() })
    expect(cw.postMessage).not.toHaveBeenCalled()
  })

  it('sends single capture and calls onUpdate with snapshot', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'test-widget', onUpdate })
    )

    act(() => { dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' }) })

    uploadImage.mockResolvedValueOnce({ filename: 'snapshot-test-widget.webp' })

    await act(async () => {
      const promise = result.current.requestCapture()

      await new Promise(r => setTimeout(r, 10))
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot', requestId: 1, dataUrl: 'data:image/webp;base64,IMG' })

      await promise
    })

    // Single capture, single postMessage
    expect(cw.postMessage).toHaveBeenCalledTimes(1)
    expect(uploadImage).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        snapshot: expect.stringContaining('snapshot-test-widget.webp'),
      })
    )
  })

  it('guards against concurrent captures', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate })
    )

    act(() => { dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' }) })
    uploadImage.mockResolvedValue({ filename: 'snapshot-w1.webp' })

    await act(async () => {
      const p1 = result.current.requestCapture()
      // Second call while first is in-flight should no-op
      const p2 = result.current.requestCapture()

      await new Promise(r => setTimeout(r, 10))
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot', requestId: 1, dataUrl: 'data:image/webp;base64,IMG' })

      await p1
      await p2
    })

    expect(cw.postMessage).toHaveBeenCalledTimes(1)
  })

  it('handles capture failure gracefully', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate })
    )

    act(() => { dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' }) })
    uploadImage.mockRejectedValueOnce(new Error('upload failed'))

    await act(async () => {
      const promise = result.current.requestCapture()

      await new Promise(r => setTimeout(r, 10))
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot', requestId: 1, dataUrl: 'data:image/webp;base64,FAIL' })

      await promise
    })

    expect(onUpdate).not.toHaveBeenCalled()
  })
})
