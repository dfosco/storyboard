import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Canvas } from '@dfosco/tiny-canvas'
import '@dfosco/tiny-canvas/style.css'
import { useCanvas } from './useCanvas.js'
import { shouldPreventCanvasTextSelection } from './textSelection.js'
import { getCanvasThemeVars, getCanvasPrimerAttrs } from './canvasTheme.js'
import { getWidgetComponent } from './widgets/index.js'
import { schemas, getDefaults } from './widgets/widgetProps.js'
import { getFeatures } from './widgets/widgetConfig.js'
import { isFigmaUrl, sanitizeFigmaUrl } from './widgets/figmaUrl.js'
import WidgetChrome from './widgets/WidgetChrome.jsx'
import ComponentWidget from './widgets/ComponentWidget.jsx'
import useUndoRedo from './useUndoRedo.js'
import { addWidget as addWidgetApi, updateCanvas, removeWidget as removeWidgetApi, uploadImage } from './canvasApi.js'
import styles from './CanvasPage.module.css'

const ZOOM_MIN = 25
const ZOOM_MAX = 200

const CANVAS_BRIDGE_STATE_KEY = '__storyboardCanvasBridgeState'

/** Matches branch-deploy base path prefixes like /branch--my-feature/ */
const BRANCH_PREFIX_RE = /^\/branch--[^/]+/

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
 * Exposes `.cancel()` to abort pending calls (used by undo/redo).
 */
function debounce(fn, ms) {
  let timer
  const debounced = (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
  debounced.cancel = () => clearTimeout(timer)
  return debounced
}

/** Per-canvas viewport state persistence (zoom + scroll position). */
function getViewportStorageKey(canvasName) {
  return `sb-canvas-viewport:${canvasName}`
}

function loadViewportState(canvasName) {
  try {
    const raw = localStorage.getItem(getViewportStorageKey(canvasName))
    if (!raw) return null
    const state = JSON.parse(raw)
    return {
      zoom: typeof state.zoom === 'number' ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, state.zoom)) : null,
      scrollLeft: typeof state.scrollLeft === 'number' ? state.scrollLeft : null,
      scrollTop: typeof state.scrollTop === 'number' ? state.scrollTop : null,
    }
  } catch { return null }
}

function saveViewportState(canvasName, state) {
  try {
    localStorage.setItem(getViewportStorageKey(canvasName), JSON.stringify(state))
  } catch { /* quota exceeded — non-critical */ }
}

/**
 * Get viewport-center coordinates in canvas space for placing a new widget.
 * Converts the visible center of the scroll container to unscaled canvas coordinates.
 */
function getViewportCenter(scrollEl, scale) {
  if (!scrollEl) {
    return { x: 0, y: 0 }
  }
  const cx = scrollEl.scrollLeft + scrollEl.clientWidth / 2
  const cy = scrollEl.scrollTop + scrollEl.clientHeight / 2
  return {
    x: Math.round(cx / scale),
    y: Math.round(cy / scale),
  }
}

/** Fallback sizes for widget types without explicit width/height defaults. */
const WIDGET_FALLBACK_SIZES = {
  'sticky-note':  { width: 270, height: 170 },
  'markdown':     { width: 530, height: 240 },
  'prototype':    { width: 800, height: 600 },
  'link-preview': { width: 320, height: 120 },
  'figma-embed':  { width: 800, height: 450 },
  'component':    { width: 200, height: 150 },
  'image':        { width: 400, height: 300 },
}

/**
 * Offset a position so the widget's center (not its top-left corner)
 * lands on the given point.
 */
function centerPositionForWidget(pos, type, props) {
  const fallback = WIDGET_FALLBACK_SIZES[type] || { width: 200, height: 150 }
  const w = props?.width ?? fallback.width
  const h = props?.height ?? fallback.height
  return {
    x: Math.round(pos.x - w / 2),
    y: Math.round(pos.y - h / 2),
  }
}

function roundPosition(value) {
  return Math.round(value)
}

/** Padding (canvas-space pixels) around bounding box for zoom-to-fit. */
const FIT_PADDING = 48

/**
 * Compute the axis-aligned bounding box that contains every widget and source.
 * Returns { minX, minY, maxX, maxY } in canvas-space coordinates, or null if empty.
 */
