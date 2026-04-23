import { useState, useCallback, useRef, useEffect, useSyncExternalStore } from 'react'
import { Tooltip } from '@primer/react'
import { EyeIcon as OcticonEye, EyeClosedIcon as OcticonEyeClosed, CodeIcon as OcticonCode, UnwrapIcon as OcticonUnwrap, ImageIcon as OcticonImage, UnfoldIcon as OcticonUnfold, FoldIcon as OcticonFold, ScreenFullIcon as OcticonScreenFull } from '@primer/octicons-react'
import { getConnectorConfig, getInteractGate } from './widgetConfig.js'
import styles from './WidgetChrome.module.css'
import overlayStyles from './embedOverlay.module.css'

const STICKY_NOTE_COLORS = {
  yellow: { bg: '#fff8c5', border: '#d4a72c', dot: '#e8c846' },
  blue:   { bg: '#ddf4ff', border: '#54aeff', dot: '#74b9ff' },
  green:  { bg: '#dafbe1', border: '#4ac26b', dot: '#6dd58c' },
  pink:   { bg: '#ffebe9', border: '#ff8182', dot: '#ff9a9e' },
  purple: { bg: '#fbefff', border: '#c297ff', dot: '#d4a8ff' },
  orange: { bg: '#fff1e5', border: '#d18616', dot: '#e8a844' },
}

function DeleteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.15l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
    </svg>
  )
}

function ZoomOutIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2.75 7.25h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5Z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" />
    </svg>
  )
}

function OpenExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" />
    </svg>
  )
}

function EyeIcon() {
  return <OcticonEye size={12} />
}

function EyeClosedIcon() {
  return <OcticonEyeClosed size={12} />
}

function CodeIcon() {
  return <OcticonCode size={12} />
}

function UnwrapIcon() {
  return <OcticonUnwrap size={12} />
}

function ImageIcon() {
  return <OcticonImage size={12} />
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z" />
      <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06Z" />
    </svg>
  )
}

function ExpandIcon() {
  return <OcticonScreenFull size={12} />
}

function SyncIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
    </svg>
  )
}

function UnfoldIcon() {
  return <OcticonUnfold size={12} />
}

function FoldIcon() {
  return <OcticonFold size={12} />
}

function ColumnsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v18" /><rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}

/** Icon registry — maps icon name strings from config to React components. */
function MessageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

const ICON_REGISTRY = {
  'trash': DeleteIcon,
  'zoom-in': ZoomInIcon,
  'zoom-out': ZoomOutIcon,
  'edit': EditIcon,
  'open-external': OpenExternalIcon,
  'eye': EyeIcon,
  'eye-closed': EyeClosedIcon,
  'code': CodeIcon,
  'unwrap': UnwrapIcon,
  'image': ImageIcon,
  'copy': CopyIcon,
  'link': LinkIcon,
  'more': MoreIcon,
  'chevron-down': ChevronDownIcon,
  'download': DownloadIcon,
  'expand': ExpandIcon,
  'sync': SyncIcon,
  'unfold': UnfoldIcon,
  'fold': FoldIcon,
  'columns': ColumnsIcon,
  'message': MessageIcon,
}

/** Danger-styled actions in the overflow menu. */
const DANGER_ACTIONS = new Set(['delete'])

/**
 * useAltKey — tracks whether the Alt/Option key is currently held.
 * Uses useSyncExternalStore for tear-free reads across concurrent renders.
 */
let altKeyHeld = false
const altKeyListeners = new Set()
function notifyAltKeyListeners() {
  for (const cb of altKeyListeners) cb()
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Alt' && !altKeyHeld) { altKeyHeld = true; notifyAltKeyListeners() }
  })
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Alt' && altKeyHeld) { altKeyHeld = false; notifyAltKeyListeners() }
  })
  window.addEventListener('blur', () => {
    if (altKeyHeld) { altKeyHeld = false; notifyAltKeyListeners() }
  })
}

function subscribeAltKey(cb) {
  altKeyListeners.add(cb)
  return () => altKeyListeners.delete(cb)
}
function getAltKeySnapshot() { return altKeyHeld }

function useAltKey() {
  return useSyncExternalStore(subscribeAltKey, getAltKeySnapshot, () => false)
}

/**
 * Overflow menu — `...` button that opens a dropdown with menu-only actions.
 */
