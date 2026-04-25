/**
 * ExpandedPane — unified full-screen expand/split-screen portal for canvas widgets.
 *
 * Supports two display variants for single-pane mode:
 *   - "modal" — 90vw × 90vh centered card (prototype, figma, markdown, link-preview)
 *   - "full"  — fixed inset 0, no border-radius (terminal, agent)
 *
 * Multi-pane (split-screen) always uses "full" layout with CSS grid columns.
 *
 * Each pane provides either:
 *   - kind: 'react' + render prop (for normal React content)
 *   - kind: 'external' + attach/detach (for imperative DOM like terminals/iframes)
 *
 * ExpandedPane owns container measurement and ResizeObserver. It notifies external
 * panes via onResize(rect) when their container dimensions change, so they don't
 * have to guess layout timing.
 */
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import ExpandedPaneTopBar from './ExpandedPaneTopBar.jsx'
import styles from './ExpandedPane.module.css'

const MIN_PANE_WIDTH_PX = 120

/**
 * @typedef {Object} ReactPane
 * @property {string} id — stable identifier (widgetId)
 * @property {string} label — display label for top bar
 * @property {'react'} kind
 * @property {() => React.ReactNode} render — returns React content for the pane
 */

/**
 * @typedef {Object} ExternalPane
 * @property {string} id — stable identifier (widgetId)
 * @property {string} label — display label for top bar
 * @property {'external'} kind
 * @property {(container: HTMLElement) => (() => void)} attach — mount into container, return detach
 * @property {(rect: DOMRect) => void} [onResize] — called when container resizes
 */

/**
 * @typedef {ReactPane | ExternalPane} PaneConfig
 */

/**
 * @param {Object} props
 * @param {PaneConfig[]} props.initialPanes — initial pane configurations
 * @param {'modal' | 'full'} [props.variant='modal'] — single-pane display variant
 * @param {() => void} props.onClose — close callback
 * @param {((panes: PaneConfig[]) => void)} [props.onPanesChange] — notify parent of pane changes
 */
