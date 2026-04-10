import { useState, useCallback, useRef, useEffect } from 'react'
import { Tooltip } from '@primer/react'
import { EyeIcon as OcticonEye, EyeClosedIcon as OcticonEyeClosed } from '@primer/octicons-react'
import styles from './WidgetChrome.module.css'

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

/**
 * Overflow menu — `...` button that opens a dropdown with delete + copy link.
 */
function WidgetOverflowMenu({ widgetId, onAction }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

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

  const handleCopyLink = useCallback((e) => {
    e.stopPropagation()
    const url = new URL(window.location.href)
    url.searchParams.set('widget', widgetId)
    navigator.clipboard.writeText(url.toString()).catch(() => {})
    setOpen(false)
  }, [widgetId])

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    onAction?.('delete')
    setOpen(false)
  }, [onAction])

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
          <button className={styles.overflowItem} onClick={handleCopyLink}>
            <LinkIcon />
            <span>Copy link to widget</span>
          </button>
          <button className={`${styles.overflowItem} ${styles.overflowItemDanger}`} onClick={handleDelete}>
            <DeleteIcon />
            <span>Delete widget</span>
          </button>
        </div>
      )}
    </div>
  )
}

const ACTION_ICONS = {
  'delete': DeleteIcon,
  'zoom-in': ZoomInIcon,
  'zoom-out': ZoomOutIcon,
  'edit': EditIcon,
  'open-external': OpenExternalIcon,
  'toggle-private': EyeIcon,
  'copy': CopyIcon,
}

const ACTION_LABELS = {
  'delete': 'Delete widget',
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out',
  'edit': 'Edit',
  'open-external': 'Open in new tab',
  'toggle-private': 'Make private',
  'copy': 'Copy widget',
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
  features = [],
  selected = false,
  widgetProps,
  widgetRef,
  onSelect,
  onDeselect,
  onAction,
  onUpdate,
  children,
}) {
  const [hovered, setHovered] = useState(false)
  const leaveTimer = useRef(null)
  const pointerStartPos = useRef(null)

  const handleMouseEnter = useCallback(() => {
    clearTimeout(leaveTimer.current)
    setHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setHovered(false), 80)
  }, [])

  // Track pointer position on the handle to distinguish click from drag.
  const handleHandlePointerDown = useCallback((e) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleHandlePointerUp = useCallback((e) => {
    if (!pointerStartPos.current) return
    const start = pointerStartPos.current
    pointerStartPos.current = null
    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y)
    if (dist > 10) return
    e.stopPropagation()
    onSelect?.()
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
      widgetRef.current.handleAction(actionId)
      return
    }
    // Fallback to generic handler
    onAction?.(actionId)
  }, [onAction, widgetRef])

  const handleColorChange = useCallback((color) => {
    onUpdate?.({ color })
  }, [onUpdate])

  const showToolbar = hovered || selected

  return (
    <div
      className={styles.chromeContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`${styles.widgetSlot} ${selected ? styles.widgetSlotSelected : ''}`}>
        {children}
      </div>
      <div
        className={styles.toolbar}
      >
        {/* Trigger dot — visible at rest */}
        <span
          className={`${styles.triggerDot} ${showToolbar ? styles.triggerDotHidden : ''}`}
        />

        {/* Toolbar content — visible on hover */}
        <div className={`${styles.toolbarContent} ${showToolbar ? styles.toolbarContentVisible : ''}`}>
          <div className={styles.featureButtons}>
            {features.map((feature) => {
              // delete goes in overflow menu, skip here
              if (feature.action === 'delete') return null

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
                let Icon = ACTION_ICONS[feature.action]
                let label = ACTION_LABELS[feature.action] || feature.action

                // Toggle-private: swap icon/label based on current state
                if (feature.action === 'toggle-private') {
                  if (widgetProps?.private) {
                    Icon = EyeClosedIcon
                    label = 'Private image — only visible locally'
                  } else {
                    label = 'Published image — deployed with canvas'
                  }
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

              return null
            })}
            <WidgetOverflowMenu widgetId={widgetId} onAction={onAction} />
          </div>

          <Tooltip text="Select" direction="n">
            <button
              className={`tc-drag-handle ${styles.selectHandle} ${selected ? styles.selectHandleActive : ''}`}
              onPointerDown={handleHandlePointerDown}
              onPointerUp={handleHandlePointerUp}
              aria-label="Select widget"
              aria-pressed={selected}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
