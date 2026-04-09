import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@dfosco/tiny-canvas'
import '@dfosco/tiny-canvas/style.css'
import { useCanvas } from './useCanvas.js'
import { shouldPreventCanvasTextSelection } from './textSelection.js'
import { getCanvasThemeVars, getCanvasPrimerAttrs } from './canvasTheme.js'
import { getWidgetComponent } from './widgets/index.js'
import { schemas, getDefaults } from './widgets/widgetProps.js'
import { getFeatures } from './widgets/widgetConfig.js'
import WidgetChrome from './widgets/WidgetChrome.jsx'
import ComponentWidget from './widgets/ComponentWidget.jsx'
import { addWidget as addWidgetApi, updateCanvas, removeWidget as removeWidgetApi } from './canvasApi.js'
import styles from './CanvasPage.module.css'

const ZOOM_MIN = 25
const ZOOM_MAX = 200

const CANVAS_BRIDGE_STATE_KEY = '__storyboardCanvasBridgeState'

function getToolbarColorMode(theme) {
  return String(theme || 'light').startsWith('dark') ? 'dark' : 'light'
}

function resolveCanvasThemeFromStorage() {
  if (typeof localStorage === 'undefined') return 'light'
  let sync = { prototype: true, toolbar: false, codeBoxes: true, canvas: false }
  try {
    const rawSync = localStorage.getItem('sb-theme-sync')
    if (rawSync) sync = { ...sync, ...JSON.parse(rawSync) }
  } catch {
    // Ignore malformed sync settings
  }

  if (!sync.canvas) return 'light'

  const attrTheme = document.documentElement.getAttribute('data-sb-canvas-theme')
  if (attrTheme) return attrTheme

  const stored = localStorage.getItem('sb-color-scheme') || 'system'
  if (stored !== 'system') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Debounce helper — returns a function that delays invocation.
 */
function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

/**
 * Get viewport-center coordinates for placing a new widget.
 */
function getViewportCenter() {
  return {
    x: Math.round(window.innerWidth / 2 - 120),
    y: Math.round(window.innerHeight / 2 - 80),
  }
}

function roundPosition(value) {
  return Math.round(value)
}

/** Renders a single JSON-defined widget by type lookup. */
function WidgetRenderer({ widget, onUpdate, widgetRef }) {
  const Component = getWidgetComponent(widget.type)
  if (!Component) {
    console.warn(`[canvas] Unknown widget type: ${widget.type}`)
    return null
  }
  // Only pass ref to forwardRef-wrapped components (e.g. PrototypeEmbed)
  const elementProps = { id: widget.id, props: widget.props, onUpdate }
  if (Component.$$typeof === Symbol.for('react.forward_ref')) {
    elementProps.ref = widgetRef
  }
  return createElement(Component, elementProps)
}

/**
 * Wrapper for each JSON widget that holds its own ref for imperative actions.
 * This allows WidgetChrome to dispatch actions to the widget via ref.
 */
function ChromeWrappedWidget({
  widget,
  selected,
  onSelect,
  onDeselect,
  onUpdate,
  onRemove,
}) {
  const widgetRef = useRef(null)
  const features = getFeatures(widget.type)

  const handleAction = useCallback((actionId) => {
    if (actionId === 'delete') {
      onRemove(widget.id)
    }
  }, [widget.id, onRemove])

  return (
    <WidgetChrome
      widgetId={widget.id}
      widgetType={widget.type}
      features={features}
      selected={selected}
      widgetProps={widget.props}
      widgetRef={widgetRef}
      onSelect={onSelect}
      onDeselect={onDeselect}
      onAction={handleAction}
      onUpdate={(updates) => onUpdate(widget.id, updates)}
    >
      <WidgetRenderer
        widget={widget}
        onUpdate={(updates) => onUpdate(widget.id, updates)}
        widgetRef={widgetRef}
      />
    </WidgetChrome>
  )
}

/**
 * Generic canvas page component.
 * Reads canvas data from the index and renders all widgets on a draggable surface.
 *
 * @param {{ name: string }} props - Canvas name as indexed by the data plugin
 */
export default function CanvasPage({ name }) {
  const { canvas, jsxExports, loading } = useCanvas(name)

  // Local mutable copy of widgets for instant UI updates
  const [localWidgets, setLocalWidgets] = useState(canvas?.widgets ?? null)
  const [trackedCanvas, setTrackedCanvas] = useState(canvas)
  const [selectedWidgetId, setSelectedWidgetId] = useState(null)
  const [zoom, setZoom] = useState(100)
  const zoomRef = useRef(100)
  const scrollRef = useRef(null)
  const [canvasTitle, setCanvasTitle] = useState(canvas?.title || name)
  const titleInputRef = useRef(null)
  const [localSources, setLocalSources] = useState(canvas?.sources ?? [])
  const [canvasTheme, setCanvasTheme] = useState(() => resolveCanvasThemeFromStorage())

  if (canvas !== trackedCanvas) {
    setTrackedCanvas(canvas)
    setLocalWidgets(canvas?.widgets ?? null)
    setLocalSources(canvas?.sources ?? [])
    setCanvasTitle(canvas?.title || name)
  }

  // Debounced save to server
  const debouncedSave = useRef(
    debounce((canvasName, widgets) => {
      updateCanvas(canvasName, { widgets }).catch((err) =>
        console.error('[canvas] Failed to save:', err)
      )
    }, 2000)
  ).current

  const debouncedTitleSave = useRef(
    debounce((canvasName, title) => {
      updateCanvas(canvasName, { settings: { title } }).catch((err) =>
        console.error('[canvas] Failed to save title:', err)
      )
    }, 1000)
  ).current

  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value
    setCanvasTitle(newTitle)
    debouncedTitleSave(name, newTitle)
  }, [name, debouncedTitleSave])

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
    e.stopPropagation()
  }, [])

  const handleWidgetUpdate = useCallback((widgetId, updates) => {
    setLocalWidgets((prev) => {
      if (!prev) return prev
      const next = prev.map((w) =>
        w.id === widgetId ? { ...w, props: { ...w.props, ...updates } } : w
      )
      debouncedSave(name, next)
      return next
    })
  }, [name, debouncedSave])

  const handleWidgetRemove = useCallback((widgetId) => {
    setLocalWidgets((prev) => prev ? prev.filter((w) => w.id !== widgetId) : prev)
    removeWidgetApi(name, widgetId).catch((err) =>
      console.error('[canvas] Failed to remove widget:', err)
    )
  }, [name])

  const debouncedSourceSave = useRef(
    debounce((canvasName, sources) => {
      updateCanvas(canvasName, { sources }).catch((err) =>
        console.error('[canvas] Failed to save sources:', err)
      )
    }, 2000)
  ).current

  const handleSourceUpdate = useCallback((exportName, updates) => {
    setLocalSources((prev) => {
      const current = Array.isArray(prev) ? prev : []
      const next = current.some((s) => s?.export === exportName)
        ? current.map((s) => (s?.export === exportName ? { ...s, ...updates } : s))
        : [...current, { export: exportName, ...updates }]
      debouncedSourceSave(name, next)
      return next
    })
  }, [name, debouncedSourceSave])

  const handleItemDragEnd = useCallback((dragId, position) => {
    if (!dragId || !position) return
    const rounded = { x: Math.max(0, roundPosition(position.x)), y: Math.max(0, roundPosition(position.y)) }

    if (dragId.startsWith('jsx-')) {
      const sourceExport = dragId.replace(/^jsx-/, '')
      setLocalSources((prev) => {
        const current = Array.isArray(prev) ? prev : []
        const next = current.some((s) => s?.export === sourceExport)
          ? current.map((s) => (s?.export === sourceExport ? { ...s, position: rounded } : s))
          : [...current, { export: sourceExport, position: rounded }]
        updateCanvas(name, { sources: next }).catch((err) =>
          console.error('[canvas] Failed to save source position:', err)
        )
        return next
      })
      return
    }

    setLocalWidgets((prev) => {
      if (!prev) return prev
      const next = prev.map((w) =>
        w.id === dragId ? { ...w, position: rounded } : w
      )
      updateCanvas(name, { widgets: next }).catch((err) =>
        console.error('[canvas] Failed to save widget position:', err)
      )
      return next
    })
  }, [name])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  // Signal canvas mount/unmount to CoreUIBar
  useEffect(() => {
    window[CANVAS_BRIDGE_STATE_KEY] = { active: true, name, zoom: zoomRef.current }
    document.dispatchEvent(new CustomEvent('storyboard:canvas:mounted', {
      detail: { name, zoom: zoomRef.current }
    }))

    function handleStatusRequest() {
      const state = window[CANVAS_BRIDGE_STATE_KEY] || { active: true, name, zoom: zoomRef.current }
      document.dispatchEvent(new CustomEvent('storyboard:canvas:status', { detail: state }))
    }

    document.addEventListener('storyboard:canvas:status-request', handleStatusRequest)

    return () => {
      document.removeEventListener('storyboard:canvas:status-request', handleStatusRequest)
      window[CANVAS_BRIDGE_STATE_KEY] = { active: false, name: '', zoom: 100 }
      document.dispatchEvent(new CustomEvent('storyboard:canvas:unmounted'))
    }
  }, [name])

  // Add a widget by type — used by CanvasControls and CoreUIBar event
  const addWidget = useCallback(async (type) => {
    const defaultProps = schemas[type] ? getDefaults(schemas[type]) : {}
    const pos = getViewportCenter()
    try {
      const result = await addWidgetApi(name, {
        type,
        props: defaultProps,
        position: pos,
      })
      if (result.success && result.widget) {
        setLocalWidgets((prev) => [...(prev || []), result.widget])
      }
    } catch (err) {
      console.error('[canvas] Failed to add widget:', err)
    }
  }, [name])

  // Listen for CoreUIBar add-widget events
  useEffect(() => {
    function handleAddWidget(e) {
      addWidget(e.detail.type)
    }
    document.addEventListener('storyboard:canvas:add-widget', handleAddWidget)
    return () => document.removeEventListener('storyboard:canvas:add-widget', handleAddWidget)
  }, [addWidget])

  // Listen for zoom changes from CoreUIBar
  useEffect(() => {
    function handleZoom(e) {
      const { zoom: newZoom } = e.detail
      if (typeof newZoom === 'number') {
        setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom)))
      }
    }
    document.addEventListener('storyboard:canvas:set-zoom', handleZoom)
    return () => document.removeEventListener('storyboard:canvas:set-zoom', handleZoom)
  }, [])

  // Canvas background should follow toolbar theme target.
  useEffect(() => {
    function readMode() {
      setCanvasTheme(resolveCanvasThemeFromStorage())
    }

    readMode()
    document.addEventListener('storyboard:theme:changed', readMode)
    return () => document.removeEventListener('storyboard:theme:changed', readMode)
  }, [])

  // Broadcast zoom level to CoreUIBar whenever it changes
  useEffect(() => {
    window[CANVAS_BRIDGE_STATE_KEY] = { active: true, name, zoom }
    document.dispatchEvent(new CustomEvent('storyboard:canvas:zoom-changed', {
      detail: { zoom }
    }))
  }, [name, zoom])

  // Delete selected widget on Delete/Backspace key
  useEffect(() => {
    function handleSelectStart(e) {
      if (shouldPreventCanvasTextSelection(e.target)) {
        e.preventDefault()
      }
    }
    document.addEventListener('selectstart', handleSelectStart)
    return () => document.removeEventListener('selectstart', handleSelectStart)
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (!selectedWidgetId) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleWidgetRemove(selectedWidgetId)
        setSelectedWidgetId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedWidgetId, handleWidgetRemove])

  // Paste handler — same-origin URLs become prototypes, other URLs become link previews, text becomes markdown
  useEffect(() => {
    const baseUrl = window.location.origin + (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')

    async function handlePaste(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

      const text = e.clipboardData?.getData('text/plain')?.trim()
      if (!text) return

      e.preventDefault()

      let type, props
      try {
        const parsed = new URL(text)
        if (text.startsWith(baseUrl)) {
          // Same-origin URL → prototype embed with the path portion
          const pathPortion = parsed.pathname + parsed.search + parsed.hash
          const basePath = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
          const src = basePath ? pathPortion.replace(new RegExp(`^${basePath}`), '') : pathPortion
          type = 'prototype'
          props = { src: src || '/', label: '', width: 800, height: 600 }
        } else {
          type = 'link-preview'
          props = { url: text, title: '' }
        }
      } catch {
        type = 'markdown'
        props = { content: text }
      }

      const pos = getViewportCenter()
      try {
        const result = await addWidgetApi(name, {
          type,
          props,
          position: pos,
        })
        if (result.success && result.widget) {
          setLocalWidgets((prev) => [...(prev || []), result.widget])
        }
      } catch (err) {
        console.error('[canvas] Failed to add widget from paste:', err)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [name])

  // Cmd+scroll / trackpad pinch to smooth-zoom the canvas
  // On macOS, pinch-to-zoom fires wheel events with ctrlKey: true and small
  // fractional deltaY values. We accumulate the delta to handle sub-pixel changes.
  const zoomAccum = useRef(0)
  useEffect(() => {
    function handleWheel(e) {
      if (!e.metaKey && !e.ctrlKey) return
      e.preventDefault()
      zoomAccum.current += -e.deltaY
      const step = Math.trunc(zoomAccum.current)
      if (step === 0) return
      zoomAccum.current -= step
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + step)))
    }
    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => document.removeEventListener('wheel', handleWheel)
  }, [])

  // Space + drag to pan the canvas
  const [spaceHeld, setSpaceHeld] = useState(false)
  const isPanning = useRef(false)
  const [panningActive, setPanningActive] = useState(false)
  const panStart = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 })

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === ' ') {
        const tag = e.target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
        e.preventDefault()
        if (!e.repeat) setSpaceHeld(true)
      }
    }
    function handleKeyUp(e) {
      if (e.key === ' ') {
        e.preventDefault()
        setSpaceHeld(false)
        isPanning.current = false
        setPanningActive(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const handlePanStart = useCallback((e) => {
    if (!spaceHeld) return
    e.preventDefault()
    isPanning.current = true
    setPanningActive(true)
    const el = scrollRef.current
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollX: el?.scrollLeft ?? 0,
      scrollY: el?.scrollTop ?? 0,
    }

    function handlePanMove(ev) {
      if (!isPanning.current || !el) return
      el.scrollLeft = panStart.current.scrollX - (ev.clientX - panStart.current.x)
      el.scrollTop = panStart.current.scrollY - (ev.clientY - panStart.current.y)
    }
    function handlePanEnd() {
      isPanning.current = false
      setPanningActive(false)
      document.removeEventListener('mousemove', handlePanMove)
      document.removeEventListener('mouseup', handlePanEnd)
    }
    document.addEventListener('mousemove', handlePanMove)
    document.addEventListener('mouseup', handlePanEnd)
  }, [spaceHeld])

  if (!canvas) {
    return (
      <div className={styles.empty}>
        <p>Canvas &ldquo;{name}&rdquo; not found</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading canvas…</p>
      </div>
    )
  }

  const canvasProps = {
    centered: canvas.centered ?? false,
    dotted: canvas.dotted ?? false,
    grid: canvas.grid ?? false,
    gridSize: canvas.gridSize ?? 18,
    colorMode: canvas.colorMode === 'auto'
      ? getToolbarColorMode(canvasTheme)
      : (canvas.colorMode ?? 'auto'),
  }

  const canvasThemeVars = getCanvasThemeVars(canvasTheme)
  const canvasPrimerAttrs = getCanvasPrimerAttrs(canvasTheme)

  // Merge JSX-sourced widgets (from .canvas.jsx) and JSON widgets
  const allChildren = []

  const sourceDataByExport = Object.fromEntries(
    (localSources || [])
      .filter((source) => source?.export)
      .map((source) => [source.export, source])
  )

  // 1. JSX-sourced component widgets (wrapped in WidgetChrome, not deletable)
  const componentFeatures = getFeatures('component')
  if (jsxExports) {
    for (const [exportName, Component] of Object.entries(jsxExports)) {
      const sourceData = sourceDataByExport[exportName] || {}
      const sourcePosition = sourceData.position || { x: 0, y: 0 }
      allChildren.push(
        <div
          key={`jsx-${exportName}`}
          id={`jsx-${exportName}`}
          data-tc-x={sourcePosition.x}
          data-tc-y={sourcePosition.y}
          data-tc-handle=".tc-drag-handle"
          {...canvasPrimerAttrs}
          style={canvasThemeVars}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedWidgetId(`jsx-${exportName}`)
          }}
        >
          <WidgetChrome
            features={componentFeatures}
            selected={selectedWidgetId === `jsx-${exportName}`}
            onSelect={() => setSelectedWidgetId(`jsx-${exportName}`)}
            onDeselect={() => setSelectedWidgetId(null)}
          >
            <ComponentWidget
              component={Component}
              width={sourceData.width}
              height={sourceData.height}
              onUpdate={(updates) => handleSourceUpdate(exportName, updates)}
            />
          </WidgetChrome>
        </div>
      )
    }
  }

  // 2. JSON-defined mutable widgets (selectable, wrapped in WidgetChrome)
  for (const widget of (localWidgets ?? [])) {
    allChildren.push(
      <div
        key={widget.id}
        id={widget.id}
        data-tc-x={widget?.position?.x ?? 0}
        data-tc-y={widget?.position?.y ?? 0}
        data-tc-handle=".tc-drag-handle"
        {...canvasPrimerAttrs}
        style={canvasThemeVars}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedWidgetId(widget.id)
        }}
      >
        <ChromeWrappedWidget
          widget={widget}
          selected={selectedWidgetId === widget.id}
          onSelect={() => setSelectedWidgetId(widget.id)}
          onDeselect={() => setSelectedWidgetId(null)}
          onUpdate={handleWidgetUpdate}
          onRemove={(id) => {
            handleWidgetRemove(id)
            setSelectedWidgetId(null)
          }}
        />
      </div>
    )
  }

  const scale = zoom / 100

  return (
    <>
      <div className={styles.canvasTitle}>
        <input
          ref={titleInputRef}
          className={styles.canvasTitleInput}
          value={canvasTitle}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          spellCheck={false}
          aria-label="Canvas title"
          style={{ width: `${Math.max(80, canvasTitle.length * 8.5 + 20)}px` }}
        />
      </div>
      <div
        ref={scrollRef}
        data-storyboard-canvas-scroll
        data-sb-canvas-theme={canvasTheme}
        {...canvasPrimerAttrs}
        className={styles.canvasScroll}
        style={{
          ...canvasThemeVars,
          ...(spaceHeld ? { cursor: panningActive ? 'grabbing' : 'grab' } : {}),
        }}
        onClick={() => setSelectedWidgetId(null)}
        onMouseDown={handlePanStart}
      >
        <div
          data-storyboard-canvas-zoom
          data-sb-canvas-theme={canvasTheme}
          className={styles.canvasZoom}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            width: `${Math.max(10000, 100 / scale)}vw`,
            height: `${Math.max(10000, 100 / scale)}vh`,
            ...(spaceHeld ? { pointerEvents: 'none' } : {}),
          }}
        >
          <Canvas {...canvasProps} onDragEnd={handleItemDragEnd}>
            {allChildren}
          </Canvas>
        </div>
      </div>
    </>
  )
}
