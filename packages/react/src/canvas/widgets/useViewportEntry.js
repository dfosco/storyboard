import { useState, useEffect, useRef } from 'react'

const hasIO = typeof IntersectionObserver !== 'undefined'

/**
 * Returns true once the given element has entered (or is near) the viewport.
 * After first intersection the observer disconnects — the flag never resets.
 *
 * Falls back to `true` when IntersectionObserver is unavailable (SSR, jsdom).
 *
 * @param {{ current: Element|null }} ref - React ref to observe
 * @param {string} [rootMargin='400px'] - eagerness margin around viewport
 * @returns {boolean}
 */
export function useViewportEntry(ref, rootMargin = '400px') {
  const [entered, setEntered] = useState(!hasIO)
  const observerRef = useRef(null)

  useEffect(() => {
    if (entered || !hasIO) return
    const node = ref.current
    if (!node) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true)
          observerRef.current?.disconnect()
          observerRef.current = null
        }
      },
      { rootMargin }
    )

    observerRef.current.observe(node)
    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [ref, rootMargin, entered])

  return entered
}
