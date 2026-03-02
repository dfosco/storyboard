import { useSyncExternalStore } from 'react'
import { getFlag, subscribeToHash, getHashSnapshot, subscribeToStorage, getStorageSnapshot } from '@dfosco/storyboard-core'

/**
 * React hook for reading a feature flag value.
 * Re-renders when the flag changes (via hash or localStorage).
 *
 * @param {string} key - Flag key (without "flag." prefix)
 * @returns {boolean} Current resolved flag value
 */
export function useFeatureFlag(key) {
  // Subscribe to both hash and storage changes for reactivity
  useSyncExternalStore(subscribeToHash, getHashSnapshot)
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  return getFlag(key)
}
