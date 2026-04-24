import { useSyncExternalStore, useCallback } from 'react'
import { getConfig, subscribeToConfig, getConfigSnapshot } from '@dfosco/storyboard-core'

/**
 * React hook for reading from the unified config store.
 *
 * @param {string} [domain] - Optional domain key (e.g. 'toolbar', 'canvas')
 * @returns {object} The config object (full or domain slice)
 */
export function useConfig(domain) {
  const snapshot = useSyncExternalStore(subscribeToConfig, getConfigSnapshot)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(() => getConfig(domain), [snapshot, domain])()
}
