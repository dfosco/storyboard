import { describe, it, expect, afterEach } from 'vitest'
import { get } from 'svelte/store'
import {
  registerMode,
  activateMode,
} from '@dfosco/storyboard-core'
import { _resetModes } from '@test/modes'
import { modeState, switchMode } from '../stores/modeStore.js'

afterEach(() => {
  _resetModes()
  const url = new URL(window.location.href)
  url.searchParams.delete('mode')
  window.history.replaceState(null, '', url.toString())
})

describe('modeState store', () => {
  it('returns default mode when no modes are registered', () => {
    const state = get(modeState)
    expect(state.mode).toBe('prototype')
    expect(state.modes).toEqual([])
    expect(state.currentModeConfig).toBeUndefined()
  })

  it('reflects registered modes', () => {
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })

    const state = get(modeState)
    expect(state.modes).toHaveLength(2)
    expect(state.modes[0]).toMatchObject({ name: 'prototype', label: 'Navigate' })
    expect(state.modes[1]).toMatchObject({ name: 'inspect', label: 'Develop' })
  })

  it('tracks the active mode', () => {
    registerMode('prototype', { label: 'Navigate' })
    registerMode('inspect', { label: 'Develop' })

    expect(get(modeState).mode).toBe('prototype')

    activateMode('inspect')
    expect(get(modeState).mode).toBe('inspect')
    expect(get(modeState).currentModeConfig?.name).toBe('inspect')
  })

  it('updates via switchMode helper', () => {
    registerMode('prototype', { label: 'Navigate' })
    registerMode('present', { label: 'Collaborate' })

    switchMode('present')
    expect(get(modeState).mode).toBe('present')
  })
})
