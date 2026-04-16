/**
 * Tests for useSnapshotCapture hook — parent-side capture orchestration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSnapshotCapture } from './useSnapshotCapture.js'

vi.mock('../canvasApi.js', () => ({
  uploadImage: vi.fn().mockResolvedValue({ filename: 'snapshot-test-widget--latest.webp' }),
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

  it('ignores messages from other sources', () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn() })
    )
    act(() => { dispatchMessage(createMockContentWindow(), { type: 'storyboard:embed:snapshot-ready' }) })
    expect(result.current.iframeReady).toBe(false)
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

  it('captures and stores under both theme keys', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'test-widget', onUpdate })
    )

    act(() => { dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' }) })

    await act(async () => {
      const promise = result.current.requestCapture()
      await new Promise(r => setTimeout(r, 10))
      dispatchMessage(cw, {
        type: 'storyboard:embed:snapshot',
        requestId: 1,
        dataUrl: 'data:image/webp;base64,AAAA',
      })
      await promise
    })

    expect(cw.postMessage).toHaveBeenCalledTimes(1)
    expect(uploadImage).toHaveBeenCalledTimes(1)
    // Both theme keys should be set with the same URL
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        snapshotLight: expect.stringContaining('snapshot-test-widget--latest.webp'),
        snapshotDark: expect.stringContaining('snapshot-test-widget--latest.webp'),
      })
    )
  })
})
