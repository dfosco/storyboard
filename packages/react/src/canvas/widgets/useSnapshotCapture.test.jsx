/**
 * Tests for useSnapshotCapture hook — parent-side capture orchestration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSnapshotCapture } from './useSnapshotCapture.js'

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
    // Mock Image so preload resolves immediately in tests
    vi.stubGlobal('Image', class MockImage {
      constructor() { this._onload = null }
      set onload(fn) { this._onload = fn }
      get onload() { return this._onload }
      set onerror(fn) { this._onerror = fn }
      set src(v) { this._src = v; Promise.resolve().then(() => this._onload?.()) }
      get src() { return this._src }
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
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn(), canvasTheme: 'light' })
    )
    expect(result.current.iframeReady).toBe(false)
  })

  it('sets iframeReady=true on snapshot-ready message', () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn(), canvasTheme: 'light' })
    )
    act(() => { dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' }) })
    expect(result.current.iframeReady).toBe(true)
  })

  it('no-ops when onUpdate is null', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: null, canvasTheme: 'light' })
    )
    await act(async () => { await result.current.requestCapture() })
    expect(cw.postMessage).not.toHaveBeenCalled()
  })

  it('no-ops when iframe not ready', async () => {
    const cw = createMockContentWindow()
    const iframeRef = createMockIframeRef(cw)
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'w1', onUpdate: vi.fn(), canvasTheme: 'light' })
    )
    await act(async () => { await result.current.requestCapture() })
    expect(cw.postMessage).not.toHaveBeenCalled()
  })

  it('sends capture + set-theme + capture + set-theme for dual-theme', async () => {
    const cw = createMockContentWindow()
    // Need a real iframe element for style.visibility
    const style = { visibility: "" }
    
    const iframeRef = { current: { contentWindow: cw, style } }
    const onUpdate = vi.fn()
    const { result } = renderHook(() =>
      useSnapshotCapture({ iframeRef, widgetId: 'test-widget', onUpdate, canvasTheme: 'light' })
    )

    act(() => { dispatchMessage(cw, { type: 'storyboard:embed:snapshot-ready' }) })

    uploadImage
      .mockResolvedValueOnce({ filename: 'snapshot-test-widget--light.webp' })
      .mockResolvedValueOnce({ filename: 'snapshot-test-widget--dark.webp' })

    await act(async () => {
      const promise = result.current.requestCapture()

      // Respond to capture 1 (current=light)
      await new Promise(r => setTimeout(r, 10))
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot', requestId: 1, dataUrl: 'data:image/webp;base64,LIGHT' })

      // Respond to set-theme (switch to dark)
      await new Promise(r => setTimeout(r, 10))
      dispatchMessage(cw, { type: 'storyboard:embed:theme-applied', requestId: 2 })

      // Respond to capture 2 (alternate=dark)
      await new Promise(r => setTimeout(r, 10))
      dispatchMessage(cw, { type: 'storyboard:embed:snapshot', requestId: 3, dataUrl: 'data:image/webp;base64,DARK' })

      // Respond to set-theme back (switch to light)
      await new Promise(r => setTimeout(r, 10))
      dispatchMessage(cw, { type: 'storyboard:embed:theme-applied', requestId: 4 })

      await promise
    })

    // 2 captures + 2 theme switches = 4 postMessages
    expect(cw.postMessage).toHaveBeenCalledTimes(4)
    expect(uploadImage).toHaveBeenCalledTimes(2)
    // Intermediate onUpdate for current theme + final with both
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        snapshotLight: expect.stringContaining('snapshot-test-widget--light.webp'),
      })
    )
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        snapshotLight: expect.stringContaining('snapshot-test-widget--light.webp'),
        snapshotDark: expect.stringContaining('snapshot-test-widget--dark.webp'),
      })
    )
  })
})