export default function ExpandedPane({ initialPanes, variant = 'modal', onClose, onPanesChange }) {
  const [panes, setPanes] = useState(() => initialPanes)
  const [columnSizes, setColumnSizes] = useState(() => initialPanes.map(() => '1fr'))
  const [activePaneIndex, setActivePaneIndex] = useState(0)

  // Ref map: paneId → container DOM element (callback refs)
  const containerRefs = useRef(new Map())
  // Ref map: paneId → detach cleanup function
  const detachRefs = useRef(new Map())
  // Ref map: paneId → ResizeObserver
  const observerRefs = useRef(new Map())

  const isSplit = panes.length >= 2
  const useFullLayout = isSplit || variant === 'full'

  // ── External pane attach/detach via useLayoutEffect ──
  // Keyed by pane id to avoid teardown on reorder.
  useLayoutEffect(() => {
    for (const pane of panes) {
      if (pane.kind !== 'external') continue
      const container = containerRefs.current.get(pane.id)
      if (!container) continue
      // Already attached to this container
      if (detachRefs.current.has(pane.id)) continue
      const detach = pane.attach(container)
      detachRefs.current.set(pane.id, detach)
    }
    return () => {
      // On unmount, detach all external panes
      for (const [id, detach] of detachRefs.current) {
        detach?.()
      }
      detachRefs.current.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — intentional mount-only

  // Handle pane list changes: attach new external panes, detach removed ones
  useLayoutEffect(() => {
    const currentIds = new Set(panes.map(p => p.id))

    // Detach removed panes
    for (const [id, detach] of detachRefs.current) {
      if (!currentIds.has(id)) {
        detach?.()
        detachRefs.current.delete(id)
        observerRefs.current.get(id)?.disconnect()
        observerRefs.current.delete(id)
      }
    }

    // Attach new external panes
    for (const pane of panes) {
      if (pane.kind !== 'external') continue
      if (detachRefs.current.has(pane.id)) continue
      const container = containerRefs.current.get(pane.id)
      if (!container) continue
      const detach = pane.attach(container)
      detachRefs.current.set(pane.id, detach)
    }
  }) // runs every render to catch pane changes

  // ── ResizeObserver per external pane ──
  useEffect(() => {
    for (const pane of panes) {
      if (pane.kind !== 'external' || !pane.onResize) continue
      if (observerRefs.current.has(pane.id)) continue
      const container = containerRefs.current.get(pane.id)
      if (!container) continue
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          pane.onResize(entry.contentRect)
        }
      })
      ro.observe(container)
      observerRefs.current.set(pane.id, ro)
    }
    return () => {
      for (const ro of observerRefs.current.values()) {
        ro.disconnect()
      }
      observerRefs.current.clear()
    }
  }, [panes])

  // ── Callback ref factory: stable per pane id ──
  const getContainerRef = useCallback((paneId) => (el) => {
    if (el) {
      containerRefs.current.set(paneId, el)
    } else {
      containerRefs.current.delete(paneId)
    }
  }, [])

  // ── Escape to close ──
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [onClose])

  // ── Drag-to-resize dividers ──
  const dragState = useRef(null)

  const handleDividerPointerDown = useCallback((e, dividerIndex) => {
    e.preventDefault()
    const gridEl = e.target.closest(`.${styles.grid}`)
    if (!gridEl) return
    const gridWidth = gridEl.getBoundingClientRect().width
    const dividerCount = panes.length - 1

    // Convert current columnSizes to pixel widths
    const currentCols = Array.from(gridEl.children)
      .filter(el => !el.classList.contains(styles.divider))
      .map(el => el.getBoundingClientRect().width)

    dragState.current = {
      dividerIndex,
      startX: e.clientX,
      startWidths: currentCols,
      gridWidth,
      dividerCount,
    }

    function handleMove(ev) {
      if (!dragState.current) return
      const { dividerIndex: di, startX, startWidths, gridWidth: gw } = dragState.current
      const dx = ev.clientX - startX
      const leftW = Math.max(MIN_PANE_WIDTH_PX, startWidths[di] + dx)
      const rightW = Math.max(MIN_PANE_WIDTH_PX, startWidths[di + 1] - dx)
      const newWidths = [...startWidths]
      newWidths[di] = leftW
      newWidths[di + 1] = rightW
      // Convert to fr units relative to grid
      const total = newWidths.reduce((a, b) => a + b, 0)
      setColumnSizes(newWidths.map(w => `${(w / total * panes.length).toFixed(3)}fr`))
    }

    function handleUp() {
      dragState.current = null
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }, [panes.length])

  // ── Build grid-template-columns including divider widths ──
  const gridTemplateColumns = useMemo(() => {
    if (!isSplit) return undefined
    // Interleave pane columns with thin divider columns
    const parts = []
    for (let i = 0; i < columnSizes.length; i++) {
      if (i > 0) parts.push('0px') // divider takes no grid space, it overlaps
      parts.push(columnSizes[i])
    }
    return parts.join(' ')
  }, [isSplit, columnSizes])

  // ── Render pane content ──
  function renderPaneContent(pane) {
    if (pane.kind === 'react') {
      return (
        <div
          ref={getContainerRef(pane.id)}
          className={styles.paneContent}
          onPointerDown={() => setActivePaneIndex(panes.indexOf(pane))}
        >
          {pane.render()}
        </div>
      )
    }
    // External panes get an empty container that attach() populates
    return (
      <div
        ref={getContainerRef(pane.id)}
        className={styles.paneContent}
        onPointerDown={() => setActivePaneIndex(panes.indexOf(pane))}
      />
    )
  }

  // ── Single-pane modal variant ──
  if (!isSplit && variant === 'modal') {
    const pane = panes[0]
    if (!pane) return null
    return createPortal(
      <div
        className={styles.backdrop}
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalTopBar}>
            <span className={styles.modalTitle}>{pane.label}</span>
            <button
              className={styles.modalCloseBtn}
              onClick={onClose}
              aria-label="Close expanded view"
              autoFocus
            >
              ✕
            </button>
          </div>
          <div className={styles.modalBody}>
            {renderPaneContent(pane)}
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  // ── Full layout (single-pane full or multi-pane split) ──
  return createPortal(
    <div
      className={styles.fullContainer}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <ExpandedPaneTopBar
        panes={panes}
        activePaneIndex={activePaneIndex}
        onClose={onClose}
      />
      {isSplit ? (
        <div
          className={styles.grid}
          style={{ gridTemplateColumns }}
        >
          {panes.map((pane, i) => (
            <PaneWithDivider
              key={pane.id}
              pane={pane}
              index={i}
              isLast={i === panes.length - 1}
              onDividerPointerDown={handleDividerPointerDown}
            >
              {renderPaneContent(pane)}
            </PaneWithDivider>
          ))}
        </div>
      ) : (
        <div className={styles.singleFull}>
          {renderPaneContent(panes[0])}
        </div>
      )}
    </div>,
    document.body,
  )
}

/**
 * Renders a pane cell in the grid, optionally followed by a divider.
 */
function PaneWithDivider({ pane, index, isLast, onDividerPointerDown, children }) {
  return (
    <>
      <div className={styles.pane}>
        {children}
      </div>
      {!isLast && (
        <div
          className={styles.divider}
          onPointerDown={(e) => onDividerPointerDown(e, index)}
          role="separator"
          aria-orientation="vertical"
        />
      )}
    </>
  )
}