function computeCanvasBounds(widgets, sources, jsxExports) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let hasItems = false

  // JSON widgets
  for (const w of (widgets ?? [])) {
    const x = w?.position?.x ?? 0
    const y = w?.position?.y ?? 0
    const fallback = WIDGET_FALLBACK_SIZES[w.type] || { width: 200, height: 150 }
    const width = w.props?.width ?? fallback.width
    const height = w.props?.height ?? fallback.height
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
    hasItems = true
  }

  // JSX sources
  const sourceMap = Object.fromEntries(
    (sources || []).filter((s) => s?.export).map((s) => [s.export, s])
  )
  if (jsxExports) {
    for (const exportName of Object.keys(jsxExports)) {
      const sourceData = sourceMap[exportName] || {}
      const x = sourceData.position?.x ?? 0
      const y = sourceData.position?.y ?? 0
      const fallback = WIDGET_FALLBACK_SIZES['component']
      const width = sourceData.width ?? fallback.width
      const height = sourceData.height ?? fallback.height
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, y + height)
      hasItems = true
    }
  }

  return hasItems ? { minX, minY, maxX, maxY } : null
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
  onCopy,
}) {
  const widgetRef = useRef(null)
  const features = getFeatures(widget.type)

  const handleAction = useCallback((actionId) => {
    if (actionId === 'delete') {
      onRemove(widget.id)
    } else if (actionId === 'copy') {
      onCopy(widget)
    }
  }, [widget, onRemove, onCopy])

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
  const initialViewport = loadViewportState(name)
  const [zoom, setZoom] = useState(initialViewport?.zoom ?? 100)
  const zoomRef = useRef(initialViewport?.zoom ?? 100)
  const scrollRef = useRef(null)
  const pendingScrollRestore = useRef(initialViewport)
  const [canvasTitle, setCanvasTitle] = useState(canvas?.title || name)
  const titleInputRef = useRef(null)
  const [localSources, setLocalSources] = useState(canvas?.sources ?? [])
  const [canvasTheme, setCanvasTheme] = useState(() => resolveCanvasThemeFromStorage())

  // Undo/redo history — tracks both widgets and sources as a combined snapshot
  const undoRedo = useUndoRedo()
  const stateRef = useRef({ widgets: localWidgets, sources: localSources })
  useEffect(() => {
    stateRef.current = { widgets: localWidgets, sources: localSources }
  }, [localWidgets, localSources])

  // Serialized write queue — ensures JSONL events land in the right order
  const writeQueueRef = useRef(Promise.resolve())
  function queueWrite(fn) {
    writeQueueRef.current = writeQueueRef.current.then(fn).catch((err) =>
      console.error('[canvas] Write queue error:', err)
    )
    return writeQueueRef.current
  }

  if (canvas !== trackedCanvas) {
    setTrackedCanvas(canvas)
    setLocalWidgets(canvas?.widgets ?? null)
    setLocalSources(canvas?.sources ?? [])
    setCanvasTitle(canvas?.title || name)
    undoRedo.reset()
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
    undoRedo.snapshot(stateRef.current, 'edit', widgetId)
    setLocalWidgets((prev) => {
      if (!prev) return prev
      const next = prev.map((w) =>
        w.id === widgetId ? { ...w, props: { ...w.props, ...updates } } : w
      )
      debouncedSave(name, next)
      return next
    })
  }, [name, debouncedSave, undoRedo])

  const handleWidgetRemove = useCallback((widgetId) => {
    undoRedo.snapshot(stateRef.current, 'remove', widgetId)
    setLocalWidgets((prev) => prev ? prev.filter((w) => w.id !== widgetId) : prev)
    queueWrite(() =>
      removeWidgetApi(name, widgetId).catch((err) =>
        console.error('[canvas] Failed to remove widget:', err)
      )
    )
  }, [name, undoRedo])

  const handleWidgetCopy = useCallback(async (widget) => {
    // Find the next free offset — check how many copies already exist at +n*40
    const baseX = widget.position?.x ?? 0
    const baseY = widget.position?.y ?? 0
    const occupied = new Set(
      (localWidgets ?? []).map((w) => `${w.position?.x ?? 0},${w.position?.y ?? 0}`)
    )
    let n = 1
    while (occupied.has(`${baseX + n * 40},${baseY + n * 40}`)) {
      n++
    }
    const position = { x: baseX + n * 40, y: baseY + n * 40 }
    try {
      undoRedo.snapshot(stateRef.current, 'add')
      const result = await addWidgetApi(name, {
        type: widget.type,
        props: { ...widget.props },
        position,
      })
      if (result.success && result.widget) {
        setLocalWidgets((prev) => [...(prev || []), result.widget])
      }
    } catch (err) {
      console.error('[canvas] Failed to copy widget:', err)
    }
  }, [name, localWidgets, undoRedo])

  const debouncedSourceSave = useRef(
    debounce((canvasName, sources) => {
      updateCanvas(canvasName, { sources }).catch((err) =>
        console.error('[canvas] Failed to save sources:', err)
      )
    }, 2000)
  ).current

  const handleSourceUpdate = useCallback((exportName, updates) => {
    undoRedo.snapshot(stateRef.current, 'edit', `jsx-${exportName}`)
    setLocalSources((prev) => {
      const current = Array.isArray(prev) ? prev : []
      const next = current.some((s) => s?.export === exportName)
        ? current.map((s) => (s?.export === exportName ? { ...s, ...updates } : s))
        : [...current, { export: exportName, ...updates }]
      debouncedSourceSave(name, next)
      return next
    })
  }, [name, debouncedSourceSave, undoRedo])

  const handleItemDragEnd = useCallback((dragId, position) => {
    if (!dragId || !position) return
    const rounded = { x: Math.max(0, roundPosition(position.x)), y: Math.max(0, roundPosition(position.y)) }

    if (dragId.startsWith('jsx-')) {
      undoRedo.snapshot(stateRef.current, 'move', dragId)
      const sourceExport = dragId.replace(/^jsx-/, '')
      setLocalSources((prev) => {
        const current = Array.isArray(prev) ? prev : []
        const next = current.some((s) => s?.export === sourceExport)
          ? current.map((s) => (s?.export === sourceExport ? { ...s, position: rounded } : s))
          : [...current, { export: sourceExport, position: rounded }]
        queueWrite(() =>
          updateCanvas(name, { sources: next }).catch((err) =>
            console.error('[canvas] Failed to save source position:', err)
          )
        )
        return next
      })
      return
    }

    undoRedo.snapshot(stateRef.current, 'move', dragId)
    setLocalWidgets((prev) => {
      if (!prev) return prev
      const next = prev.map((w) =>
        w.id === dragId ? { ...w, position: rounded } : w
      )
      queueWrite(() =>
        updateCanvas(name, { widgets: next }).catch((err) =>
          console.error('[canvas] Failed to save widget position:', err)
        )
      )
      return next
    })
  }, [name, undoRedo])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  // Restore scroll position from localStorage after first render
  useEffect(() => {
    const el = scrollRef.current
    const saved = pendingScrollRestore.current
    if (el && saved) {
      if (saved.scrollLeft != null) el.scrollLeft = saved.scrollLeft
      if (saved.scrollTop != null) el.scrollTop = saved.scrollTop
      pendingScrollRestore.current = null
    }
  }, [name, loading])

  // Center on a specific widget if `?widget=<id>` is in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const targetId = params.get('widget')
    if (!targetId || loading) return

    const el = scrollRef.current
    if (!el) return

    let x, y, w, h

    // Check JSON widgets first
    const widgets = localWidgets ?? []
    const widget = widgets.find((wgt) => wgt.id === targetId)
    if (widget) {
      const fallback = WIDGET_FALLBACK_SIZES[widget.type] || { width: 200, height: 150 }
      x = widget.position?.x ?? 0
      y = widget.position?.y ?? 0
      w = widget.props?.width ?? fallback.width
      h = widget.props?.height ?? fallback.height
    }

    // Check JSX sources (jsx-ExportName)
    if (!widget && targetId.startsWith('jsx-')) {
      const exportName = targetId.slice(4)
      const sourceMap = Object.fromEntries(
        (localSources || []).filter((s) => s?.export).map((s) => [s.export, s])
      )
      const sourceData = sourceMap[exportName]
      if (sourceData || (jsxExports && exportName in jsxExports)) {
        const fallback = WIDGET_FALLBACK_SIZES['component']
        x = sourceData?.position?.x ?? 0
        y = sourceData?.position?.y ?? 0
        w = sourceData?.width ?? fallback.width
        h = sourceData?.height ?? fallback.height
      }
    }

    if (x == null) return

    const scale = zoomRef.current / 100
    el.scrollLeft = (x + w / 2) * scale - el.clientWidth / 2
    el.scrollTop = (y + h / 2) * scale - el.clientHeight / 2

    // Clean the URL param without triggering navigation
    const url = new URL(window.location.href)
    url.searchParams.delete('widget')
    window.history.replaceState({}, '', url.toString())
  }, [loading, localWidgets, localSources, jsxExports])

  // Persist viewport state (zoom + scroll) to localStorage on changes
  useEffect(() => {
    const el = scrollRef.current
    saveViewportState(name, {
      zoom,
      scrollLeft: el?.scrollLeft ?? 0,
      scrollTop: el?.scrollTop ?? 0,
    })
  }, [name, zoom])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function handleScroll() {
      saveViewportState(name, {
        zoom: zoomRef.current,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      })
    }
    el.addEventListener('scroll', handleScroll, { passive: true })

    // Flush viewport state on page unload so a refresh never misses it
    function handleBeforeUnload() {
      saveViewportState(name, {
        zoom: zoomRef.current,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      })
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [name, loading])

  /**
   * Zoom to a new level, anchoring on an optional client-space point.
   * When a cursor position is provided (e.g. from a wheel event), the
   * canvas point under the cursor stays fixed. Otherwise falls back to
   * the viewport center.
   */
  function applyZoom(newZoom, clientX, clientY) {
    const el = scrollRef.current
    const clampedZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom))

    if (!el) {
      setZoom(clampedZoom)
      return
    }

    const oldScale = zoomRef.current / 100
    const newScale = clampedZoom / 100

    // Anchor point in scroll-container space
    const rect = el.getBoundingClientRect()
    const useViewportCenter = clientX == null || clientY == null
    const anchorX = useViewportCenter ? el.clientWidth / 2 : clientX - rect.left
    const anchorY = useViewportCenter ? el.clientHeight / 2 : clientY - rect.top

    // Anchor → canvas coordinate
    const canvasX = (el.scrollLeft + anchorX) / oldScale
    const canvasY = (el.scrollTop + anchorY) / oldScale

    // Synchronous render so the DOM has the new transform before we adjust scroll
    zoomRef.current = clampedZoom
    flushSync(() => setZoom(clampedZoom))

    // Scroll so the same canvas point stays under the anchor
    el.scrollLeft = canvasX * newScale - anchorX
    el.scrollTop = canvasY * newScale - anchorY
  }

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

  // Tell the Vite dev server to suppress full-reloads while this canvas is active.
  // The ?canvas-hmr URL param opts out of the guard for canvas UI development.
  // Sends a heartbeat every 3s so the guard auto-expires if the tab closes.
  useEffect(() => {
    if (!import.meta.hot) return
    const hmrEnabled = new URLSearchParams(window.location.search).has('canvas-hmr')
    if (hmrEnabled) return

    const msg = { active: true, hmrEnabled: false }
    import.meta.hot.send('storyboard:canvas-hmr-guard', msg)
    const interval = setInterval(() => {
      import.meta.hot.send('storyboard:canvas-hmr-guard', msg)
    }, 3000)

    return () => {
      clearInterval(interval)
      import.meta.hot.send('storyboard:canvas-hmr-guard', { active: false, hmrEnabled: true })
    }
  }, [name])

  // Add a widget by type — used by CanvasControls and CoreUIBar event
  const addWidget = useCallback(async (type) => {
    const defaultProps = schemas[type] ? getDefaults(schemas[type]) : {}
    const center = getViewportCenter(scrollRef.current, zoomRef.current / 100)
    const pos = centerPositionForWidget(center, type, defaultProps)
    try {
      const result = await addWidgetApi(name, {
        type,
        props: defaultProps,
        position: pos,
      })
      if (result.success && result.widget) {
        undoRedo.snapshot(stateRef.current, 'add')
        setLocalWidgets((prev) => [...(prev || []), result.widget])
      }
    } catch (err) {
      console.error('[canvas] Failed to add widget:', err)
    }
  }, [name, undoRedo])

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
        applyZoom(newZoom)
      }
    }
    document.addEventListener('storyboard:canvas:set-zoom', handleZoom)
    return () => document.removeEventListener('storyboard:canvas:set-zoom', handleZoom)
  }, [])

  // Listen for zoom-to-fit from CoreUIBar
  useEffect(() => {
    function handleZoomToFit() {
      const el = scrollRef.current
      if (!el) return

      const bounds = computeCanvasBounds(localWidgets, localSources, jsxExports)
      if (!bounds) return

      const boxW = bounds.maxX - bounds.minX + FIT_PADDING * 2
      const boxH = bounds.maxY - bounds.minY + FIT_PADDING * 2

      const viewW = el.clientWidth
      const viewH = el.clientHeight

      // Find the zoom level that fits the bounding box in the viewport
      const fitScale = Math.min(viewW / boxW, viewH / boxH)
      const fitZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(fitScale * 100)))
      const newScale = fitZoom / 100

      // Apply zoom synchronously so DOM updates before we scroll
      zoomRef.current = fitZoom
      flushSync(() => setZoom(fitZoom))

      // Scroll so the bounding box top-left (with padding) is at viewport top-left
      el.scrollLeft = (bounds.minX - FIT_PADDING) * newScale
      el.scrollTop = (bounds.minY - FIT_PADDING) * newScale
    }
    document.addEventListener('storyboard:canvas:zoom-to-fit', handleZoomToFit)
    return () => document.removeEventListener('storyboard:canvas:zoom-to-fit', handleZoomToFit)
  }, [localWidgets, localSources, jsxExports])

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
      if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedWidgetId(null)
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleWidgetRemove(selectedWidgetId)
        setSelectedWidgetId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedWidgetId, handleWidgetRemove])

  // Paste handler — images become image widgets, same-origin URLs become prototypes,
  // other URLs become link previews, text becomes markdown
  useEffect(() => {
    const origin = window.location.origin
    const basePath = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
    const baseUrl = origin + basePath

    // Check if a URL is same-origin, accounting for branch-deploy prefixes.
    // e.g. https://site.com/branch--my-feature/Proto and https://site.com/storyboard/Proto
    // are both same-origin prototype URLs.
    function isSameOriginPrototype(url) {
      if (!url.startsWith(origin)) return false
      if (url.startsWith(baseUrl)) return true
      // Match branch deploy URLs: origin + /branch--*/...
      const pathAfterOrigin = url.slice(origin.length)
      return BRANCH_PREFIX_RE.test(pathAfterOrigin)
    }

    // Strip the base path (or any branch prefix) from a pathname to get a portable src.
    function extractPrototypeSrc(pathname) {
      // Strip current base path
      if (basePath && pathname.startsWith(basePath)) {
        return pathname.slice(basePath.length) || '/'
      }
      // Strip branch prefix: /branch--name/rest → /rest
      const branchMatch = pathname.match(BRANCH_PREFIX_RE)
      if (branchMatch) {
        return pathname.slice(branchMatch[0].length) || '/'
      }
      return pathname
    }

    function blobToDataUrl(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }

    function getImageDimensions(dataUrl) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => resolve({ width: 400, height: 300 })
        img.src = dataUrl
      })
    }

    async function handleImagePaste(e) {
      const items = e.clipboardData?.items
      if (!items) return false

      for (const item of items) {
        if (!item.type.startsWith('image/')) continue

        const blob = item.getAsFile()
        if (!blob) continue

        e.preventDefault()

        try {
          const dataUrl = await blobToDataUrl(blob)
          const { width: natW, height: natH } = await getImageDimensions(dataUrl)

          // Display at 2x retina: halve natural dimensions, then cap at 600px
          const maxWidth = 600
          let displayW = Math.round(natW / 2)
          let displayH = Math.round(natH / 2)
          if (displayW > maxWidth) {
            displayH = Math.round(displayH * (maxWidth / displayW))
            displayW = maxWidth
          }

          const uploadResult = await uploadImage(dataUrl, name)
          if (!uploadResult.success) {
            console.error('[canvas] Image upload failed:', uploadResult.error)
            return true
          }

          const center = getViewportCenter(scrollRef.current, zoomRef.current / 100)
          const pos = centerPositionForWidget(center, 'image', { width: displayW, height: displayH })
          const result = await addWidgetApi(name, {
            type: 'image',
            props: { src: uploadResult.filename, private: false, width: displayW, height: displayH },
            position: pos,
          })
          if (result.success && result.widget) {
            undoRedo.snapshot(stateRef.current, 'add')
            setLocalWidgets((prev) => [...(prev || []), result.widget])
          }
        } catch (err) {
          console.error('[canvas] Failed to paste image:', err)
        }
        return true
      }
      return false
    }

    async function handlePaste(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

      // Image paste takes priority
      const handledImage = await handleImagePaste(e)
      if (handledImage) return

      const text = e.clipboardData?.getData('text/plain')?.trim()
      if (!text) return

      e.preventDefault()

      let type, props
      try {
        const parsed = new URL(text)
        if (isFigmaUrl(text)) {
          type = 'figma-embed'
          props = { url: sanitizeFigmaUrl(text), width: 800, height: 450 }
        } else if (isSameOriginPrototype(text)) {
          const pathPortion = parsed.pathname + parsed.search + parsed.hash
          const src = extractPrototypeSrc(pathPortion)
          type = 'prototype'
          props = { src: src || '/', originalSrc: src || '/', label: '', width: 800, height: 600 }
        } else {
          type = 'link-preview'
          props = { url: text, title: '' }
        }
      } catch {
        type = 'markdown'
        props = { content: text }
      }

      const center = getViewportCenter(scrollRef.current, zoomRef.current / 100)
      const pos = centerPositionForWidget(center, type, props)
      try {
        const result = await addWidgetApi(name, {
          type,
          props,
          position: pos,
        })
        if (result.success && result.widget) {
          undoRedo.snapshot(stateRef.current, 'add')
          setLocalWidgets((prev) => [...(prev || []), result.widget])
        }
      } catch (err) {
        console.error('[canvas] Failed to add widget from paste:', err)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [name, undoRedo])

  // --- Undo / Redo ---
  const handleUndo = useCallback(() => {
    const previous = undoRedo.undo(stateRef.current)
    if (!previous) return
    debouncedSave.cancel()
    debouncedSourceSave.cancel()
    setLocalWidgets(previous.widgets)
    setLocalSources(previous.sources)
    queueWrite(() =>
      updateCanvas(name, { widgets: previous.widgets, sources: previous.sources }).catch((err) =>
        console.error('[canvas] Failed to persist undo:', err)
      )
    )
  }, [name, debouncedSave, debouncedSourceSave, undoRedo])

  const handleRedo = useCallback(() => {
    const next = undoRedo.redo(stateRef.current)
    if (!next) return
    debouncedSave.cancel()
    debouncedSourceSave.cancel()
    setLocalWidgets(next.widgets)
    setLocalSources(next.sources)
    queueWrite(() =>
      updateCanvas(name, { widgets: next.widgets, sources: next.sources }).catch((err) =>
        console.error('[canvas] Failed to persist redo:', err)
      )
    )
  }, [name, debouncedSave, debouncedSourceSave, undoRedo])

  // Keyboard shortcuts — dev-only (Cmd+Z / Cmd+Shift+Z)
  useEffect(() => {
    if (!import.meta.hot) return
    function handleKeyDown(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        handleRedo()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // Listen for undo/redo from CoreUIBar (Svelte toolbar)
  useEffect(() => {
    function handleUndoEvent() { handleUndo() }
    function handleRedoEvent() { handleRedo() }
    document.addEventListener('storyboard:canvas:undo', handleUndoEvent)
    document.addEventListener('storyboard:canvas:redo', handleRedoEvent)
    return () => {
      document.removeEventListener('storyboard:canvas:undo', handleUndoEvent)
      document.removeEventListener('storyboard:canvas:redo', handleRedoEvent)
    }
  }, [handleUndo, handleRedo])

  // Broadcast undo/redo availability to Svelte toolbar
  useEffect(() => {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:undo-redo-state', {
      detail: { canUndo: undoRedo.canUndo, canRedo: undoRedo.canRedo }
    }))
  }, [undoRedo.canUndo, undoRedo.canRedo])

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
      applyZoom(zoomRef.current + step, e.clientX, e.clientY)
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
            widgetId={`jsx-${exportName}`}
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
          onCopy={handleWidgetCopy}
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
