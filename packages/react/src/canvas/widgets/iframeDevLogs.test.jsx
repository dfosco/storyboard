import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useIframeDevLogs } from './iframeDevLogs.js'

function Probe({ widget = 'Probe', loaded = false, src = '/test' }) {
  useIframeDevLogs({ widget, loaded, src })
  return null
}

describe('useIframeDevLogs', () => {
  let infoSpy

  beforeEach(() => {
    window.__SB_LOCAL_DEV__ = true
    window.localStorage.setItem('flag.dev-logs', 'true')
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    infoSpy.mockRestore()
    window.localStorage.removeItem('flag.dev-logs')
    delete window.__SB_LOCAL_DEV__
  })

  it('logs iframe load and unload with tally', () => {
    const { rerender, unmount } = render(<Probe loaded={false} src="/alpha" />)
    rerender(<Probe loaded src="/alpha" />)
    rerender(<Probe loaded={false} src="/alpha" />)

    expect(infoSpy).toHaveBeenNthCalledWith(
      1,
      '[storyboard][iframe] loaded (1) Probe: /alpha',
    )
    expect(infoSpy).toHaveBeenNthCalledWith(
      2,
      '[storyboard][iframe] unloaded (0) Probe: /alpha',
    )

    unmount()
  })

  it('tracks tally across multiple loaded iframes', () => {
    const first = render(<Probe widget="PrototypeEmbed" loaded src="/proto" />)
    const second = render(<Probe widget="FigmaEmbed" loaded src="/figma" />)

    expect(infoSpy).toHaveBeenNthCalledWith(
      1,
      '[storyboard][iframe] loaded (1) PrototypeEmbed: /proto',
    )
    expect(infoSpy).toHaveBeenNthCalledWith(
      2,
      '[storyboard][iframe] loaded (2) FigmaEmbed: /figma',
    )

    first.unmount()
    expect(infoSpy).toHaveBeenNthCalledWith(
      3,
      '[storyboard][iframe] unloaded (1) PrototypeEmbed: /proto',
    )

    second.unmount()
    expect(infoSpy).toHaveBeenNthCalledWith(
      4,
      '[storyboard][iframe] unloaded (0) FigmaEmbed: /figma',
    )
  })

  it('does not log when dev-logs flag is disabled', () => {
    window.localStorage.setItem('flag.dev-logs', 'false')
    const { rerender, unmount } = render(<Probe loaded={false} src="/off" />)
    rerender(<Probe loaded src="/off" />)
    rerender(<Probe loaded={false} src="/off" />)

    expect(infoSpy).not.toHaveBeenCalled()
    unmount()
  })
})
