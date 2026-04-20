import { useSyncExternalStore } from 'react'

/**
 * Returns true when embed refreshes are paused globally.
 * Tracks the `storyboard-embeds-paused` class on <html>.
 */
function subscribe(callback) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

function getSnapshot() {
  return document.documentElement.classList.contains('storyboard-embeds-paused')
}

export function useEmbedsPaused() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
