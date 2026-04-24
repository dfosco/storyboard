/**
 * ModeSwitch — segmented toggle for switching between design modes.
 *
 * Renders as a fixed pill at the bottom-center of the viewport.
 * Only visible when two or more modes are registered.
 */

import React, { useSyncExternalStore } from 'react'
import './ModeSwitch.css'
import { modeState, switchMode } from '../stores/modeStore.js'

function subscribeModeState(callback) {
  return modeState.subscribe(callback)
}

function getSnapshotModeState() {
  let current
  const unsub = modeState.subscribe((v) => { current = v })
  unsub()
  return current
}

export function ModeSwitch() {
  const state = useSyncExternalStore(subscribeModeState, getSnapshotModeState)

  if (!state?.switcherVisible || !state?.modes || state.modes.length < 2) {
    return null
  }

  return (
    <div className="sb-mode-switch" role="tablist" aria-label="Design mode">
      {state.modes.map((m) => (
        <button
          key={m.name}
          role="tab"
          aria-selected={state.mode === m.name}
          className={`sb-mode-btn${state.mode === m.name ? ' sb-mode-btn-active' : ''}`}
          onClick={() => switchMode(m.name)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

export default ModeSwitch