function WidgetOverflowMenu({ widgetId, menuFeatures, onAction }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const altHeld = useAltKey()

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const handleItemClick = useCallback((feature, e) => {
    e.stopPropagation()
    const action = (altHeld && feature.alt) ? feature.alt.action : feature.action
    if (action === 'copy-link') {
      const url = new URL(window.location.href)
      url.searchParams.set('widget', widgetId)
      navigator.clipboard.writeText(url.toString()).catch(() => {})
    } else if (action === 'copy-widget-id') {
      const canvasId = window.__storyboardCanvasBridgeState?.canvasId || ''
      navigator.clipboard.writeText(`${canvasId}::${widgetId}`).catch(() => {})
    } else {
      onAction?.(action)
    }
    setOpen(false)
  }, [widgetId, onAction, altHeld])

  return (
    <div ref={menuRef} className={styles.overflowWrapper}>
      <Tooltip text="More actions" direction="n">
        <button
          className={styles.featureBtn}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
          aria-label="More actions"
          aria-expanded={open}
        >
          <MoreIcon />
        </button>
      </Tooltip>
      {open && (
        <div className={styles.overflowMenu}>
          {menuFeatures.map((feature) => {
            const Icon = ICON_REGISTRY[feature.icon]
            const hasAlt = !!feature.alt
            const label = (altHeld && hasAlt) ? feature.alt.label : (feature.label || feature.action)
            const isDanger = DANGER_ACTIONS.has(feature.action)
            return (
              <button
                key={feature.id}
                className={`${styles.overflowItem} ${isDanger ? styles.overflowItemDanger : ''}`}
                onClick={(e) => handleItemClick(feature, e)}
              >
                {Icon && <Icon />}
                <span>{label}</span>
                {hasAlt && (
                  <span className={`${styles.altHint} ${altHeld ? styles.altHintActive : ''}`}>⌥ alt</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Dropdown feature — a chevron button that opens a menu of actions.
 * Items and their icons/labels come from config.
 */
function DropdownFeature({ feature, onAction }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const altHeld = useAltKey()

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const TriggerIcon = ICON_REGISTRY[feature.icon] || ChevronDownIcon

  return (
    <div ref={menuRef} className={styles.overflowWrapper}>
      <Tooltip text={feature.label || 'Actions'} direction="n">
        <button
          className={styles.featureBtn}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
          aria-label={feature.label || 'Actions'}
          aria-expanded={open}
        >
          <TriggerIcon />
        </button>
      </Tooltip>
      {open && (
        <div className={styles.overflowMenu}>
          {(feature.items || []).map((item) => {
            const Icon = ICON_REGISTRY[item.icon]
            const hasAlt = !!item.alt
            const label = (altHeld && hasAlt) ? item.alt.label : (item.label || item.action)
            const action = (altHeld && hasAlt) ? item.alt.action : item.action
            return (
              <button
                key={item.action}
                className={styles.overflowItem}
                onClick={(e) => {
                  e.stopPropagation()
                  onAction?.(action)
                  setOpen(false)
                }}
              >
                {Icon && <Icon />}
                <span>{label}</span>
                {hasAlt && (
                  <span className={`${styles.altHint} ${altHeld ? styles.altHintActive : ''}`}>⌥ alt</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * ColorPicker feature button — shows a dot that reveals color options on hover.
 */
function ColorPickerFeature({ currentColor, options, onColorChange }) {
  const palette = STICKY_NOTE_COLORS[currentColor] ?? STICKY_NOTE_COLORS.yellow

  return (
    <div
      className={styles.colorPickerWrapper}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        className={styles.featureBtn}
        style={{ background: palette.dot }}
        aria-label="Change color"
        title="Change color"
      >
        <span className={styles.colorDotInner} style={{ background: palette.dot }} />
      </button>
      <div className={styles.colorPopup}>
        {(options || Object.keys(STICKY_NOTE_COLORS)).map((colorName) => {
          const c = STICKY_NOTE_COLORS[colorName]
          if (!c) return null
          return (
            <button
              key={colorName}
              className={`${styles.colorOption} ${colorName === currentColor ? styles.colorOptionActive : ''}`}
              style={{ background: c.bg, borderColor: c.border }}
              onClick={(e) => {
                e.stopPropagation()
                onColorChange(colorName)
              }}
              title={colorName}
              aria-label={`Set color to ${colorName}`}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * WidgetChrome — universal hover toolbar rendered below every canvas widget.
 *
 * Provides:
 * - A trigger dot (visible at rest) that transitions to a toolbar on hover
 * - Feature buttons (left) driven by widget config
 * - A select handle (right) for selection toggling
 *
 * Widget components can expose imperative action handlers via a ref:
 *   useImperativeHandle(ref, () => ({ handleAction(actionId) { ... } }))
 * WidgetChrome will call widgetRef.current.handleAction(actionId) for
 * non-standard actions (anything other than 'delete').
 */
export default function WidgetChrome({
  widgetId,
  widgetType,
  features = [],
  selected = false,
  multiSelected = false,
  widgetProps,
  widgetRef,
  onSelect,
  onDeselect, // eslint-disable-line no-unused-vars
  onAction,
  onUpdate,
  onConnectorDragStart,
  children,
  readOnly = false,
}) {
  const [hovered, setHovered] = useState(false)
  const leaveTimer = useRef(null)

  const handleMouseEnter = useCallback(() => {
    clearTimeout(leaveTimer.current)
    setHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setHovered(false), 80)
  }, [])

  // Handle select via click — pointer events are intercepted by the drag
  // gate in Draggable, so onPointerDown never reaches React on the handle.
  // onClick fires reliably after pointer up.
  const handleHandleClick = useCallback((e) => {
    e.stopPropagation()
    onSelect?.(e.shiftKey)
  }, [onSelect])

  const handleActionClick = useCallback((actionId, e) => {
    e.stopPropagation()
    // Standard actions go through onAction (handled by CanvasPage)
    if (actionId === 'delete' || actionId === 'copy') {
      onAction?.(actionId)
      return
    }
    // Widget-specific actions go through the widget's imperative ref
    if (widgetRef?.current?.handleAction) {
      const handled = widgetRef.current.handleAction(actionId)
      if (handled !== false) return
    }
    // Fallback to generic handler
    onAction?.(actionId)
  }, [onAction, widgetRef])

  const handleColorChange = useCallback((color) => {
    onUpdate?.({ color })
  }, [onUpdate])

  // In readOnly mode, features are already filtered to prod-only by getFeatures.
  // Show toolbar if there are prod features even when readOnly.
  const hasFeatures = features.length > 0
  const showToolbar = (hovered || selected) && (!readOnly || hasFeatures)
  const showFeatures = showToolbar && !multiSelected
  const menuFeatures = features.filter((f) => f.menu)

  // Interact gate — declarative overlay from widgets.config.json
  const gate = widgetType ? getInteractGate(widgetType) : { enabled: false }
  const [interacting, setInteracting] = useState(false)
  const slotRef = useRef(null)

  // Exit interact mode on click outside or double-Escape
  const lastEscapeRef = useRef(0)
  useEffect(() => {
    if (!gate.enabled || !interacting) return
    const handleMouseDown = (e) => {
      if (slotRef.current && !slotRef.current.contains(e.target)) {
        setInteracting(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const now = Date.now()
        if (now - lastEscapeRef.current < 500) {
          // Double-Escape: exit interact mode but keep widget selected
          e.stopPropagation()
          e.preventDefault()
          setInteracting(false)
          lastEscapeRef.current = 0
        } else {
          // First Escape: let it pass to widget, record timestamp
          lastEscapeRef.current = now
        }
      }
    }
    document.addEventListener('mousedown', handleMouseDown, true)
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [gate.enabled, interacting])

  // Exit interact mode when deselected
  useEffect(() => {
    if (!selected && !hovered && interacting) setInteracting(false)
  }, [selected, hovered, interacting])

  const handleGateClick = useCallback((e) => {
    e.stopPropagation()
    setInteracting(true)
    // Also trigger selection so the widget gets selected
    onSelect?.()
  }, [onSelect])

  return (
    <div
      className={styles.chromeContainer}
      data-widget-id={widgetId}
      data-tc-elevated={(hovered || selected) || undefined}
      onMouseEnter={(readOnly && !hasFeatures) ? undefined : handleMouseEnter}
      onMouseLeave={(readOnly && !hasFeatures) ? undefined : handleMouseLeave}
    >
      <div ref={slotRef} className={`tc-drag-surface ${styles.widgetSlot} ${selected ? styles.widgetSlotSelected : ''} ${multiSelected ? styles.widgetSlotMultiSelected : ''}`} data-widget-selected={selected || undefined} data-widget-interacting={interacting || undefined}>
        {children}
        {gate.enabled && !interacting && (
          <div
            className={overlayStyles.interactOverlay}
            onClick={handleGateClick}
            role="button"
            tabIndex={0}
            aria-label={gate.label}
          >
            <span className={overlayStyles.interactHint}>{gate.label}</span>
          </div>
        )}
      </div>
      {!readOnly && onConnectorDragStart && (() => {
        const connConfig = widgetType ? getConnectorConfig(widgetType) : null
        return ['top', 'bottom', 'left', 'right']
          .filter((a) => !connConfig || connConfig.anchors[a] !== 'unavailable')
          .map((anchor) => {
            const disabled = connConfig?.anchors[anchor] === 'disabled'
            return (
              <div
                key={anchor}
                className={`${styles.anchorPort} ${styles[`anchorPort${anchor[0].toUpperCase()}${anchor.slice(1)}`]} ${disabled ? styles.anchorPortDisabled : ''}`}
                onPointerDown={disabled ? undefined : (e) => {
                  e.stopPropagation()
                  e.nativeEvent?.stopImmediatePropagation?.()
                  e.preventDefault()
                  onConnectorDragStart(widgetId, anchor, e)
                }}
                data-anchor={anchor}
              />
            )
          })
      })()}
      <div
        className={styles.toolbar}
      >
        {/* Trigger dot — visible at rest */}
        <span
          className={`${styles.triggerDot} ${showToolbar ? styles.triggerDotHidden : ''}`}
        />

        {/* Toolbar content — visible on hover */}
        <div className={`${styles.toolbarContent} ${showToolbar ? styles.toolbarContentVisible : ''}`}>
          {showFeatures && (
          <div className={styles.featureButtons}>
            {features.map((feature) => {
              // Menu features are rendered in WidgetOverflowMenu
              if (feature.menu) return null

              if (feature.type === 'color-picker') {
                return (
                  <ColorPickerFeature
                    key={feature.id}
                    currentColor={widgetProps?.[feature.prop] || 'yellow'}
                    options={feature.options}
                    onColorChange={handleColorChange}
                  />
                )
              }

              if (feature.type === 'action') {
                let Icon = ICON_REGISTRY[feature.icon]
                let label = feature.label || feature.action

                // Toggle-private: swap icon/label based on current state
                if (feature.action === 'toggle-private') {
                  if (widgetProps?.private) {
                    Icon = ICON_REGISTRY['eye-closed']
                    label = 'Private image — only visible locally'
                  } else {
                    label = 'Published image — deployed with canvas'
                  }
                }

                // Show-code toggle: swap label based on widget state
                if (feature.action === 'show-code' && widgetRef?.current?.getState?.('showCode')) {
                  label = 'Show component'
                }

                return (
                  <Tooltip key={feature.id} text={label} direction="n">
                    <button
                      className={styles.featureBtn}
                      onClick={(e) => handleActionClick(feature.action, e)}
                      aria-label={label}
                    >
                      {Icon ? <Icon /> : feature.action}
                    </button>
                  </Tooltip>
                )
              }

              if (feature.type === 'dropdown') {
                return (
                  <DropdownFeature
                    key={feature.id}
                    feature={feature}
                    onAction={(actionId) => {
                      if (widgetRef?.current?.handleAction) {
                        const handled = widgetRef.current.handleAction(actionId)
                        if (handled !== false) return
                      }
                      onAction?.(actionId)
                    }}
                  />
                )
              }

              return null
            })}
            {menuFeatures.length > 0 && (
              <WidgetOverflowMenu
                widgetId={widgetId}
                menuFeatures={menuFeatures}
                onAction={(actionId) => {
                  // Route overflow menu actions through the widget ref first
                  if (actionId !== 'delete' && actionId !== 'copy' && widgetRef?.current?.handleAction) {
                    const handled = widgetRef.current.handleAction(actionId)
                    if (handled !== false) return
                  }
                  onAction?.(actionId)
                }}
              />
            )}
          </div>
          )}

          {!readOnly && (
            <Tooltip text={selected ? "Click and drag to move" : "Select"} direction="n">
              <button
                className={`tc-drag-handle ${styles.selectHandle} ${selected ? styles.selectHandleActive : ''}`}
                onClick={handleHandleClick}
                aria-label={selected ? "Drag to move widget" : "Select widget"}
                aria-pressed={selected}
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}
