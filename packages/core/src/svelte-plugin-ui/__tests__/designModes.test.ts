import { describe, it, expect, afterEach } from 'vitest'
import {
  registerMode,
} from '@dfosco/storyboard-core'
import { _resetModes } from '@test/modes'
import { mountDesignModesUI, unmountDesignModesUI } from '../plugins/design-modes.js'

afterEach(() => {
  unmountDesignModesUI()
  _resetModes()
  document.body.innerHTML = ''
  const url = new URL(window.location.href)
  url.searchParams.delete('mode')
  window.history.replaceState(null, '', url.toString())
})

describe('mountDesignModesUI', () => {
  it('mounts ModeSwitch and ToolbarShell into the target', () => {
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })

    mountDesignModesUI(document.body)

    const roots = document.querySelectorAll('.sb-plugin-root')
    expect(roots.length).toBe(2)
  })

  it('is idempotent — calling twice does not double-mount', () => {
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })

    mountDesignModesUI(document.body)
    mountDesignModesUI(document.body)

    const roots = document.querySelectorAll('.sb-plugin-root')
    expect(roots.length).toBe(2)
  })

  it('unmount removes all mounted components', () => {
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })

    const teardown = mountDesignModesUI(document.body)
    expect(document.querySelectorAll('.sb-plugin-root').length).toBe(2)

    teardown()
    expect(document.querySelectorAll('.sb-plugin-root').length).toBe(0)
  })

  it('defaults to document.body when no container given', () => {
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })

    mountDesignModesUI()

    expect(document.body.querySelectorAll('.sb-plugin-root').length).toBe(2)
  })
})
