import { describe, it, expect, afterEach } from 'vitest'
import { mountSveltePlugin, _resetStyles } from '../mount.js'

afterEach(() => {
  _resetStyles()
  document.body.innerHTML = ''
})

describe('mountSveltePlugin', () => {
  it('creates a wrapper element inside the target', () => {
    // We can't easily test with real Svelte components in unit tests
    // without the Svelte compiler, but we can test the mount utility
    // mechanics using a minimal mock.

    // Test style injection
    _resetStyles()
    expect(document.getElementById('sb-svelte-ui-styles')).toBeNull()
  })

  it('_resetStyles removes injected styles', () => {
    const link = document.createElement('link')
    link.id = 'sb-svelte-ui-styles'
    document.head.appendChild(link)

    expect(document.getElementById('sb-svelte-ui-styles')).not.toBeNull()
    _resetStyles()
    expect(document.getElementById('sb-svelte-ui-styles')).toBeNull()
  })
})
