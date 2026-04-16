/**
 * Tests for useSnapshotCapture hook — parent-side capture orchestration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSnapshotCapture } from './useSnapshotCapture.js'

// Mock canvasApi uploadImage
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
    // Track window message listeners for manual dispatch
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
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn(), canvasTheme: 'light' })
    )
    expect(result.current.iframeReady).toBe(false)
  })

  it('sets iframeReady=true when snapshot-ready message received', () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn(), canvasTheme: 'light' })
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
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn(), canvasTheme: 'light' })
    )

    const otherWindow = createMockContentWindow()
    act(() => {
      dispatchMessage(otherWindow, { type: 'storyboard:embed:snapshot-ready' })
    })

    expect(result.current.iframeReady).toBe(false)
  })

  it('requestCapture resolves immediately when onUpdate is null', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: null, canvasTheme: 'light' })
    )

    let resolved = false
    await act(async () => {
      await result.current.requestCapture()
      resolved = true
    })
    expect(resolved).toBe(true)
    expect(cw.postMessage).not.toHaveBeenCalled()
  })

  it('requestCapture resolves immediately when iframe ref is null', async () => {
    const iframeRef = createMockIframeRef(null)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn(), canvasTheme: 'light' })
    )

    let resolved = false
    await act(async () => {
      await result.current.requestCapture()
      resolved = true
    })
    expect(resolved).toBe(true)
  })

  it('requestCapture resolves immediately when iframe not ready', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn(), canvasTheme: 'light' })
    )

    // iframeReady is false — should return immediately without posting
    let resolved = false
    await act(async () => {
      await result.current.requestCapture()
      resolved = true
    })
    expect(resolved).toBe(true)
    expect(cw.postMessage).not.toHaveBeenCalled()
  })

  it('requestCapture sends postMessage when iframe is ready', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate, canvasTheme: 'light' })
    )

    // Signal ready first
    act(() => {
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' })
    })
    expect(result.current.iframeReady).toBe(true)

    // Now capture — should send postMessage
    act(() => {
      result.current.requestCapture()
    })

    expect(cw.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'storyboard:embed:capture', requestId: 1 }),
      '*'
    )
  })

  it('handles successful snapshot response — uploads and calls onUpdate', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'test-widget', onUpdate, canvasTheme: 'light' })
    )

    // Signal ready
    act(() => {
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' })
    })

    // Trigger capture
    let capturePromise
    act(() => {
      capturePromise = result.current.requestCapture()
    })

    // Simulate snapshot response
    await act(async () => {
      dispatchMessage(cw, {
        type: 'storyboard:embed:snapshot',
        requestId: 1,
        dataUrl: 'data:image/webp;base64,AAAA',
      })
      await capturePromise
    })

    expect(uploadImage).toHaveBeenCalledWith(
      'data:image/webp;base64,AAAA',
      'snapshot-test-widget',
      'snapshot-test-widget--latest.webp'
    )
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        snapshotLight: expect.stringContaining('snapshot-test-widget--latest.webp'),
      })
    )
  })

  it('uses snapshotDark key when canvas theme is dark', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'test-widget', onUpdate, canvasTheme: 'dark_dimmed' })
    )

    act(() => {
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' })
    })

    let capturePromise
    act(() => {
      capturePromise = result.current.requestCapture()
    })

    await act(async () => {
      dispatchMessage(cw, {
        type: 'storyboard:embed:snapshot',
        requestId: 1,
        dataUrl: 'data:image/webp;base64,AAAA',
      })
      await capturePromise
    })

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        snapshotDark: expect.stringContaining('snapshot-test-widget--latest.webp'),
      })
    )
  })

  it('handles error response without crashing', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate, canvasTheme: 'light' })
    )

    act(() => {
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' })
    })

    let capturePromise
    act(() => {
      capturePromise = result.current.requestCapture()
    })

    await act(async () => {
      dispatchMessage(cw, {
        type: 'storyboard:embed:snapshot',
        requestId: 1,
        error: 'Capture failed',
      })
      await capturePromise
    })

    expect(warnSpy).toHaveBeenCalledWith('[snapshot] Capture failed:', 'Capture failed')
    expect(uploadImage).not.toHaveBeenCalled()
    expect(onUpdate).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('ignores stale snapshot responses', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate, canvasTheme: 'light' })
    )

    act(() => {
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' })
    })

    act(() => {
      result.current.requestCapture()
    })

    // Send response with wrong requestId
    await act(async () => {
      dispatchMessage(cw, {
        type: 'storyboard:embed:snapshot',
        requestId: 999,
        dataUrl: 'data:image/webp;base64,AAAA',
      })
    })

    expect(uploadImage).not.toHaveBeenCalled()
  })

  it('prevents concurrent captures', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate, canvasTheme: 'light' })
    )

    act(() => {
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' })
    })

    // First capture
    act(() => {
      result.current.requestCapture()
    })
    expect(cw.postMessage).toHaveBeenCalledTimes(1)

    // Second capture while first is pending — should be no-op
    act(() => {
      result.current.requestCapture()
    })
    expect(cw.postMessage).toHaveBeenCalledTimes(1)
  })
})
