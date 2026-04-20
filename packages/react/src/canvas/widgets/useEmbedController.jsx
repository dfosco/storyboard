/**
 * Embed Controller — manages iframe lifecycle for canvas embed widgets.
 *
 * Behaviors:
 * - Performance mode (per-canvas setting): embeds don't render until clicked
 * - Viewport threshold: if >7 embeds visible, none render (zoom in to reduce)
 * - Viewport exit: embeds deactivate 5s after leaving the viewport
 *
 * Usage:
 *   <EmbedControllerProvider performanceMode={bool} scrollRef={ref}>
 *     <StoryWidget ... />
 *   </EmbedControllerProvider>
 *
 *   // Inside a widget:
 *   const { active, activate } = useEmbedActive(widgetId, containerRef)
 */
import { createContext, useContext, useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

const DEACTIVATE_DELAY = 5000
const MAX_VISIBLE_EMBEDS = 7

// ── Shared state (module-level, one per page) ──────────────────────────

let performanceMode = false
let visibleEmbedIds = new Set()
let activeEmbedIds = new Set()
let manuallyActivatedIds = new Set()
let listeners = new Set()

function notify() {
  for (const fn of listeners) fn()
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function setPerformanceMode(value) {
  performanceMode = value
  if (value) {
    // Entering perf mode: deactivate all non-manually-activated embeds
    activeEmbedIds = new Set(manuallyActivatedIds)
  }
  notify()
}

function getPerformanceMode() {
  return performanceMode
}

function registerEmbed(id) {
  // In normal mode with few embeds, auto-activate
  if (!performanceMode && visibleEmbedIds.size <= MAX_VISIBLE_EMBEDS) {
    activeEmbedIds.add(id)
  }
  notify()
}

function unregisterEmbed(id) {
  visibleEmbedIds.delete(id)
  activeEmbedIds.delete(id)
  manuallyActivatedIds.delete(id)
  notify()
}

function markVisible(id) {
  visibleEmbedIds.add(id)
  // Auto-activate if not in perf mode and under threshold
  if (!performanceMode && visibleEmbedIds.size <= MAX_VISIBLE_EMBEDS) {
    activeEmbedIds.add(id)
  }
  // If was manually activated, keep it active
  if (manuallyActivatedIds.has(id)) {
    activeEmbedIds.add(id)
  }
  notify()
}

function markHidden(id) {
  visibleEmbedIds.delete(id)
  // Check if other embeds should now activate (dropped below threshold)
  if (!performanceMode && visibleEmbedIds.size <= MAX_VISIBLE_EMBEDS) {
    for (const vid of visibleEmbedIds) {
      activeEmbedIds.add(vid)
    }
  }
  notify()
}

function deactivateEmbed(id) {
  activeEmbedIds.delete(id)
  manuallyActivatedIds.delete(id)
  notify()
}

function activateEmbed(id) {
  activeEmbedIds.add(id)
  manuallyActivatedIds.add(id)
  notify()
}

function isActive(id) {
  return activeEmbedIds.has(id)
}

function isTooManyVisible() {
  return visibleEmbedIds.size > MAX_VISIBLE_EMBEDS
}

// ── React context ──────────────────────────────────────────────────────

const EmbedControllerContext = createContext(null)

export function EmbedControllerProvider({ performanceMode: perfModeProp, scrollRef, children }) {
  // Sync prop to module state
  useEffect(() => {
    setPerformanceMode(perfModeProp)
  }, [perfModeProp])

  // Reset on unmount
  useEffect(() => {
    return () => {
      visibleEmbedIds = new Set()
      activeEmbedIds = new Set()
      manuallyActivatedIds = new Set()
      performanceMode = false
      notify()
    }
  }, [])

  return (
    <EmbedControllerContext.Provider value={scrollRef}>
      {children}
    </EmbedControllerContext.Provider>
  )
}

/**
 * Hook for embed widgets. Returns { active, activate, performanceMode, tooMany }.
 * - active: whether the iframe should be rendered
 * - activate: call to manually activate (user clicked)
 * - performanceMode: whether perf mode is on
 * - tooMany: whether there are too many visible embeds
 */
export function useEmbedActive(widgetId, containerRef) {
  const scrollRef = useContext(EmbedControllerContext)
  const deactivateTimerRef = useRef(null)

  // Subscribe to state changes
  const snapshot = useSyncExternalStore(subscribe, () => ({
    active: isActive(widgetId),
    performanceMode: getPerformanceMode(),
    tooMany: isTooManyVisible(),
  }), () => ({
    active: false,
    performanceMode: false,
    tooMany: false,
  }))

  // Need a stable reference check since useSyncExternalStore compares by reference
  const activeRef = useRef(false)
  const perfRef = useRef(false)
  const tooManyRef = useRef(false)

  const active = isActive(widgetId)
  const perf = getPerformanceMode()
  const tooMany = isTooManyVisible()

  if (activeRef.current !== active || perfRef.current !== perf || tooManyRef.current !== tooMany) {
    activeRef.current = active
    perfRef.current = perf
    tooManyRef.current = tooMany
  }

  // Register/unregister
  useEffect(() => {
    registerEmbed(widgetId)
    return () => {
      unregisterEmbed(widgetId)
      if (deactivateTimerRef.current) clearTimeout(deactivateTimerRef.current)
    }
  }, [widgetId])

  // IntersectionObserver for viewport tracking
  useEffect(() => {
    const el = containerRef?.current
    if (!el) return

    const root = scrollRef?.current || null

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Entered viewport
          if (deactivateTimerRef.current) {
            clearTimeout(deactivateTimerRef.current)
            deactivateTimerRef.current = null
          }
          markVisible(widgetId)
        } else {
          // Left viewport — start deactivation timer
          markHidden(widgetId)
          if (deactivateTimerRef.current) clearTimeout(deactivateTimerRef.current)
          deactivateTimerRef.current = setTimeout(() => {
            deactivateEmbed(widgetId)
            deactivateTimerRef.current = null
          }, DEACTIVATE_DELAY)
        }
      },
      { root, threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [widgetId, containerRef, scrollRef])

  const activate = useCallback(() => {
    activateEmbed(widgetId)
  }, [widgetId])

  return { active, activate, performanceMode: perf, tooMany }
}
