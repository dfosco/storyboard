import { useState, useCallback, useRef } from 'react'
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

const ACTION_ICONS = {
  'delete': DeleteIcon,
  'zoom-in': ZoomInIcon,
  'zoom-out': ZoomOutIcon,
  'edit': EditIcon,
}

const ACTION_LABELS = {
  'delete': 'Delete widget',
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out',
  'edit': 'Edit',
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
  const handlePointerDown = useRef(false)

  const handleMouseEnter = useCallback(() => {
    clearTimeout(leaveTimer.current)
    setHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setHovered(false), 80)
  }, [])

  // Track pointerdown on the handle so we can select on pointerup
  // even if the drag library swallows the click event.
  const handleHandlePointerDown = useCallback(() => {
    handlePointerDown.current = true
  }, [])

  const handleHandlePointerUp = useCallback((e) => {
    if (!handlePointerDown.current) return
    handlePointerDown.current = false
    // Only select if the pointer didn't travel far (i.e. not a drag)
    e.stopPropagation()
    if (selected) {
      onDeselect?.()
    } else {
      onSelect?.()
    }
  }, [selected, onSelect, onDeselect])

  const handleActionClick = useCallback((actionId, e) => {
    e.stopPropagation()
    // Standard actions go through onAction (handled by CanvasPage)
    if (actionId === 'delete') {
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
                const Icon = ACTION_ICONS[feature.action]
                return (
                  <button
                    key={feature.id}
                    className={styles.featureBtn}
                    onClick={(e) => handleActionClick(feature.action, e)}
                    title={ACTION_LABELS[feature.action] || feature.action}
                    aria-label={ACTION_LABELS[feature.action] || feature.action}
                  >
                    {Icon ? <Icon /> : feature.action}
                  </button>
                )
              }

              return null
            })}
          </div>

          <button
            className={`tc-drag-handle ${styles.selectHandle} ${selected ? styles.selectHandleActive : ''}`}
            onPointerDown={handleHandlePointerDown}
            onPointerUp={handleHandlePointerUp}
            title={selected ? 'Deselect' : 'Select'}
            aria-label={selected ? 'Deselect widget' : 'Select widget'}
            aria-pressed={selected}
          />
        </div>
      </div>
    </div>
  )
}
