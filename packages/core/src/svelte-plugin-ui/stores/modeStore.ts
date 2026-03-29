/**
 * Svelte store that wraps the core modes.js API.
 *
 * Provides a readable store whose value updates whenever the active mode
 * or the set of registered modes changes.  Uses subscribeToMode() from
 * @dfosco/storyboard-core so it stays in sync with any other consumer
 * (React hooks, vanilla JS, etc.).
 */

import { writable, type Readable } from 'svelte/store'
import {
  getCurrentMode,
  getRegisteredModes,
  activateMode,
  subscribeToMode,
  isModeSwitcherVisible,
} from './types.js'
import type { ModeConfig } from './types.js'

export interface ModeState {
  /** Currently active mode name */
  mode: string
  /** All registered modes */
  modes: ModeConfig[]
  /** Config object for the active mode */
  currentModeConfig: ModeConfig | undefined
  /** Whether the mode switcher should be visible */
  switcherVisible: boolean
}

function snapshot(): ModeState {
  const mode = getCurrentMode()
  const modes = getRegisteredModes()
  return {
    mode,
    modes,
    currentModeConfig: modes.find((m) => m.name === mode),
    switcherVisible: isModeSwitcherVisible(),
  }
}

/**
 * Create the mode state store.
 *
 * Uses a writable internally but exposes only a readable interface.
 * Subscribes to the core modes API whenever there are active subscribers,
 * and always provides a fresh snapshot on subscribe.
 */
function createModeStore(): Readable<ModeState> {
  const { subscribe: rawSubscribe, set } = writable<ModeState>(snapshot())

  const subscribe: Readable<ModeState>['subscribe'] = (run, invalidate) => {
    // Always give the subscriber the latest snapshot immediately
    set(snapshot())

    // Subscribe to core mode changes while there are Svelte subscribers
    const unsubCore = subscribeToMode(() => set(snapshot()))

    const unsubStore = rawSubscribe(run, invalidate)

    return () => {
      unsubStore()
      unsubCore()
    }
  }

  return { subscribe }
}

/**
 * Readable Svelte store for the design-mode system.
 *
 * ```svelte
 * <script>
 *   import { modeState, switchMode } from '@dfosco/storyboard-core/svelte-plugin-ui'
 * </script>
 *
 * {#each $modeState.modes as m}
 *   <button on:click={() => switchMode(m.name)}>{m.label}</button>
 * {/each}
 * ```
 */
export const modeState: Readable<ModeState> = createModeStore()

/**
 * Switch to a registered mode.  Thin wrapper around activateMode —
 * the store updates automatically via the subscription.
 */
export function switchMode(name: string, options?: Record<string, unknown>): void {
  activateMode(name, options)
}
