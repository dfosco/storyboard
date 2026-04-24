/**
 * useSplitRestore — listens for the `storyboard:restore-split` event
 * and calls setExpanded(true) when this widget is the primary target.
 */
import { useEffect } from 'react'

export default function useSplitRestore(widgetId, setExpanded) {
  useEffect(() => {
    function onRestore(e) {
      if (e.detail?.primaryId === widgetId) setExpanded(true)
    }
    document.addEventListener('storyboard:restore-split', onRestore)
    return () => document.removeEventListener('storyboard:restore-split', onRestore)
  }, [widgetId, setExpanded])
}
