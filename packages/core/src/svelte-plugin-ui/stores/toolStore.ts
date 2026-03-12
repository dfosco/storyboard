/**
 * Svelte store that wraps the core tool registry API.
 *
 * Provides a readable store whose value updates whenever:
 * - The active mode changes (different tools for each mode)
 * - Tool state or actions change (setToolState, setToolAction)
 *
 * Groups tools into { tools, devTools } for the toolbar to consume.
 */

import { writable, type Readable } from 'svelte/store'
import {
  getCurrentMode,
  getToolsForMode,
  subscribeToMode,
  subscribeToTools,
} from './types.js'
import type { ResolvedTool } from './types.js'

export interface ToolStoreState {
  /** Tools in the 'tools' group for the current mode */
  tools: ResolvedTool[]
  /** Tools in the 'dev' group for the current mode */
  devTools: ResolvedTool[]
}

function snapshot(): ToolStoreState {
  const mode = getCurrentMode()
  const allTools = getToolsForMode(mode)
  return {
    tools: allTools.filter((t) => t.group === 'tools'),
    devTools: allTools.filter((t) => t.group === 'dev'),
  }
}

function createToolStore(): Readable<ToolStoreState> {
  const { subscribe: rawSubscribe, set } = writable<ToolStoreState>(snapshot())

  const subscribe: Readable<ToolStoreState>['subscribe'] = (run, invalidate) => {
    set(snapshot())

    // Re-snapshot on mode changes OR tool state/action changes
    const unsubMode = subscribeToMode(() => set(snapshot()))
    const unsubTools = subscribeToTools(() => set(snapshot()))

    const unsubStore = rawSubscribe(run, invalidate)

    return () => {
      unsubStore()
      unsubMode()
      unsubTools()
    }
  }

  return { subscribe }
}

/**
 * Readable Svelte store for the tool registry.
 *
 * ```svelte
 * <script>
 *   import { toolState } from '../stores/toolStore.js'
 * </script>
 *
 * {#each $toolState.tools as tool}
 *   <button onclick={tool.action} disabled={!tool.state.enabled}>{tool.label}</button>
 * {/each}
 * ```
 */
export const toolState: Readable<ToolStoreState> = createToolStore()
