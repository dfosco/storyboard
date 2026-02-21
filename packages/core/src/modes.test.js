import {
  registerMode,
  unregisterMode,
  getRegisteredModes,
  getCurrentMode,
  activateMode,
  deactivateMode,
  subscribeToMode,
  getModeSnapshot,
  on,
  off,
  emit,
  _resetModes,
} from './modes.js'

afterEach(() => {
  _resetModes()
  const url = new URL(window.location.href)
  url.searchParams.delete('mode')
  window.history.replaceState(null, '', url.toString())
})

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe('registry', () => {
  it('registerMode adds a mode to the registry', () => {
    registerMode('prototype', { label: 'Prototype' })
    expect(getRegisteredModes()).toEqual([{ name: 'prototype', label: 'Prototype' }])
  })

  it('warns when overwriting an existing mode', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    registerMode('prototype', { label: 'V1' })
    registerMode('prototype', { label: 'V2' })
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('overwriting'))
    spy.mockRestore()
  })

  it('getRegisteredModes returns modes in insertion order', () => {
    registerMode('a', { label: 'A' })
    registerMode('b', { label: 'B' })
    registerMode('c', { label: 'C' })
    const names = getRegisteredModes().map((m) => m.name)
    expect(names).toEqual(['a', 'b', 'c'])
  })

  it('unregisterMode removes a mode', () => {
    registerMode('present', { label: 'Present' })
    unregisterMode('present')
    expect(getRegisteredModes()).toEqual([])
  })

  it('cannot unregister the default mode', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    registerMode('prototype', { label: 'Prototype' })
    unregisterMode('prototype')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Cannot unregister'))
    expect(getRegisteredModes()).toHaveLength(1)
    spy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// getCurrentMode
// ---------------------------------------------------------------------------

describe('getCurrentMode', () => {
  it('returns "prototype" by default', () => {
    expect(getCurrentMode()).toBe('prototype')
  })

  it('reads the ?mode= search param when mode is registered', () => {
    registerMode('present', { label: 'Present' })
    const url = new URL(window.location.href)
    url.searchParams.set('mode', 'present')
    window.history.replaceState(null, '', url.toString())

    expect(getCurrentMode()).toBe('present')
  })

  it('ignores unregistered modes in the URL param', () => {
    const url = new URL(window.location.href)
    url.searchParams.set('mode', 'nonexistent')
    window.history.replaceState(null, '', url.toString())

    expect(getCurrentMode()).toBe('prototype')
  })
})

// ---------------------------------------------------------------------------
// activateMode
// ---------------------------------------------------------------------------

describe('activateMode', () => {
  it('updates the ?mode= URL param', () => {
    registerMode('prototype', { label: 'Prototype' })
    registerMode('present', { label: 'Present' })
    activateMode('present')

    const url = new URL(window.location.href)
    expect(url.searchParams.get('mode')).toBe('present')
  })

  it('calls onDeactivate on the previous mode and onActivate on the new', () => {
    const deactivate = vi.fn()
    const activate = vi.fn()
    registerMode('prototype', { label: 'Prototype', onDeactivate: deactivate })
    registerMode('present', { label: 'Present', onActivate: activate })

    activateMode('present')
    expect(deactivate).toHaveBeenCalledTimes(1)
    expect(activate).toHaveBeenCalledTimes(1)
  })

  it('is a no-op when activating the already-active mode', () => {
    const activate = vi.fn()
    registerMode('prototype', { label: 'Prototype', onActivate: activate })
    // prototype is already active by default
    activateMode('prototype')
    expect(activate).not.toHaveBeenCalled()
  })

  it('warns when activating an unregistered mode', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    activateMode('unknown')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('not registered'))
    spy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// deactivateMode
// ---------------------------------------------------------------------------

describe('deactivateMode', () => {
  it('returns to prototype mode', () => {
    registerMode('prototype', { label: 'Prototype' })
    registerMode('present', { label: 'Present' })
    activateMode('present')
    deactivateMode()
    expect(getCurrentMode()).toBe('prototype')
  })

  it('removes the ?mode= URL param', () => {
    registerMode('prototype', { label: 'Prototype' })
    registerMode('present', { label: 'Present' })
    activateMode('present')
    deactivateMode()

    const url = new URL(window.location.href)
    expect(url.searchParams.has('mode')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

describe('subscribeToMode', () => {
  it('callback fires on activateMode', () => {
    const cb = vi.fn()
    registerMode('prototype', { label: 'Prototype' })
    registerMode('present', { label: 'Present' })
    const unsub = subscribeToMode(cb)

    activateMode('present')
    expect(cb).toHaveBeenCalled()
    unsub()
  })

  it('callback fires on registerMode', () => {
    const cb = vi.fn()
    const unsub = subscribeToMode(cb)

    registerMode('new-mode', { label: 'New' })
    expect(cb).toHaveBeenCalled()
    unsub()
  })

  it('unsubscribe stops further calls', () => {
    const cb = vi.fn()
    registerMode('prototype', { label: 'Prototype' })
    registerMode('present', { label: 'Present' })
    const unsub = subscribeToMode(cb)
    unsub()

    activateMode('present')
    expect(cb).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// getModeSnapshot
// ---------------------------------------------------------------------------

describe('getModeSnapshot', () => {
  it('changes when mode changes', () => {
    registerMode('prototype', { label: 'Prototype' })
    registerMode('present', { label: 'Present' })
    const snap1 = getModeSnapshot()

    activateMode('present')
    const snap2 = getModeSnapshot()
    expect(snap1).not.toBe(snap2)
  })

  it('changes when registry changes', () => {
    registerMode('prototype', { label: 'Prototype' })
    const snap1 = getModeSnapshot()

    registerMode('present', { label: 'Present' })
    const snap2 = getModeSnapshot()
    expect(snap1).not.toBe(snap2)
  })
})

// ---------------------------------------------------------------------------
// Event bus
// ---------------------------------------------------------------------------

describe('event bus', () => {
  it('on/emit fires the callback with arguments', () => {
    const cb = vi.fn()
    on('test:event', cb)
    emit('test:event', 'a', 'b')
    expect(cb).toHaveBeenCalledWith('a', 'b')
  })

  it('off removes the listener', () => {
    const cb = vi.fn()
    on('test:event', cb)
    off('test:event', cb)
    emit('test:event')
    expect(cb).not.toHaveBeenCalled()
  })

  it('emit with no listeners does not throw', () => {
    expect(() => emit('nonexistent')).not.toThrow()
  })

  it('catches errors thrown by listeners', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    on('bad', () => { throw new Error('boom') })
    expect(() => emit('bad')).not.toThrow()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
