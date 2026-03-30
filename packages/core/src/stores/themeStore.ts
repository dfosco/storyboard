/**
 * Theme Store — manages the active color scheme for the entire app.
 *
 * Reads/writes `sb-color-scheme` in localStorage, sets the `data-sb-theme`
 * attribute on `<html>`, and dispatches a `storyboard:theme:changed` custom
 * event so that non-Svelte consumers (React ThemeProvider, etc.) can react.
 *
 * Supports a "system" value that follows the OS preference via
 * `prefers-color-scheme`, updating automatically when the user changes
 * their system theme.
 */

import { writable, type Readable } from 'svelte/store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThemeValue =
  | 'system'
  | 'light'
  | 'light_colorblind'
  | 'dark'
  | 'dark_colorblind'
  | 'dark_high_contrast'
  | 'dark_dimmed'

export interface ThemeOption {
  name: string
  value: ThemeValue
}

export interface ThemeState {
  /** The stored theme value (may be "system") */
  theme: ThemeValue
  /** The resolved CSS theme value (never "system") */
  resolved: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'sb-color-scheme'

export const THEMES: ThemeOption[] = [
  { name: 'System', value: 'system' },
  { name: 'Light', value: 'light' },
  { name: 'Light colorblind', value: 'light_colorblind' },
  { name: 'Dark', value: 'dark' },
  { name: 'Dark colorblind', value: 'dark_colorblind' },
  { name: 'Dark high contrast', value: 'dark_high_contrast' },
  { name: 'Dark Dimmed', value: 'dark_dimmed' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSystemTheme(): string {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(value: ThemeValue): string {
  return value === 'system' ? getSystemTheme() : value
}

function readStoredTheme(): ThemeValue {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return 'system'
  // Legacy values (pre-system support) are plain scheme names
  if (stored === 'system') return 'system'
  return stored as ThemeValue
}

function snapshot(theme: ThemeValue): ThemeState {
  return { theme, resolved: resolveTheme(theme) }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let _current: ThemeValue = readStoredTheme()
const _store = writable<ThemeState>(snapshot(_current))

function _applyToDOM(resolved: string): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-sb-theme', resolved)
}

function _dispatchEvent(theme: ThemeValue, resolved: string): void {
  if (typeof document === 'undefined') return
  document.dispatchEvent(
    new CustomEvent('storyboard:theme:changed', {
      detail: { theme, resolved },
    }),
  )
}

/**
 * Set the active theme. Updates localStorage, the DOM attribute,
 * and dispatches a change event.
 */
export function setTheme(value: ThemeValue): void {
  _current = value

  if (typeof localStorage !== 'undefined') {
    if (value === 'system') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, value)
    }
  }

  const state = snapshot(value)
  _store.set(state)
  _applyToDOM(state.resolved)
  _dispatchEvent(value, state.resolved)
}

/**
 * Readable Svelte store for the current theme state.
 */
export const themeState: Readable<ThemeState> = { subscribe: _store.subscribe }

// ---------------------------------------------------------------------------
// OS preference listener
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (_current !== 'system') return
      const state = snapshot('system')
      _store.set(state)
      _applyToDOM(state.resolved)
      _dispatchEvent('system', state.resolved)
    })
}

// ---------------------------------------------------------------------------
// Boot — apply the stored theme immediately on import
// ---------------------------------------------------------------------------

_applyToDOM(resolveTheme(_current))
