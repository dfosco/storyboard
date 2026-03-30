/**
 * Side Panel Store — manages the open/close state and active tab of the
 * side panel UI.
 *
 * Framework-agnostic state with a Svelte readable interface.
 * Toggles the `sb-sidepanel-open` class on `<html>` so CSS can react
 * to the panel being open (e.g. shifting the main content area).
 */

import { writable, type Readable } from 'svelte/store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SidePanelTab = 'docs' | 'inspector'

export interface SidePanelState {
  /** Whether the side panel is currently open */
  open: boolean
  /** The currently active tab */
  activeTab: SidePanelTab
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const PANEL_CLASS = 'sb-sidepanel-open'

const DEFAULT_STATE: SidePanelState = Object.freeze({
  open: false,
  activeTab: 'docs',
})

const _store = writable<SidePanelState>({ ...DEFAULT_STATE })

// ---------------------------------------------------------------------------
// DOM class sync
// ---------------------------------------------------------------------------

/**
 * Toggle the `sb-sidepanel-open` class on `document.documentElement`
 * to match the current open state. Guarded for SSR.
 */
function _syncDomClass(open: boolean): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(PANEL_CLASS, open)
}

// ---------------------------------------------------------------------------
// Readable store
// ---------------------------------------------------------------------------

/**
 * Readable Svelte store for the side panel state.
 *
 * ```svelte
 * <script>
 *   import { sidePanelState } from '@dfosco/storyboard-core/stores'
 * </script>
 *
 * {#if $sidePanelState.open}
 *   <SidePanel activeTab={$sidePanelState.activeTab} />
 * {/if}
 * ```
 */
export const sidePanelState: Readable<SidePanelState> = { subscribe: _store.subscribe }

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Open the side panel to the given tab.
 *
 * @param tab — The tab to display when the panel opens.
 */
export function openPanel(tab: SidePanelTab): void {
  _store.set({ open: true, activeTab: tab })
  _syncDomClass(true)
}

/**
 * Close the side panel. The active tab is preserved so that
 * re-opening the panel returns to the same tab.
 */
export function closePanel(): void {
  _store.update((s) => ({ ...s, open: false }))
  _syncDomClass(false)
}

/**
 * Toggle the side panel for a specific tab.
 *
 * - If the panel is open **and** already showing this tab → close it.
 * - Otherwise → open the panel to the given tab.
 *
 * @param tab — The tab to toggle.
 */
export function togglePanel(tab: SidePanelTab): void {
  _store.update((s) => {
    const shouldClose = s.open && s.activeTab === tab
    const next: SidePanelState = shouldClose
      ? { ...s, open: false }
      : { open: true, activeTab: tab }
    _syncDomClass(next.open)
    return next
  })
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Reset the side panel store to its default state.
 * Only for use in tests.
 */
export function _resetSidePanel(): void {
  _store.set({ ...DEFAULT_STATE })
  _syncDomClass(false)
}
