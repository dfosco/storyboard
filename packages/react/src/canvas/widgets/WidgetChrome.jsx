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

function OpenExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8.002 2c1.34 0 2.585.402 3.672 1.047a10.742 10.742 0 0 1 2.894 2.524A1.784 1.784 0 0 1 14.93 7c0 .348-.125.694-.362 1.429a10.742 10.742 0 0 1-2.894 2.524C10.587 11.598 9.342 12 8.002 12s-2.585-.402-3.672-1.047a10.742 10.742 0 0 1-2.894-2.524A1.784 1.784 0 0 1 1.074 7c0-.348.125-.694.362-1.429A10.742 10.742 0 0 1 4.33 3.047C5.417 2.402 6.662 2 8.002 2ZM1.5 7a.284.284 0 0 0 .057.181 9.242 9.242 0 0 0 2.501 2.176C5.003 10.074 6.084 10.5 8 10.5c1.916 0 2.997-.426 3.942-1.143a9.242 9.242 0 0 0 2.501-2.176A.284.284 0 0 0 14.5 7a.284.284 0 0 0-.057-.181 9.242 9.242 0 0 0-2.501-2.176C10.997 3.926 9.916 3.5 8 3.5c-1.916 0-2.997.426-3.942 1.143A9.242 9.242 0 0 0 1.557 6.82.284.284 0 0 0 1.5 7ZM8 5.5a1.5 1.5 0 1 1-.001 3.001A1.5 1.5 0 0 1 8 5.5Z" />
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M.143 2.31a.75.75 0 0 1 1.047-.167l14.5 10.5a.75.75 0 1 1-.88 1.214l-2.248-1.628C11.346 13.19 9.873 13.75 8 13.75c-1.34 0-2.585-.402-3.672-1.047a10.742 10.742 0 0 1-2.894-2.524A1.784 1.784 0 0 1 1.074 8.75c0-.348.125-.694.362-1.429a10.956 10.956 0 0 1 2.039-2.545L.31 3.357A.75.75 0 0 1 .143 2.31Zm4.653 3.37a9.2 9.2 0 0 0-2.239 2.38.284.284 0 0 0 0 .38 9.242 9.242 0 0 0 2.501 2.18c.945.717 2.026 1.13 3.942 1.13 1.424 0 2.56-.39 3.513-.925L10.78 9.52a2.25 2.25 0 0 1-2.907-2.168c0-.093.006-.185.017-.275ZM8 3.25c-.67 0-1.296.102-1.877.283a.75.75 0 1 1-.482-1.42A8.066 8.066 0 0 1 8 1.75c1.34 0 2.585.402 3.672 1.047a10.742 10.742 0 0 1 2.894 2.524c.237.735.362 1.081.362 1.429 0 .348-.125.694-.362 1.429a10.933 10.933 0 0 1-1.084 1.611.75.75 0 1 1-1.17-.937c.372-.464.67-.947.895-1.386a.284.284 0 0 0 0-.38 9.242 9.242 0 0 0-2.501-2.18C10.997 4.176 9.916 3.25 8 3.25Z" />
    </svg>
  )
}

const ACTION_ICONS = {
  'delete': DeleteIcon,
  'zoom-in': ZoomInIcon,
  'zoom-out': ZoomOutIcon,
  'edit': EditIcon,
  'open-external': OpenExternalIcon,
  'toggle-private': EyeIcon,
}

const ACTION_LABELS = {
  'delete': 'Delete widget',
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out',
  'edit': 'Edit',
  'open-external': 'Open in new tab',
  'toggle-private': 'Make private',
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
    // Only toggle selection if the pointer stayed close (click, not drag)
    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y)
    if (dist > 10) return
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
                let Icon = ACTION_ICONS[feature.action]
                let label = ACTION_LABELS[feature.action] || feature.action

                // Toggle-private: swap icon/label based on current state
                if (feature.action === 'toggle-private' && widgetProps?.private) {
                  Icon = EyeClosedIcon
                  label = 'Private image'
                }

                return (
                  <button
                    key={feature.id}
                    className={styles.featureBtn}
                    onClick={(e) => handleActionClick(feature.action, e)}
                    title={label}
                    aria-label={label}
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
