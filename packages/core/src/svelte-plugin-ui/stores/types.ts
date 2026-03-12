/**
 * Type declarations for the core modes API.
 *
 * Re-exports the core functions with proper TypeScript signatures
 * so Svelte components and stores get full type safety.
 */

// Re-export from core modes (sibling module within @dfosco/storyboard-core)
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
  getToolsForMode,
  subscribeToTools,
  getToolsSnapshot,
} from '../../modes.js'

export interface ModeConfig {
  name: string
  label: string
  icon?: string
  className?: string | string[]
  onActivate?: (options?: Record<string, unknown>) => void
  onDeactivate?: () => void
}

export interface ToolState {
  enabled: boolean
  active: boolean
  busy: boolean
  hidden: boolean
  badge: string | number | null
}

export interface ResolvedTool {
  id: string
  label: string
  group: 'tools' | 'dev'
  icon: string | null
  order: number
  modes: string[]
  state: ToolState
  action: (() => void) | null
}
