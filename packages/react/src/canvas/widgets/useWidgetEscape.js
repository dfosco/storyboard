import { useEffect } from 'react'

/**
 * System-level Escape key handler for canvas widgets.
 *
 * When `active` is true (widget is in edit or interactive mode),
 * registers a document-level keydown listener that calls `exitFn`
 * on Escape. Uses bubble phase so child components (menus, popovers)
 * can handle Escape first — only fires if nothing else stops propagation.
 *
 * Limitation: does NOT work when focus is inside an iframe (events stay
 * in the iframe's browsing context). Widgets with iframes should keep
 * a click-outside handler as a fallback for exiting interactive mode.
 *
 * Usage:
 *   useWidgetEscape(editing, () => setEditing(false))
 *
 * @param {boolean} active - Whether the widget is in an active mode
 * @param {() => void} exitFn - Callback to exit the mode
 */
export default function useWidgetEscape(active, exitFn) {
  useEffect(() => {
    if (!active) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        exitFn()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, exitFn])
}
