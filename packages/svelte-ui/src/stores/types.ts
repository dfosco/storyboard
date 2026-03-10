/**
 * Type declarations for @dfosco/storyboard-core modes API.
 *
 * Re-exports the core functions with proper TypeScript signatures
 * so Svelte components and stores get full type safety.
 */

// Re-export from core with type annotations
export {
  getCurrentMode,
  getRegisteredModes,
  activateMode,
  deactivateMode,
  subscribeToMode,
  getModeSnapshot,
  registerMode,
  unregisterMode,
  syncModeClasses,
  on,
  off,
  emit,
} from '@dfosco/storyboard-core'

export interface ModeToolConfig {
  id: string
  label: string
  action: () => void
}

export interface ModeConfig {
  name: string
  label: string
  icon?: string
  className?: string | string[]
  onActivate?: (options?: Record<string, unknown>) => void
  onDeactivate?: () => void
  tools?: ModeToolConfig[]
  devTools?: ModeToolConfig[]
}
