import { createElement, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@dfosco/tiny-canvas'
import '@dfosco/tiny-canvas/style.css'
import { useCanvas } from './useCanvas.js'
import { shouldPreventCanvasTextSelection } from './textSelection.js'
import { getCanvasThemeVars, getCanvasPrimerAttrs } from './canvasTheme.js'
import { getWidgetComponent } from './widgets/index.js'
import { schemas, getDefaults } from './widgets/widgetProps.js'
import { getFeatures, isResizable, getAnchorState, canAcceptConnection } from './widgets/widgetConfig.js'
import { createPasteContext, resolvePaste } from './widgets/pasteRules.js'
import { getPasteRules } from '@dfosco/storyboard-core'
import { registerSmoothCorners } from '@dfosco/storyboard-core/smooth-corners'
import { isGitHubEmbedUrl } from './widgets/githubUrl.js'
import WidgetChrome from './widgets/WidgetChrome.jsx'
import ComponentWidget from './widgets/ComponentWidget.jsx'
import useUndoRedo from './useUndoRedo.js'
import useMarqueeSelect from './useMarqueeSelect.js'
import MarqueeOverlay from './MarqueeOverlay.jsx'
import {
  addWidget as addWidgetApi,
  checkGitHubCliAvailable,
  fetchGitHubEmbed,
  getCanvas as getCanvasApi,
  removeWidget as removeWidgetApi,
  updateCanvas,
  updateFolderMeta,
  uploadImage,
  addConnector as addConnectorApi,
  removeConnector as removeConnectorApi,
} from './canvasApi.js'
import PageSelector from './PageSelector.jsx'
import Icon from '../Icon.jsx'
import { stories as storyIndex } from 'virtual:storyboard-data-index'
import styles from './CanvasPage.module.css'
import ConnectorLayer from './ConnectorLayer.jsx'

const ZOOM_MIN = 25
const ZOOM_MAX = 200

/** Saved viewport state older than this is considered stale — zoom-to-fit instead. */
const VIEWPORT_TTL_MS = 15 * 60 * 1000

const CANVAS_BRIDGE_STATE_KEY = '__storyboardCanvasBridgeState'
const GH_INSTALL_URL = 'https://github.com/cli/cli'

registerSmoothCorners()

/** Matches branch-deploy base path prefixes like /branch--my-feature/ */
const BRANCH_PREFIX_RE = /^\/branch--[^/]+/

// Build a reverse map from story route paths → { storyId, route }
const storyRouteIndex = new Map()
for (const [storyId, data] of Object.entries(storyIndex || {})) {
  if (data?._route) {
    storyRouteIndex.set(data._route.replace(/\/+$/, ''), storyId)
  }
}

function getToolbarColorMode(theme) {
  return String(theme || 'light').startsWith('dark') ? 'dark' : 'light'
}

function resolveCanvasThemeFromStorage() {
  if (typeof localStorage === 'undefined') return 'light'
  let sync = { prototype: true, toolbar: false, codeBoxes: true, canvas: true }
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
 * Get the copyable URL for a widget based on its type.
 * Returns the most relevant URL/path for the widget content.
 */
// eslint-disable-next-line no-unused-vars
function getWidgetCopyableUrl(widget) {
  const { type, props = {} } = widget
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  switch (type) {
    case 'prototype':
      // Prototype src is a path like "/MyPrototype" - make it a full URL
      return props.src ? `${window.location.origin}${base.replace(/\/$/, '')}${props.src}` : ''
    case 'figma-embed':
      return props.url || ''
    case 'link-preview':
      return props.url || ''
    case 'image':
      // Return the served image URL
      return props.src ? `${window.location.origin}${base.replace(/\/$/, '')}/_storyboard/canvas/images/${props.src}` : ''
    case 'sticky-note':
      // Sticky notes have text content, not a URL
      return props.text || ''
    case 'markdown':
      // Markdown has content, not a URL
      return props.content || ''
    default:
      return ''
  }
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
function getViewportStorageKey(canvasId) {
  return `sb-canvas-viewport:${canvasId}`
}

function loadViewportState(canvasId) {
  try {
    const raw = localStorage.getItem(getViewportStorageKey(canvasId))
    if (!raw) { console.log('[viewport] no saved state for', canvasId); return null }
    const state = JSON.parse(raw)
    const timestamp = typeof state.timestamp === 'number' ? state.timestamp : 0
    const age = Date.now() - timestamp
    if (age > VIEWPORT_TTL_MS) {
      console.log('[viewport] stale state for', canvasId, '— age:', Math.round(age / 1000), 's')
      localStorage.removeItem(getViewportStorageKey(canvasId))
      return null
    }
    console.log('[viewport] loaded state for', canvasId, '— age:', Math.round(age / 1000), 's, zoom:', state.zoom, 'scroll:', state.scrollLeft, state.scrollTop)
    return {
      zoom: typeof state.zoom === 'number' ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, state.zoom)) : null,
      scrollLeft: typeof state.scrollLeft === 'number' ? state.scrollLeft : null,
      scrollTop: typeof state.scrollTop === 'number' ? state.scrollTop : null,
    }
  } catch { return null }
}

function saveViewportState(canvasId, state) {
  try {
    localStorage.setItem(getViewportStorageKey(canvasId), JSON.stringify({
      ...state,
      timestamp: Date.now(),
    }))
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

/** Snap a value to the nearest grid line. */
function snapValue(value, gridSize) {
  return Math.round(value / gridSize) * gridSize
}

/** Snap a position to the grid if snapping is enabled. */
// eslint-disable-next-line no-unused-vars
function snapPosition(pos, gridSize, enabled) {
  if (!enabled || !gridSize) return pos
  return {
    x: Math.max(0, snapValue(pos.x, gridSize)),
    y: Math.max(0, snapValue(pos.y, gridSize)),
  }
}

/** Snap a dimension to the grid if snapping is enabled. */
function snapDimension(value, gridSize, enabled, min = 0) {
  if (!enabled || !gridSize) return value
  return Math.max(min, snapValue(value, gridSize))
}

/** Padding (canvas-space pixels) around bounding box for zoom-to-fit. */
const FIT_PADDING = 48

/**
 * Compute the axis-aligned bounding box that contains every widget and source.
 * Returns { minX, minY, maxX, maxY } in canvas-space coordinates, or null if empty.
 */
function computeCanvasBounds(widgets, componentEntries) {
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

  // Component widgets (from jsxExports or sources fallback)
  for (const entry of componentEntries) {
    const x = entry.sourceData?.position?.x ?? 0
    const y = entry.sourceData?.position?.y ?? 0
    const fallback = WIDGET_FALLBACK_SIZES['component']
    const width = entry.sourceData?.width ?? fallback.width
    const height = entry.sourceData?.height ?? fallback.height
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
    hasItems = true
  }

  return hasItems ? { minX, minY, maxX, maxY } : null
}

/** Renders a single JSON-defined widget by type lookup. */
function WidgetRenderer({ widget, onUpdate, widgetRef, onRefreshGitHub, canRefreshGitHub }) {
  const Component = getWidgetComponent(widget.type)
  if (!Component) {
    console.warn(`[canvas] Unknown widget type: ${widget.type}`)
    return null
  }
  const resizable = isResizable(widget.type) && !!onUpdate
  // Only pass ref to forwardRef-wrapped components (e.g. PrototypeEmbed)
  const elementProps = {
    id: widget.id,
    props: widget.props,
    onUpdate,
    resizable,
    onRefreshGitHub,
    canRefreshGitHub,
  }
  if (Component.$$typeof === Symbol.for('react.forward_ref')) {
    elementProps.ref = widgetRef
  }
  return createElement(Component, elementProps)
}

/**
 * Wrapper for each JSON widget that holds its own ref for imperative actions.
 * This allows WidgetChrome to dispatch actions to the widget via ref.
 *
 * Memoized to prevent re-renders during zoom and unrelated state changes.
 */
const ChromeWrappedWidget = memo(function ChromeWrappedWidget({
  widget,
  selected,
  multiSelected,
  onSelect,
  onDeselect,
  onUpdate,
  onRemove,
  onCopy,
  onRefreshGitHub,
  canRefreshGitHub,
  onConnectorDragStart,
  readOnly,
}) {
  const widgetRef = useRef(null)
  const rawFeatures = getFeatures(widget.type, { isLocalDev: !readOnly })

  // Dynamically adjust features based on widget state
  const features = useMemo(() => {
    const isGitHub = !!widget.props?.github
    return rawFeatures.map((f) => {
      // Toggle collapse label and hide when content is short (no github = no collapse)
      if (f.action === 'toggle-collapse') {
        if (widget.type === 'link-preview' && !isGitHub) return null
        return {
          ...f,
          label: widget.props?.collapsed ? 'Expand height' : 'Collapse height',
          icon: widget.props?.collapsed ? 'unfold' : 'fold',
        }
      }
      // Hide refresh-github for non-GitHub link previews
      if (f.action === 'refresh-github' && !isGitHub) return null
      return f
    }).filter(Boolean)
  }, [rawFeatures, widget.props?.github, widget.props?.collapsed])

  const handleAction = useCallback((actionId) => {
    if (actionId === 'delete') {
      onRemove?.(widget.id)
    } else if (actionId === 'copy') {
      onCopy?.(widget)
    } else if (actionId === 'copy-text') {
      const title = widget.props?.title || ''
      const body = widget.props?.text || widget.props?.content || widget.props?.github?.body || ''
      const text = title && body ? `# ${title}\n\n${body}` : title || body
      navigator.clipboard?.writeText(text).catch(() => {})
    } else if (actionId === 'open-external') {
      const url = widget.props?.url || widget.props?.src
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } else if (actionId === 'refresh-github') {
      const url = widget.props?.url
      if (url && onRefreshGitHub) onRefreshGitHub(widget.id, url)
    } else if (actionId === 'toggle-collapse') {
      const wasCollapsed = !!widget.props?.collapsed
      onUpdate?.(widget.id, { collapsed: !wasCollapsed })
      // When collapsing, pan viewport to center the widget
      if (!wasCollapsed) {
        requestAnimationFrame(() => {
          const el = document.getElementById(widget.id)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
      }
    }
  }, [widget, onRemove, onCopy, onRefreshGitHub])

  const handleWidgetFieldUpdate = useCallback((updates) => {
    onUpdate?.(widget.id, updates)
  }, [onUpdate, widget.id])

  return (
    <WidgetChrome
      widgetId={widget.id}
      widgetType={widget.type}
      features={features}
      selected={selected}
      multiSelected={multiSelected}
      widgetProps={widget.props}
      widgetRef={widgetRef}
      onSelect={onSelect}
      onDeselect={onDeselect}
      onAction={handleAction}
      onUpdate={onUpdate ? handleWidgetFieldUpdate : undefined}
      onConnectorDragStart={onConnectorDragStart}
      readOnly={readOnly}
    >
      <WidgetRenderer
        widget={widget}
        onUpdate={onUpdate ? handleWidgetFieldUpdate : undefined}
        widgetRef={widgetRef}
        onRefreshGitHub={onRefreshGitHub}
        canRefreshGitHub={canRefreshGitHub}
      />
    </WidgetChrome>
  )
}, function chromeWidgetAreEqual(prev, next) {
  return (
    prev.widget === next.widget &&
    prev.selected === next.selected &&
    prev.multiSelected === next.multiSelected &&
    prev.readOnly === next.readOnly &&
    prev.onSelect === next.onSelect &&
    prev.onDeselect === next.onDeselect &&
    prev.onUpdate === next.onUpdate &&
    prev.onRemove === next.onRemove &&
    prev.onCopy === next.onCopy &&
    prev.onConnectorDragStart === next.onConnectorDragStart
  )
})

/**
 * Editable canvas/folder title — always visible, double-click to edit in dev mode.
 */
function CanvasTitleEditable({ canvasId, canvasMeta, canvas, isLocalDev }) {
  const [editing, setEditing] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const inputRef = useRef(null)
  const displayTitle = canvasMeta?.title || canvas?.title || canvasId.split('/').pop()

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleCommit = useCallback(async () => {
    const trimmed = titleValue.trim()
    setEditing(false)
    if (!trimmed || trimmed === displayTitle) return
    try {
      if (canvasId.includes('/')) {
        const folder = canvasId.split('/')[0]
        const result = await updateFolderMeta(folder, trimmed)
        if (result?.renamed && result?.folder) {
          // Folder was renamed on disk — navigate to new route
          const pageName = canvasId.split('/').slice(1).join('/')
          const newCanvasId = `${result.folder}/${pageName}`
          const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
          const targetUrl = `${base}/canvas/${newCanvasId}`
          if (import.meta.hot) {
            const timer = setTimeout(() => { window.location.href = targetUrl }, 3000)
            import.meta.hot.on('vite:beforeFullReload', () => {
              clearTimeout(timer)
              sessionStorage.setItem('sb-pending-navigate', targetUrl)
            })
          } else {
            setTimeout(() => { window.location.href = targetUrl }, 1000)
          }
          return
        }
      } else {
        await updateCanvas(canvasId, { settings: { title: trimmed } })
      }
      // Reload to pick up the updated metadata from the data plugin
      if (import.meta.hot) {
        const timer = setTimeout(() => { window.location.reload() }, 2000)
        import.meta.hot.on('vite:beforeFullReload', () => clearTimeout(timer))
      } else {
        setTimeout(() => { window.location.reload() }, 1000)
      }
    } catch (err) {
      console.error('Failed to update title:', err)
    }
  }, [titleValue, displayTitle, canvasId])

  const handleDblClick = useCallback(() => {
    if (!isLocalDev) return
    setTitleValue(displayTitle)
    setEditing(true)
  }, [isLocalDev, displayTitle])

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={styles.canvasTitleEditing}
        type="text"
        value={titleValue}
        onChange={(e) => setTitleValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); handleCommit() }
          if (e.key === 'Escape') { e.preventDefault(); setEditing(false) }
        }}
        onBlur={handleCommit}
      />
    )
  }

  return (
    <h1
      className={styles.canvasTitleStatic}
      onDoubleClick={handleDblClick}
      style={isLocalDev ? { cursor: 'default' } : undefined}
    >
      {displayTitle}
    </h1>
  )
}

/**
 * Generic canvas page component.
 * Reads canvas data from the index and renders all widgets on a draggable surface.
 *
 * @param {{ canvasId: string }} props - Canvas name as indexed by the data plugin
 */
export default function CanvasPage({ canvasId: canvasIdProp, name, siblingPages = [], canvasMeta = null }) {
  const canvasId = canvasIdProp || name || ''
  const { canvas, jsxExports, jsxError, loading } = useCanvas(canvasId)
  const isLocalDev = typeof window !== 'undefined' && window.__SB_LOCAL_DEV__ === true && !new URLSearchParams(window.location.search).has('prodMode')

  // Local mutable copy of widgets for instant UI updates
  const [localWidgets, setLocalWidgets] = useState(canvas?.widgets ?? null)
  const [localConnectors, setLocalConnectors] = useState(canvas?.connectors ?? [])
  const [trackedCanvas, setTrackedCanvas] = useState(canvas)
  const [selectedWidgetIds, setSelectedWidgetIds] = useState(() => new Set())
  const initialViewport = loadViewportState(canvasId)
  const [zoom, setZoom] = useState(initialViewport?.zoom ?? 100)
  const zoomRef = useRef(initialViewport?.zoom ?? 100)
  const scrollRef = useRef(null)
  const zoomElRef = useRef(null)
  const zoomCommitTimer = useRef(null)
  const zoomEventTimer = useRef(null)
  const pendingScrollRestore = useRef(initialViewport)
  // Gate viewport persistence until initial positioning is complete.
  // Tracks which canvasId was last initialized — save effects only
  // write when this matches `canvasId`, preventing cross-canvas corruption.
  const viewportInitName = useRef(null)
  const [localSources, setLocalSources] = useState(canvas?.sources ?? [])
  const [canvasTheme, setCanvasTheme] = useState(() => resolveCanvasThemeFromStorage())
  const [snapEnabled, setSnapEnabled] = useState(canvas?.snapToGrid ?? false)
  const [snapGridSize, setSnapGridSize] = useState(canvas?.gridSize || 40)
  const [showGhInstallBanner, setShowGhInstallBanner] = useState(false)

  // Refs for snap settings (used by drop handler inside effect closure)
  const snapEnabledRef = useRef(snapEnabled)
  const snapGridSizeRef = useRef(snapGridSize)

  // Centralized list of component export names.
  // When jsxExports is available, use it (discovers new exports not yet in sources).
  // When jsxExports is null (module import failed), fall back to sources so iframes
  // still render — the error is contained inside each iframe.
  const componentEntries = useMemo(() => {
    const sourceMap = Object.fromEntries(
      (localSources || []).filter((s) => s?.export).map((s) => [s.export, s]),
    )
    if (jsxExports) {
      return Object.keys(jsxExports).map((exportName) => ({
        exportName,
        Component: jsxExports[exportName],
        sourceData: sourceMap[exportName] || {},
      }))
    }
    // Fallback: use sources when module import failed (iframe isolation still works)
    if (jsxError && canvas?._jsxModule) {
      return (localSources || [])
        .filter((s) => s?.export)
        .map((s) => ({
          exportName: s.export,
          Component: null,
          sourceData: s,
        }))
    }
    return []
  }, [jsxExports, jsxError, localSources, canvas?._jsxModule])

  // Undo/redo history — tracks both widgets and sources as a combined snapshot
  const undoRedo = useUndoRedo()
  const stateRef = useRef({ widgets: localWidgets, sources: localSources, connectors: localConnectors })
  useEffect(() => {
    stateRef.current = { widgets: localWidgets, sources: localSources, connectors: localConnectors }
  }, [localWidgets, localSources, localConnectors])

  // Serialized write queue — ensures JSONL events land in the right order
  const writeQueueRef = useRef(Promise.resolve())
  function queueWrite(fn) {
    writeQueueRef.current = writeQueueRef.current.then(fn).catch((err) =>
      console.error('[canvas] Write queue error:', err)
    )
    return writeQueueRef.current
  }

  // Ref for selectedWidgetIds to avoid stale closures in callbacks
  const selectedIdsRef = useRef(selectedWidgetIds)
  useEffect(() => {
    selectedIdsRef.current = selectedWidgetIds
  }, [selectedWidgetIds])

  const isMultiSelected = selectedWidgetIds.size > 1

  /**
   * Selection handler — shift+click toggles in/out of multi-select set,
   * plain click single-selects (clears others).
   * Suppressed immediately after a multi-drag to prevent the post-drag
   * click from collapsing the selection.
   */
  const handleWidgetSelect = useCallback((widgetId, shiftKey) => {
    if (justDraggedRef.current) return
    if (shiftKey) {
      setSelectedWidgetIds(prev => {
        const next = new Set(prev)
        if (next.has(widgetId)) {
          next.delete(widgetId)
        } else {
          next.add(widgetId)
        }
        return next
      })
    } else {
      setSelectedWidgetIds(new Set([widgetId]))
    }
  }, [])

  // --- Multi-select drag: peers animate to new positions on drag end ---
  // During drag, only the dragged widget moves (via neodrag). On drag end,
  // peer widget positions are updated via React state, and we add the
  // tc-on-translation class so they animate smoothly to their new spots.
  const peerArticlesRef = useRef(new Map())
  // Flag to suppress the click-based selection reset that fires after a drag
  const justDraggedRef = useRef(false)

  const handleItemDragStart = useCallback((dragId) => {
    const ids = selectedIdsRef.current
    peerArticlesRef.current.clear()
    if (ids.size <= 1 || !ids.has(dragId)) return

    // Suppress selection changes for the duration of the drag
    justDraggedRef.current = true // eslint-disable-line react-hooks/immutability

    // Collect peer article elements for transition on drag end
    for (const id of ids) {
      if (id === dragId) continue
      const widgetEl = document.getElementById(id)
      const article = widgetEl?.closest('article')
      if (!article) continue
      peerArticlesRef.current.set(id, article)
    }
  }, [])

  const handleItemDrag = useCallback(() => {
    // Peers stay put during drag — they animate on drag end
  }, [])

  /** Add transition class to peer articles so they animate to new positions. */
  const transitionPeers = useCallback(() => {
    for (const [, article] of peerArticlesRef.current) {
      article.classList.add('tc-on-translation')
    }
    // Remove class after animation completes
    const articles = [...peerArticlesRef.current.values()]
    setTimeout(() => {
      for (const article of articles) {
        article.classList.remove('tc-on-translation')
      }
    }, 150 + 50 + 200)
    peerArticlesRef.current.clear()
  }, [])

  const clearDragPreview = useCallback(() => {
    peerArticlesRef.current.clear()
  }, [])

  if (canvas !== trackedCanvas) {
    const isCanvasSwitch = trackedCanvas && canvas && trackedCanvas._route !== canvas._route
    console.log('[viewport] canvas changed —', isCanvasSwitch ? 'new canvas, resetting viewport' : 'same canvas, updating widgets only')
    setTrackedCanvas(canvas)
    setLocalWidgets(canvas?.widgets ?? null)
    setLocalConnectors(canvas?.connectors ?? [])
    setLocalSources(canvas?.sources ?? [])
    setSnapEnabled(canvas?.snapToGrid ?? false)
    setSnapGridSize(canvas?.gridSize || 40)
    undoRedo.reset()
    // Only reset viewport state when switching to a different canvas,
    // not when the same canvas refreshes with server data.
    if (isCanvasSwitch) {
      viewportInitName.current = null
      const newViewport = loadViewportState(canvasId)
      pendingScrollRestore.current = newViewport
      const newZoom = newViewport?.zoom ?? 100
      zoomRef.current = newZoom
      setZoom(newZoom)
    }
  }

  // Debounced save to server
  const debouncedSave = useRef(
    debounce((canvasId, widgets) => {
      updateCanvas(canvasId, { widgets }).catch((err) =>
        console.error('[canvas] Failed to save:', err)
      )
    }, 2000)
  ).current

  const handleWidgetUpdate = useCallback((widgetId, updates) => {
    undoRedo.snapshot(stateRef.current, 'edit', widgetId)
    // Snap width/height to grid when snap is enabled
    const snapped = { ...updates }
    if (snapEnabled && snapGridSize) {
      if (snapped.width != null) snapped.width = snapDimension(snapped.width, snapGridSize, true, 60)
      if (snapped.height != null) snapped.height = snapDimension(snapped.height, snapGridSize, true, 60)
    }
    setLocalWidgets((prev) => {
      if (!prev) return prev
      const next = prev.map((w) =>
        w.id === widgetId ? { ...w, props: { ...w.props, ...snapped } } : w
      )
      debouncedSave(canvasId, next)
      return next
    })
  }, [canvasId, debouncedSave, undoRedo, snapEnabled, snapGridSize])

  const handleWidgetRemove = useCallback((widgetId) => {
    undoRedo.snapshot(stateRef.current, 'remove', widgetId)
    setLocalWidgets((prev) => prev ? prev.filter((w) => w.id !== widgetId) : prev)
    // Cascade: remove connectors referencing this widget
    setLocalConnectors((prev) => {
      const orphaned = prev.filter((c) => c.start.widgetId === widgetId || c.end.widgetId === widgetId)
      if (orphaned.length === 0) return prev
      for (const c of orphaned) {
        queueWrite(() =>
          removeConnectorApi(canvasId, c.id).catch((err) =>
            console.error('[canvas] Failed to remove orphaned connector:', err)
          )
        )
      }
      return prev.filter((c) => c.start.widgetId !== widgetId && c.end.widgetId !== widgetId)
    })
    queueWrite(() =>
      removeWidgetApi(canvasId, widgetId).catch((err) =>
        console.error('[canvas] Failed to remove widget:', err)
      )
    )
  }, [canvasId, undoRedo])

  const handleConnectorAdd = useCallback(async ({ startWidgetId, startAnchor, endWidgetId, endAnchor }) => {
    try {
      const result = await addConnectorApi(canvasId, { startWidgetId, startAnchor, endWidgetId, endAnchor })
      if (result.success && result.connector) {
        setLocalConnectors((prev) => [...prev, result.connector])
      }
    } catch (err) {
      console.error('[canvas] Failed to add connector:', err)
    }
  }, [canvasId])

  const handleConnectorRemove = useCallback((connectorId) => {
    setLocalConnectors((prev) => prev.filter((c) => c.id !== connectorId))
    queueWrite(() =>
      removeConnectorApi(canvasId, connectorId).catch((err) =>
        console.error('[canvas] Failed to remove connector:', err)
      )
    )
  }, [canvasId])

  // Connector drag state
  const [connectorDrag, setConnectorDrag] = useState(null)

  const handleConnectorDragStart = useCallback((widgetId, anchor, e) => {
    e.stopPropagation()
    e.preventDefault()
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    const scale = zoomRef.current / 100
    const rect = scrollEl.getBoundingClientRect()

    const widgets = stateRef.current.widgets ?? []
    const startWidget = widgets.find((w) => w.id === widgetId)
    if (!startWidget) return

    // Don't start drag from a disabled/unavailable anchor
    const srcAnchorState = getAnchorState(startWidget.type, anchor)
    if (srcAnchorState !== 'available') return

    const computeAnchorPt = (widget, anch) => {
      let ww, wh
      const el = document.getElementById(widget.id)
      if (el) {
        const inner = el.querySelector('[data-widget-id]') || el.firstElementChild
        if (inner) { ww = inner.offsetWidth; wh = inner.offsetHeight }
      }
      if (!ww) ww = widget.props?.width ?? widget.bounds?.width ?? 270
      if (!wh) wh = widget.props?.height ?? widget.bounds?.height ?? 170
      const px = widget.position?.x ?? 0
      const py = widget.position?.y ?? 0
      switch (anch) {
        case 'top':    return { x: px + ww / 2, y: py }
        case 'bottom': return { x: px + ww / 2, y: py + wh }
        case 'left':   return { x: px, y: py + wh / 2 }
        case 'right':  return { x: px + ww, y: py + wh / 2 }
        default:       return { x: px + ww / 2, y: py + wh / 2 }
      }
    }

    const startPt = computeAnchorPt(startWidget, anchor)

    const toCanvasPoint = (clientX, clientY) => ({
      x: (scrollEl.scrollLeft + clientX - rect.left) / scale,
      y: (scrollEl.scrollTop + clientY - rect.top) / scale,
    })

    // Find nearest anchor on any other widget within snap distance
    const SNAP_DIST = 40
    const sourceType = startWidget.type
    const findNearestAnchor = (canvasPt) => {
      const currentWidgets = stateRef.current.widgets ?? []
      let best = null
      let bestDist = SNAP_DIST
      for (const w of currentWidgets) {
        if (w.id === widgetId) continue
        // Check if this widget type accepts connections from the source type
        if (!canAcceptConnection(w.type, sourceType)) continue
        for (const anch of ['top', 'bottom', 'left', 'right']) {
          // Skip unavailable or disabled anchors
          const anchorState = getAnchorState(w.type, anch)
          if (anchorState !== 'available') continue
          const pt = computeAnchorPt(w, anch)
          const dist = Math.hypot(pt.x - canvasPt.x, pt.y - canvasPt.y)
          if (dist < bestDist) {
            bestDist = dist
            best = { widgetId: w.id, anchor: anch, pt }
          }
        }
      }
      return best
    }

    const cursorPt = toCanvasPoint(e.clientX, e.clientY)
    const snap = findNearestAnchor(cursorPt)
    setConnectorDrag({
      startWidgetId: widgetId,
      startAnchor: anchor,
      startPt,
      endPt: snap ? snap.pt : cursorPt,
      endAnchor: snap ? snap.anchor : anchor,
      snapTarget: snap,
    })

    const handlePointerMove = (moveE) => {
      const pt = toCanvasPoint(moveE.clientX, moveE.clientY)
      const nearSnap = findNearestAnchor(pt)
      setConnectorDrag((prev) => prev ? {
        ...prev,
        endPt: nearSnap ? nearSnap.pt : pt,
        endAnchor: nearSnap ? nearSnap.anchor : prev.startAnchor,
        snapTarget: nearSnap,
      } : null)
    }

    const handlePointerUp = (upE) => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)

      const pt = toCanvasPoint(upE.clientX, upE.clientY)
      const nearSnap = findNearestAnchor(pt)

      if (nearSnap) {
        handleConnectorAdd({
          startWidgetId: widgetId,
          startAnchor: anchor,
          endWidgetId: nearSnap.widgetId,
          endAnchor: nearSnap.anchor,
        })
      }
      setConnectorDrag(null)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }, [handleConnectorAdd])

  // Drag an existing connector endpoint to reconnect or remove
  const handleEndpointDrag = useCallback((connector, endpoint, e) => {
    e.stopPropagation()
    e.preventDefault()
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    const scale = zoomRef.current / 100
    const rect = scrollEl.getBoundingClientRect()

    // The fixed end stays put; the dragged end follows cursor
    const fixedEnd = endpoint === 'start' ? 'end' : 'start'
    const fixedSide = connector[fixedEnd]
    const fixedWidget = (stateRef.current.widgets ?? []).find((w) => w.id === fixedSide.widgetId)
    if (!fixedWidget) return

    const computeAnchorPtLocal = (widget, anch) => {
      let ww, wh
      const el = document.getElementById(widget.id)
      if (el) {
        const inner = el.querySelector('[data-widget-id]') || el.firstElementChild
        if (inner) { ww = inner.offsetWidth; wh = inner.offsetHeight }
      }
      if (!ww) ww = widget.props?.width ?? widget.bounds?.width ?? 270
      if (!wh) wh = widget.props?.height ?? widget.bounds?.height ?? 170
      const px = widget.position?.x ?? 0
      const py = widget.position?.y ?? 0
      switch (anch) {
        case 'top':    return { x: px + ww / 2, y: py }
        case 'bottom': return { x: px + ww / 2, y: py + wh }
        case 'left':   return { x: px, y: py + wh / 2 }
        case 'right':  return { x: px + ww, y: py + wh / 2 }
        default:       return { x: px + ww / 2, y: py + wh / 2 }
      }
    }

    const fixedPt = computeAnchorPtLocal(fixedWidget, fixedSide.anchor)
    const fixedWidgetId = fixedSide.widgetId

    const toCanvasPoint = (clientX, clientY) => ({
      x: (scrollEl.scrollLeft + clientX - rect.left) / scale,
      y: (scrollEl.scrollTop + clientY - rect.top) / scale,
    })

    const SNAP_DIST = 40
    const sourceType = fixedWidget.type
    const findNearestAnchorLocal = (canvasPt) => {
      const currentWidgets = stateRef.current.widgets ?? []
      let best = null
      let bestDist = SNAP_DIST
      for (const w of currentWidgets) {
        if (w.id === fixedWidgetId) continue
        if (!canAcceptConnection(w.type, sourceType)) continue
        for (const anch of ['top', 'bottom', 'left', 'right']) {
          const anchorState = getAnchorState(w.type, anch)
          if (anchorState !== 'available') continue
          const pt = computeAnchorPtLocal(w, anch)
          const dist = Math.hypot(pt.x - canvasPt.x, pt.y - canvasPt.y)
          if (dist < bestDist) {
            bestDist = dist
            best = { widgetId: w.id, anchor: anch, pt }
          }
        }
      }
      return best
    }

    const cursorPt = toCanvasPoint(e.clientX, e.clientY)
    const snap = findNearestAnchorLocal(cursorPt)
    setConnectorDrag({
      startWidgetId: fixedWidgetId,
      startAnchor: fixedSide.anchor,
      startPt: fixedPt,
      endPt: snap ? snap.pt : cursorPt,
      endAnchor: snap ? snap.anchor : fixedSide.anchor,
      snapTarget: snap,
    })

    const handlePointerMove = (moveE) => {
      const pt = toCanvasPoint(moveE.clientX, moveE.clientY)
      const nearSnap = findNearestAnchorLocal(pt)
      setConnectorDrag((prev) => prev ? {
        ...prev,
        endPt: nearSnap ? nearSnap.pt : pt,
        endAnchor: nearSnap ? nearSnap.anchor : prev.startAnchor,
        snapTarget: nearSnap,
      } : null)
    }

    const handlePointerUp = (upE) => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)

      const pt = toCanvasPoint(upE.clientX, upE.clientY)
      const nearSnap = findNearestAnchorLocal(pt)

      // Always remove the old connector
      handleConnectorRemove(connector.id)

      // If snapped to a new anchor, create a new connector
      if (nearSnap) {
        handleConnectorAdd({
          startWidgetId: fixedWidgetId,
          startAnchor: fixedSide.anchor,
          endWidgetId: nearSnap.widgetId,
          endAnchor: nearSnap.anchor,
        })
      }
      setConnectorDrag(null)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }, [handleConnectorAdd, handleConnectorRemove])

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
      const result = await addWidgetApi(canvasId, {
        type: widget.type,
        props: { ...widget.props },
        position,
      })
      if (result.success && result.widget) {
        setLocalWidgets((prev) => [...(prev || []), result.widget])
        setSelectedWidgetIds(new Set([result.widget.id]))
      }
    } catch (err) {
      console.error('[canvas] Failed to copy widget:', err)
    }
  }, [canvasId, localWidgets, undoRedo])

  const showMissingGhBanner = useCallback(() => {
    setShowGhInstallBanner(true)
  }, [])

  const buildGitHubPreviewUpdates = useCallback(async (url) => {
    try {
      const availability = await checkGitHubCliAvailable()
      if (!availability?.available) {
        showMissingGhBanner()
        return null
      }

      const result = await fetchGitHubEmbed(url)
      if (result?.code === 'gh_unavailable') {
        showMissingGhBanner()
        return null
      }
      if (!result?.success || !result?.snapshot) return null

      const snapshot = result.snapshot
      return {
        title: snapshot.title || '',
        width: 580,
        height: 400,
        github: {
          kind: snapshot.kind || 'issue',
          parentKind: snapshot.parentKind || snapshot.kind || 'issue',
          context: snapshot.context || '',
          body: snapshot.body || '',
          bodyHtml: snapshot.bodyHtml || '',
          authors: Array.isArray(snapshot.authors)
            ? snapshot.authors.filter((author) => typeof author === 'string' && author.trim())
            : [],
          createdAt: snapshot.createdAt ?? null,
          updatedAt: snapshot.updatedAt ?? null,
          fetchedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      console.error('[canvas] Failed to fetch GitHub embed metadata:', err)
      return null
    }
  }, [showMissingGhBanner])

  const handleRefreshGitHubWidget = useCallback(async (widgetId, url) => {
    if (!widgetId || !url) return { updated: false }
    const updates = await buildGitHubPreviewUpdates(url)
    if (!updates) return { updated: false }
    handleWidgetUpdate(widgetId, updates)
    return { updated: true }
  }, [buildGitHubPreviewUpdates, handleWidgetUpdate])

  const debouncedSourceSave = useRef(
    debounce((canvasId, sources) => {
      updateCanvas(canvasId, { sources }).catch((err) =>
        console.error('[canvas] Failed to save sources:', err)
      )
    }, 2000)
  ).current

  const handleSourceUpdate = useCallback((exportName, updates) => {
    undoRedo.snapshot(stateRef.current, 'edit', `jsx-${exportName}`)
    const snapped = { ...updates }
    if (snapEnabled && snapGridSize) {
      if (snapped.width != null) snapped.width = snapDimension(snapped.width, snapGridSize, true, 100)
      if (snapped.height != null) snapped.height = snapDimension(snapped.height, snapGridSize, true, 60)
    }
    setLocalSources((prev) => {
      const current = Array.isArray(prev) ? prev : []
      const next = current.some((s) => s?.export === exportName)
        ? current.map((s) => (s?.export === exportName ? { ...s, ...snapped } : s))
        : [...current, { export: exportName, ...snapped }]
      debouncedSourceSave(canvasId, next)
      return next
    })
  }, [canvasId, debouncedSourceSave, undoRedo, snapEnabled, snapGridSize])

  const handleItemDragEnd = useCallback((dragId, position) => {
    if (!dragId || !position) {
      clearDragPreview()
      return
    }
    const rounded = { x: Math.max(0, roundPosition(position.x)), y: Math.max(0, roundPosition(position.y)) }

    const ids = selectedIdsRef.current
    // Multi-select move: apply same delta to all selected widgets
    // Checked BEFORE the jsx- early return so mixed selections work
    if (ids.size > 1 && ids.has(dragId)) {
      transitionPeers()
      // Suppress the click-based selection reset that fires after pointerup
      justDraggedRef.current = true // eslint-disable-line react-hooks/immutability
      requestAnimationFrame(() => { justDraggedRef.current = false })
      undoRedo.snapshot(stateRef.current, 'multi-move')

      // Compute delta from the dragged widget's old position
      const isJsx = dragId.startsWith('jsx-')
      let oldPos = { x: 0, y: 0 }
      if (isJsx) {
        const sourceExport = dragId.replace(/^jsx-/, '')
        const source = (stateRef.current.sources ?? []).find(s => s?.export === sourceExport)
        oldPos = source?.position || { x: 0, y: 0 }
      } else {
        const draggedWidget = (stateRef.current.widgets ?? []).find(w => w.id === dragId)
        oldPos = draggedWidget?.position || { x: 0, y: 0 }
      }
      const dx = rounded.x - oldPos.x
      const dy = rounded.y - oldPos.y

      debouncedSave.cancel()

      // Update JSON widget positions
      setLocalWidgets((prev) => {
        if (!prev) return prev
        const next = prev.map((w) => {
          if (w.id === dragId) return { ...w, position: rounded }
          if (ids.has(w.id)) {
            return {
              ...w,
              position: {
                x: Math.max(0, roundPosition((w.position?.x ?? 0) + dx)),
                y: Math.max(0, roundPosition((w.position?.y ?? 0) + dy)),
              },
            }
          }
          return w
        })
        queueWrite(() =>
          updateCanvas(canvasId, { widgets: next }).catch((err) =>
            console.error('[canvas] Failed to save multi-move:', err)
          )
        )
        return next
      })

      // Update JSX source positions
      setLocalSources((prev) => {
        const current = Array.isArray(prev) ? prev : []
        let changed = false
        const next = current.map((s) => {
          if (!s?.export) return s
          const sid = `jsx-${s.export}`
          if (sid === dragId) {
            changed = true
            return { ...s, position: rounded }
          }
          if (ids.has(sid)) {
            changed = true
            return {
              ...s,
              position: {
                x: Math.max(0, roundPosition((s.position?.x ?? 0) + dx)),
                y: Math.max(0, roundPosition((s.position?.y ?? 0) + dy)),
              },
            }
          }
          return s
        })
        if (changed) {
          queueWrite(() =>
            updateCanvas(canvasId, { sources: next }).catch((err) =>
              console.error('[canvas] Failed to save multi-move sources:', err)
            )
          )
        }
        return changed ? next : current
      })
      return
    }

    if (dragId.startsWith('jsx-')) {
      undoRedo.snapshot(stateRef.current, 'move', dragId)
      const sourceExport = dragId.replace(/^jsx-/, '')
      setLocalSources((prev) => {
        const current = Array.isArray(prev) ? prev : []
        const next = current.some((s) => s?.export === sourceExport)
          ? current.map((s) => (s?.export === sourceExport ? { ...s, position: rounded } : s))
          : [...current, { export: sourceExport, position: rounded }]
        queueWrite(() =>
          updateCanvas(canvasId, { sources: next }).catch((err) =>
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
        updateCanvas(canvasId, { widgets: next }).catch((err) =>
          console.error('[canvas] Failed to save widget position:', err)
        )
      )
      return next
    })
  }, [canvasId, undoRedo, debouncedSave, transitionPeers, clearDragPreview])

  // Keep zoomRef in sync when React state is set (e.g. by toolbar or zoom-to-fit)
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  // Cleanup zoom timers on unmount
  useEffect(() => () => {
    clearTimeout(zoomCommitTimer.current)
    clearTimeout(zoomEventTimer.current)
  }, [])

  // Restore scroll position from localStorage after first render.
  // When saved state is fresh (< 15 min), restore it. Otherwise zoom-to-fit
  // all objects so the user sees a useful overview instead of stale coordinates.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || loading) return
    const saved = pendingScrollRestore.current
    if (saved) {
      console.log('[viewport] restoring saved viewport — zoom:', saved.zoom, 'scroll:', saved.scrollLeft, saved.scrollTop)
      // Fresh saved viewport — restore exactly
      if (saved.scrollLeft != null) el.scrollLeft = saved.scrollLeft
      if (saved.scrollTop != null) el.scrollTop = saved.scrollTop
      pendingScrollRestore.current = null
    } else {
      console.log('[viewport] no saved viewport — fitting to objects')
      // No saved state or stale — zoom-to-fit all objects
      const bounds = computeCanvasBounds(localWidgets, componentEntries)
      if (bounds && el.clientWidth > 0 && el.clientHeight > 0) {
        const boxW = bounds.maxX - bounds.minX + FIT_PADDING * 2
        const boxH = bounds.maxY - bounds.minY + FIT_PADDING * 2
        const fitScale = Math.min(el.clientWidth / boxW, el.clientHeight / boxH)
        const fitZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(fitScale * 100)))
        const newScale = fitZoom / 100
        zoomRef.current = fitZoom
        // Imperative DOM update for initial zoom-to-fit — same path as applyZoom
        const zoomEl = zoomElRef.current
        if (zoomEl) {
          zoomEl.style.transform = `scale(${newScale})`
          zoomEl.style.width = `${Math.max(10000, 100 / newScale)}vw`
          zoomEl.style.height = `${Math.max(10000, 100 / newScale)}vh`
        }
        setZoom(fitZoom)
        el.scrollLeft = (bounds.minX - FIT_PADDING) * newScale
        el.scrollTop = (bounds.minY - FIT_PADDING) * newScale
      } else {
        el.scrollLeft = 0
        el.scrollTop = 0
      }
    }
    // Allow save effects for this canvas now that positioning is settled.
    viewportInitName.current = canvasId
  }, [canvasId, loading])

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
      const entry = componentEntries.find((e) => e.exportName === exportName)
      if (entry) {
        const fallback = WIDGET_FALLBACK_SIZES['component']
        x = entry.sourceData?.position?.x ?? 0
        y = entry.sourceData?.position?.y ?? 0
        w = entry.sourceData?.width ?? fallback.width
        h = entry.sourceData?.height ?? fallback.height
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
  }, [loading, localWidgets, componentEntries])

  // Persist viewport state (zoom only) to localStorage on zoom changes.
  // Scroll position is persisted separately by the debounced scroll handler,
  // cleanup handler, and beforeunload — never here, because imperative zoom
  // operations (applyZoom, zoom-to-fit) adjust scroll AFTER setZoom, so the
  // scroll values would be stale at this point.
  useEffect(() => {
    if (viewportInitName.current !== canvasId) return
    const el = scrollRef.current
    console.log('[viewport] saving — zoom:', zoom, 'scroll:', el?.scrollLeft, el?.scrollTop)
    // Read current scroll so the zoom entry doesn't zero-out position,
    // but the authoritative scroll save comes from the scroll handler.
    saveViewportState(canvasId, {
      zoom,
      scrollLeft: el?.scrollLeft ?? 0,
      scrollTop: el?.scrollTop ?? 0,
    })
  }, [canvasId, zoom])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const saveNow = () => {
      if (viewportInitName.current !== canvasId) return
      saveViewportState(canvasId, {
        zoom: zoomRef.current,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      })
    }
    const debouncedScrollSave = debounce(saveNow, 150)
    function handleScroll() {
      if (viewportInitName.current !== canvasId) return
      debouncedScrollSave()
    }
    el.addEventListener('scroll', handleScroll, { passive: true })

    // Flush viewport state on page unload so a refresh never misses it
    function handleBeforeUnload() {
      debouncedScrollSave.cancel()
      saveNow()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      debouncedScrollSave.cancel()
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Save final state on cleanup (covers SPA navigation where
      // beforeunload doesn't fire).
      saveNow()
    }
  }, [canvasId, loading])

  /**
   * Zoom to a new level, anchoring on an optional client-space point.
   * When a cursor position is provided (e.g. from a wheel event), the
   * canvas point under the cursor stays fixed. Otherwise falls back to
   * the viewport center.
   *
   * Performs an imperative DOM mutation instead of a React state update
   * to avoid triggering a full re-render of the widget tree on every
   * zoom tick. React state is committed after a debounce for toolbar
   * display updates.
   */
  function applyZoom(newZoom, clientX, clientY) {
    const el = scrollRef.current
    const zoomEl = zoomElRef.current
    const clampedZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom))

    if (!el || !zoomEl) {
      zoomRef.current = clampedZoom
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

    // Imperative DOM update — no React re-render
    zoomRef.current = clampedZoom
    zoomEl.style.transform = `scale(${newScale})`
    zoomEl.style.width = `${Math.max(10000, 100 / newScale)}vw`
    zoomEl.style.height = `${Math.max(10000, 100 / newScale)}vh`

    // Hint GPU compositing during active zoom
    zoomEl.dataset.zooming = ''

    // Scroll so the same canvas point stays under the anchor
    el.scrollLeft = canvasX * newScale - anchorX
    el.scrollTop = canvasY * newScale - anchorY

    // Debounced commit: update React state for toolbar display + persistence
    clearTimeout(zoomCommitTimer.current)
    zoomCommitTimer.current = setTimeout(() => {
      // Remove GPU compositing hint
      delete zoomEl.dataset.zooming
      setZoom(clampedZoom)
    }, 150)

    // Throttled zoom-changed event for external consumers (toolbar)
    if (!zoomEventTimer.current) {
      zoomEventTimer.current = setTimeout(() => {
        zoomEventTimer.current = null
        window[CANVAS_BRIDGE_STATE_KEY] = { active: true, canvasId, zoom: zoomRef.current }
        document.dispatchEvent(new CustomEvent('storyboard:canvas:zoom-changed', {
          detail: { zoom: zoomRef.current }
        }))
      }, 100)
    }
  }

  // Signal canvas mount/unmount to CoreUIBar
  useEffect(() => {
    window[CANVAS_BRIDGE_STATE_KEY] = { active: true, canvasId, zoom: zoomRef.current }
    document.dispatchEvent(new CustomEvent('storyboard:canvas:mounted', {
      detail: { canvasId, zoom: zoomRef.current }
    }))

    function handleStatusRequest() {
      const state = window[CANVAS_BRIDGE_STATE_KEY] || { active: true, canvasId, zoom: zoomRef.current }
      document.dispatchEvent(new CustomEvent('storyboard:canvas:status', { detail: state }))
    }

    document.addEventListener('storyboard:canvas:status-request', handleStatusRequest)

    return () => {
      document.removeEventListener('storyboard:canvas:status-request', handleStatusRequest)
      window[CANVAS_BRIDGE_STATE_KEY] = { active: false, canvasId: '', zoom: 100 }
      document.dispatchEvent(new CustomEvent('storyboard:canvas:unmounted'))
    }
  }, [canvasId])

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
  }, [canvasId])

  // --- Selected widgets bridge ---
  // Writes .selectedwidgets.json so Copilot knows which canvas/widgets are active.
  // Uses a stable tabId to survive WebSocket reconnects.
  const selectionTabIdRef = useRef(Math.random().toString(36).slice(2, 10))

  // Gather selected widget data from refs (safe for callbacks/timeouts)
  const getSelectedWidgetData = useCallback(() => {
    const ids = [...selectedIdsRef.current]
    const widgets = (stateRef.current.widgets || [])
      .filter(w => ids.includes(w.id))
      .map(w => ({ id: w.id, type: w.type, props: w.props }))

    // Include jsx-* component selections
    for (const id of ids) {
      if (id.startsWith('jsx-') && !widgets.some(w => w.id === id)) {
        widgets.push({ id, type: 'component', props: { exportName: id.slice(4) } })
      }
    }

    return { widgetIds: ids, widgets }
  }, [])

  // Send focus event on mount, tab focus, and visibility change
  useEffect(() => {
    if (!import.meta.hot) return

    const tabId = selectionTabIdRef.current

    function sendFocus() {
      const { widgetIds, widgets } = getSelectedWidgetData()
      import.meta.hot.send('storyboard:canvas-focused', { tabId, canvasId, widgetIds, widgets })
    }

    sendFocus()

    function handleVisibility() {
      if (!document.hidden) sendFocus()
    }
    function handleFocus() { sendFocus() }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      import.meta.hot.send('storyboard:canvas-unfocused', { tabId })
    }
  }, [canvasId, getSelectedWidgetData])

  // Debounced selection change (500ms) — reads from refs at fire time
  useEffect(() => {
    if (!import.meta.hot) return

    const tabId = selectionTabIdRef.current
    const timer = setTimeout(() => {
      const { widgetIds, widgets } = getSelectedWidgetData()
      import.meta.hot.send('storyboard:selection-changed', { tabId, canvasId, widgetIds: widgetIds, widgets })
    }, 500)

    return () => clearTimeout(timer)
  }, [selectedWidgetIds, canvasId, getSelectedWidgetData])

  // Add a widget by type — used by CanvasControls and CoreUIBar event
  const addWidget = useCallback(async (type) => {
    const defaultProps = schemas[type] ? getDefaults(schemas[type]) : {}
    const center = getViewportCenter(scrollRef.current, zoomRef.current / 100)
    const pos = centerPositionForWidget(center, type, defaultProps)
    try {
      const result = await addWidgetApi(canvasId, {
        type,
        props: defaultProps,
        position: pos,
      })
      if (result.success && result.widget) {
        undoRedo.snapshot(stateRef.current, 'add')
        setLocalWidgets((prev) => [...(prev || []), result.widget])
        setSelectedWidgetIds(new Set([result.widget.id]))
      }
    } catch (err) {
      console.error('[canvas] Failed to add widget:', err)
    }
  }, [canvasId, undoRedo])

  // Add a story widget by storyId — used by CanvasControls story picker
  const addStoryWidget = useCallback(async (storyId) => {
    const storyProps = { storyId, exportName: '', width: 600, height: 400 }
    const center = getViewportCenter(scrollRef.current, zoomRef.current / 100)
    const pos = centerPositionForWidget(center, 'story', storyProps)
    try {
      const result = await addWidgetApi(canvasId, {
        type: 'story',
        props: storyProps,
        position: pos,
      })
      if (result.success && result.widget) {
        undoRedo.snapshot(stateRef.current, 'add')
        setLocalWidgets((prev) => [...(prev || []), result.widget])
        setSelectedWidgetIds(new Set([result.widget.id]))
      }
    } catch (err) {
      console.error('[canvas] Failed to add story widget:', err)
    }
  }, [canvasId, undoRedo])

  // Listen for CoreUIBar add-widget events
  useEffect(() => {
    function handleAddWidget(e) {
      addWidget(e.detail.type)
    }
    function handleAddStoryWidget(e) {
      addStoryWidget(e.detail.storyId)
    }
    document.addEventListener('storyboard:canvas:add-widget', handleAddWidget)
    document.addEventListener('storyboard:canvas:add-story-widget', handleAddStoryWidget)
    return () => {
      document.removeEventListener('storyboard:canvas:add-widget', handleAddWidget)
      document.removeEventListener('storyboard:canvas:add-story-widget', handleAddStoryWidget)
    }
  }, [addWidget, addStoryWidget])

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

  // Listen for snap-to-grid toggle from CoreUIBar
  useEffect(() => {
    function handleSnapToggle() {
      setSnapEnabled((prev) => {
        const next = !prev
        updateCanvas(canvasId, { settings: { snapToGrid: next } }).catch((err) =>
          console.error('[canvas] Failed to persist snap setting:', err)
        )
        return next
      })
    }
    document.addEventListener('storyboard:canvas:toggle-snap', handleSnapToggle)
    return () => document.removeEventListener('storyboard:canvas:toggle-snap', handleSnapToggle)
  }, [canvasId])

  // Broadcast snap state to Svelte toolbar
  useEffect(() => {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:snap-state', {
      detail: { snapEnabled }
    }))
    snapEnabledRef.current = snapEnabled
  }, [snapEnabled])

  // Respond to snap-state requests from Svelte toolbar (handles mount-order race)
  useEffect(() => {
    function handleRequest() {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:snap-state', {
        detail: { snapEnabled: snapEnabledRef.current }
      }))
    }
    document.addEventListener('storyboard:canvas:snap-state-request', handleRequest)
    return () => document.removeEventListener('storyboard:canvas:snap-state-request', handleRequest)
  }, [])

  // Listen for gridSize from Svelte toolbar config
  useEffect(() => {
    function handleGridSize(e) {
      const size = e.detail?.gridSize
      if (typeof size === 'number' && size > 0) setSnapGridSize(size)
    }
    document.addEventListener('storyboard:canvas:grid-size', handleGridSize)
    return () => document.removeEventListener('storyboard:canvas:grid-size', handleGridSize)
  }, [])

  // Keep snapGridSize ref in sync for drop handler
  useEffect(() => {
    snapGridSizeRef.current = snapGridSize
  }, [snapGridSize])

  // Listen for zoom-to-fit from CoreUIBar
  useEffect(() => {
    function handleZoomToFit() {
      const el = scrollRef.current
      if (!el) return

      const bounds = computeCanvasBounds(localWidgets, componentEntries)
      if (!bounds) return

      const boxW = bounds.maxX - bounds.minX + FIT_PADDING * 2
      const boxH = bounds.maxY - bounds.minY + FIT_PADDING * 2

      const viewW = el.clientWidth
      const viewH = el.clientHeight

      // Find the zoom level that fits the bounding box in the viewport
      const fitScale = Math.min(viewW / boxW, viewH / boxH)
      const fitZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(fitScale * 100)))
      const newScale = fitZoom / 100

      // Imperative DOM update — same path as applyZoom
      zoomRef.current = fitZoom
      const zoomEl = zoomElRef.current
      if (zoomEl) {
        zoomEl.style.transform = `scale(${newScale})`
        zoomEl.style.width = `${Math.max(10000, 100 / newScale)}vw`
        zoomEl.style.height = `${Math.max(10000, 100 / newScale)}vh`
      }
      setZoom(fitZoom)

      // Scroll so the bounding box top-left (with padding) is at viewport top-left
      el.scrollLeft = (bounds.minX - FIT_PADDING) * newScale
      el.scrollTop = (bounds.minY - FIT_PADDING) * newScale

      // Persist after both zoom and scroll are settled
      if (viewportInitName.current === canvasId) {
        saveViewportState(canvasId, {
          zoom: fitZoom,
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
        })
      }
    }
    document.addEventListener('storyboard:canvas:zoom-to-fit', handleZoomToFit)
    return () => document.removeEventListener('storyboard:canvas:zoom-to-fit', handleZoomToFit)
  }, [localWidgets, componentEntries])

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
    window[CANVAS_BRIDGE_STATE_KEY] = { active: true, canvasId, zoom }
    document.dispatchEvent(new CustomEvent('storyboard:canvas:zoom-changed', {
      detail: { zoom }
    }))
  }, [canvasId, zoom])

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
      if (selectedWidgetIds.size === 0) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
      if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedWidgetIds(new Set())
      }
      // Copy shortcut (one or more widgets selected):
      // cmd+c → copy canvasId::id1,id2,... (for cross-canvas paste-duplicate)
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'c' && !e.shiftKey && selectedWidgetIds.size >= 1) {
        // Filter out non-duplicable widgets (jsx- component widgets are code)
        const copyableIds = [...selectedWidgetIds].filter(id => !id.startsWith('jsx-'))
        if (copyableIds.length > 0) {
          e.preventDefault()
          navigator.clipboard.writeText(`${canvasId}::${copyableIds.join(',')}`).catch(() => {})
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        if (selectedWidgetIds.size > 1) {
          // Multi-delete — snapshot once, remove all, persist via updateCanvas
          undoRedo.snapshot(stateRef.current, 'multi-remove')
          debouncedSave.cancel()
          setLocalWidgets((prev) => {
            if (!prev) return prev
            const next = prev.filter(w => !selectedWidgetIds.has(w.id))
            queueWrite(() =>
              updateCanvas(canvasId, { widgets: next }).catch(err =>
                console.error('[canvas] Failed to save multi-delete:', err)
              )
            )
            return next
          })
        } else {
          const widgetId = [...selectedWidgetIds][0]
          if (widgetId) handleWidgetRemove(widgetId)
        }
        setSelectedWidgetIds(new Set())
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedWidgetIds, localWidgets, handleWidgetRemove, undoRedo, canvasId, debouncedSave])

  // Ref to store processImageFile for use by drop effect
  const processImageFileRef = useRef(null)

  // Paste and drop handler — images become image widgets, same-origin URLs become prototypes,
  // other URLs become link previews, text becomes markdown
  useEffect(() => {
    const origin = window.location.origin
    const basePath = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
    const pasteCtx = createPasteContext(origin, basePath)

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

    /**
     * Process an image file (from paste or drop) and add it as a widget.
     * @param {File|Blob} file - Image file to process
     * @param {{ x: number, y: number }|null} position - Drop position, or null to use viewport center
     */
    async function processImageFile(file, position = null) {
      try {
        const dataUrl = await blobToDataUrl(file)
        const { width: natW, height: natH } = await getImageDimensions(dataUrl)

        // Display at 2x retina: halve natural dimensions, then cap at 600px
        const maxWidth = 600
        let displayW = Math.round(natW / 2)
        let displayH = Math.round(natH / 2)
        if (displayW > maxWidth) {
          displayH = Math.round(displayH * (maxWidth / displayW))
          displayW = maxWidth
        }

        const uploadResult = await uploadImage(dataUrl, canvasId)
        if (!uploadResult.success) {
          console.error('[canvas] Image upload failed:', uploadResult.error)
          return false
        }

        // Use provided position or fall back to viewport center
        let pos
        if (position) {
          pos = { x: position.x, y: position.y }
        } else {
          const center = getViewportCenter(scrollRef.current, zoomRef.current / 100)
          pos = centerPositionForWidget(center, 'image', { width: displayW, height: displayH })
        }

        const result = await addWidgetApi(canvasId, {
          type: 'image',
          props: { src: uploadResult.filename, private: false, width: displayW, height: displayH },
          position: pos,
        })
        if (result.success && result.widget) {
          undoRedo.snapshot(stateRef.current, 'add')
          setLocalWidgets((prev) => [...(prev || []), result.widget])
          setSelectedWidgetIds(new Set([result.widget.id]))
        }
        return true
      } catch (err) {
        console.error('[canvas] Failed to process image:', err)
        return false
      }
    }

    // Store in ref for use by drag/drop effect
    processImageFileRef.current = processImageFile

    async function handleImagePaste(e) {
      const items = e.clipboardData?.items
      if (!items) return false

      for (const item of items) {
        if (!item.type.startsWith('image/')) continue

        const blob = item.getAsFile()
        if (!blob) continue

        e.preventDefault()
        await processImageFile(blob, null)
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

      // Detect canvasId::widgetId or canvasId::id1,id2,id3 format for widget duplication
      // Also supports legacy canvasId/widgetId for basenames without slashes,
      // but only when the second segment looks like a widget ID (type-hash).
      const widgetRefMatch = text.match(/^(.+)::([^:]+)$/) || (text.indexOf('::') === -1 && text.match(/^([^/]+)\/((?:sticky-note|markdown|prototype|link-preview|figma-embed|component|image)-[a-z0-9]+)$/))
      if (widgetRefMatch) {
        e.preventDefault()
        const [, sourceCanvas, sourceWidgetRef] = widgetRefMatch
        const sourceWidgetIds = sourceWidgetRef.split(',').filter(id => !id.startsWith('jsx-'))
        if (sourceWidgetIds.length === 0) return

        try {
          // Resolve source widgets in canvas order
          let sourceList
          if (sourceCanvas === canvasId) {
            sourceList = localWidgets ?? []
          } else {
            const canvasData = await getCanvasApi(sourceCanvas)
            sourceList = canvasData?.widgets ?? []
          }

          const sourceWidgets = sourceList.filter(w => sourceWidgetIds.includes(w.id))
          if (sourceWidgets.length === 0) return

          // Compute bounding box of source widgets for relative positioning
          const fallback = { width: 200, height: 150 }
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          for (const w of sourceWidgets) {
            const wx = w.position?.x ?? 0
            const wy = w.position?.y ?? 0
            const ww = w.props?.width ?? WIDGET_FALLBACK_SIZES[w.type]?.width ?? fallback.width
            const wh = w.props?.height ?? WIDGET_FALLBACK_SIZES[w.type]?.height ?? fallback.height
            if (wx < minX) minX = wx
            if (wy < minY) minY = wy
            if (wx + ww > maxX) maxX = wx + ww
            if (wy + wh > maxY) maxY = wy + wh
          }
          const groupW = maxX - minX
          const groupH = maxY - minY

          // Center the group in the viewport
          const center = getViewportCenter(scrollRef.current, zoomRef.current / 100)
          const baseX = Math.round(center.x - groupW / 2)
          const baseY = Math.round(center.y - groupH / 2)

          // Single undo snapshot for the entire paste
          undoRedo.snapshot(stateRef.current, 'add')

          // Paste all widgets, collecting new IDs for selection
          const newWidgets = []
          for (const w of sourceWidgets) {
            const relX = (w.position?.x ?? 0) - minX
            const relY = (w.position?.y ?? 0) - minY
            const result = await addWidgetApi(canvasId, {
              type: w.type,
              props: { ...w.props },
              position: { x: baseX + relX, y: baseY + relY },
            })
            if (result.success && result.widget) {
              newWidgets.push(result.widget)
            }
          }

          if (newWidgets.length > 0) {
            setLocalWidgets((prev) => [...(prev || []), ...newWidgets])
            setSelectedWidgetIds(new Set(newWidgets.map(w => w.id)))
          }
        } catch (err) {
          console.error('[canvas] Failed to paste widget reference:', err)
        }
        // Always consume the ref — never fall through to markdown creation
        return
      }

      e.preventDefault()
      const resolved = resolvePaste(text, pasteCtx, getPasteRules())
      if (!resolved) return
      const { type } = resolved
      let props = resolved.props

      if (type === 'link-preview' && isGitHubEmbedUrl(props?.url || text)) {
        const githubUpdates = await buildGitHubPreviewUpdates(props?.url || text)
        if (githubUpdates) props = { ...props, ...githubUpdates }
      }

      const center = getViewportCenter(scrollRef.current, zoomRef.current / 100)
      const pos = centerPositionForWidget(center, type, props)
      try {
        const result = await addWidgetApi(canvasId, {
          type,
          props,
          position: pos,
        })
        if (result.success && result.widget) {
          undoRedo.snapshot(stateRef.current, 'add')
          setLocalWidgets((prev) => [...(prev || []), result.widget])
          setSelectedWidgetIds(new Set([result.widget.id]))
        }
      } catch (err) {
        console.error('[canvas] Failed to add widget from paste:', err)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId, undoRedo, localWidgets])

  // --- Drag and drop handlers for images from Finder/file manager ---
  // Separate effect to ensure listeners attach after scroll container mounts (loading=false)
  useEffect(() => {
    if (loading) return // Don't attach until canvas is loaded and scroll container exists

    const scrollEl = scrollRef.current
    if (!scrollEl) return

    function handleDragOver(e) {
      // Only handle if dragging files (not internal widget drag)
      if (!e.dataTransfer?.types?.includes('Files')) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }

    async function handleDrop(e) {
      // Only handle file drops, not internal widget drags
      if (!e.dataTransfer?.types?.includes('Files')) return

      // Prevent browser default (opening file) immediately for any file drop
      e.preventDefault()
      e.stopPropagation()

      const files = e.dataTransfer.files
      if (!files || files.length === 0) return

      // Filter to image files only — non-images are silently ignored (default already prevented)
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return

      // Convert drop coordinates to canvas coordinates
      const rect = scrollEl.getBoundingClientRect()
      const scale = zoomRef.current / 100

      // Mouse position relative to scroll container
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Convert to canvas coordinates (account for scroll and zoom)
      const canvasX = (scrollEl.scrollLeft + mouseX) / scale
      const canvasY = (scrollEl.scrollTop + mouseY) / scale

      // Snap to grid if enabled, using current grid size
      const gridSize = snapGridSizeRef.current
      const shouldSnap = snapEnabledRef.current
      const snappedX = shouldSnap ? Math.round(canvasX / gridSize) * gridSize : Math.round(canvasX)
      const snappedY = shouldSnap ? Math.round(canvasY / gridSize) * gridSize : Math.round(canvasY)

      // Process each image file, offsetting subsequent images
      for (let i = 0; i < imageFiles.length; i++) {
        const offset = shouldSnap ? i * gridSize : i * 24
        await processImageFileRef.current?.(imageFiles[i], { x: snappedX + offset, y: snappedY + offset })
      }
    }

    scrollEl.addEventListener('dragover', handleDragOver)
    scrollEl.addEventListener('drop', handleDrop)

    return () => {
      scrollEl.removeEventListener('dragover', handleDragOver)
      scrollEl.removeEventListener('drop', handleDrop)
    }
  }, [loading])

  // --- Undo / Redo ---
  const handleUndo = useCallback(() => {
    const previous = undoRedo.undo(stateRef.current)
    if (!previous) return
    debouncedSave.cancel()
    debouncedSourceSave.cancel()
    setLocalWidgets(previous.widgets)
    setLocalSources(previous.sources)
    queueWrite(() =>
      updateCanvas(canvasId, { widgets: previous.widgets, sources: previous.sources }).catch((err) =>
        console.error('[canvas] Failed to persist undo:', err)
      )
    )
  }, [canvasId, debouncedSave, debouncedSourceSave, undoRedo])

  const handleRedo = useCallback(() => {
    const next = undoRedo.redo(stateRef.current)
    if (!next) return
    debouncedSave.cancel()
    debouncedSourceSave.cancel()
    setLocalWidgets(next.widgets)
    setLocalSources(next.sources)
    queueWrite(() =>
      updateCanvas(canvasId, { widgets: next.widgets, sources: next.sources }).catch((err) =>
        console.error('[canvas] Failed to persist redo:', err)
      )
    )
  }, [canvasId, debouncedSave, debouncedSourceSave, undoRedo])

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

  // Receive cmd+wheel events forwarded from prototype/story iframes
  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type !== 'storyboard:embed:wheel') return
      zoomAccum.current += -e.data.deltaY
      const step = Math.trunc(zoomAccum.current)
      if (step === 0) return
      zoomAccum.current -= step
      applyZoom(zoomRef.current + step)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Touch pinch-to-zoom for mobile — two-finger pinch zooms the canvas
  const pinchState = useRef({ active: false, startDist: 0, startZoom: 0, centerX: 0, centerY: 0 })
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function getTouchDist(t1, t2) {
      const dx = t1.clientX - t2.clientX
      const dy = t1.clientY - t2.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    function handleTouchStart(e) {
      if (e.touches.length !== 2) return
      const dist = getTouchDist(e.touches[0], e.touches[1])
      pinchState.current = {
        active: true,
        startDist: dist,
        startZoom: zoomRef.current,
        centerX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        centerY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      }
    }

    function handleTouchMove(e) {
      if (!pinchState.current.active || e.touches.length !== 2) return
      e.preventDefault()
      const dist = getTouchDist(e.touches[0], e.touches[1])
      const ratio = dist / pinchState.current.startDist
      const newZoom = Math.round(pinchState.current.startZoom * ratio)
      applyZoom(newZoom, pinchState.current.centerX, pinchState.current.centerY)
    }

    function handleTouchEnd() {
      pinchState.current.active = false
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)
    el.addEventListener('touchcancel', handleTouchEnd)
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
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

  // Stable callback for deselecting all widgets
  const handleDeselectAll = useCallback(() => setSelectedWidgetIds(new Set()), [])

  // Marquee (lasso) multi-select on canvas background drag
  const { marqueeScreenRect, handleMarqueeMouseDown } = useMarqueeSelect({
    scrollRef,
    zoomRef: zoomRef,
    setSelectedWidgetIds,
    widgets: localWidgets,
    componentEntries,
    fallbackSizes: WIDGET_FALLBACK_SIZES,
    spaceHeld,
    isLocalDev,
  })

  // Stable callback for widget removal + deselect
  const handleWidgetRemoveAndDeselect = useCallback((id) => {
    handleWidgetRemove(id)
    setSelectedWidgetIds(new Set())
  }, [handleWidgetRemove])

  if (!canvas) {
    return (
      <div className={styles.empty}>
        <p>Canvas &ldquo;{canvasId}&rdquo; not found</p>
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
    snapGrid: snapEnabled ? [snapGridSize, snapGridSize] : undefined,
    colorMode: canvas.colorMode === 'auto'
      ? getToolbarColorMode(canvasTheme)
      : (canvas.colorMode ?? 'auto'),
    locked: !isLocalDev,
  }

  const canvasThemeVars = getCanvasThemeVars(canvasTheme)
  const canvasPrimerAttrs = getCanvasPrimerAttrs(canvasTheme)

  // Merge JSX-sourced widgets and JSON widgets
  const allChildren = []

  // 1. Component widgets (from jsxExports or sources fallback)
  const componentFeatures = getFeatures('component', { isLocalDev })
  for (const entry of componentEntries) {
    const { exportName, Component, sourceData } = entry
    const sourcePosition = sourceData.position || { x: 0, y: 0 }
    allChildren.push(
      <div
        key={`jsx-${exportName}`}
        id={`jsx-${exportName}`}
        data-tc-x={sourcePosition.x}
        data-tc-y={sourcePosition.y}
        {...(isLocalDev ? { 'data-tc-handle': '.tc-drag-handle, .tc-drag-surface' } : {})}
        {...canvasPrimerAttrs}
        style={canvasThemeVars}
        onClick={isLocalDev ? (e) => {
          e.stopPropagation()
          if (!e.target.closest('.tc-drag-handle')) {
            handleWidgetSelect(`jsx-${exportName}`, e.shiftKey)
          }
        } : undefined}
      >
        <WidgetChrome
          widgetId={`jsx-${exportName}`}
          features={componentFeatures}
          selected={selectedWidgetIds.has(`jsx-${exportName}`)}
          multiSelected={isMultiSelected && selectedWidgetIds.has(`jsx-${exportName}`)}
          onSelect={(shiftKey) => handleWidgetSelect(`jsx-${exportName}`, shiftKey)}
          onDeselect={handleDeselectAll}
          readOnly={!isLocalDev}
        >
          <ComponentWidget
            component={Component}
            jsxModule={canvas?._jsxModule}
            exportName={exportName}
            canvasTheme={canvasTheme}
            isLocalDev={isLocalDev}
            width={sourceData.width}
            height={sourceData.height}
            onUpdate={isLocalDev ? (updates) => handleSourceUpdate(exportName, updates) : undefined}
            resizable={isResizable('component') && isLocalDev}
          />
        </WidgetChrome>
      </div>
    )
  }

  // 2. JSON-defined mutable widgets (selectable, wrapped in WidgetChrome)
  // Sort so selected widgets render last (visually on top via DOM order)
  const sortedWidgets = (localWidgets ?? []).slice().sort((a, b) => {
    const aSelected = selectedWidgetIds.has(a.id) ? 1 : 0
    const bSelected = selectedWidgetIds.has(b.id) ? 1 : 0
    return aSelected - bSelected
  })
  for (const widget of sortedWidgets) {
    allChildren.push(
      <div
        key={widget.id}
        id={widget.id}
        data-tc-x={widget?.position?.x ?? 0}
        data-tc-y={widget?.position?.y ?? 0}
        {...(isLocalDev ? { 'data-tc-handle': '.tc-drag-handle, .tc-drag-surface' } : {})}
        {...canvasPrimerAttrs}
        style={canvasThemeVars}
        onClick={isLocalDev ? (e) => {
          e.stopPropagation()
          if (!e.target.closest('.tc-drag-handle')) {
            handleWidgetSelect(widget.id, e.shiftKey)
          }
        } : undefined}
      >
        <ChromeWrappedWidget
          widget={widget}
          selected={selectedWidgetIds.has(widget.id)}
          multiSelected={isMultiSelected && selectedWidgetIds.has(widget.id)}
          onSelect={(shiftKey) => handleWidgetSelect(widget.id, shiftKey)}
          onDeselect={handleDeselectAll}
          onUpdate={isLocalDev ? handleWidgetUpdate : undefined}
          onCopy={isLocalDev ? handleWidgetCopy : undefined}
          onRemove={isLocalDev ? handleWidgetRemoveAndDeselect : undefined}
          onRefreshGitHub={isLocalDev ? handleRefreshGitHubWidget : undefined}
          canRefreshGitHub={isLocalDev}
          onConnectorDragStart={isLocalDev ? handleConnectorDragStart : undefined}
          readOnly={!isLocalDev}
        />
      </div>
    )
  }

  const scale = zoom / 100

  return (
    <>
      <div className={styles.canvasTitle}>
        <a href={(import.meta.env?.BASE_URL || '/')} className={styles.canvasLogo} aria-label="Go to homepage">
          <Icon name="iconoir/key-command" size={16} color="#fff" />
        </a>
        <CanvasTitleEditable
          canvasId={canvasId}
          canvasMeta={canvasMeta}
          canvas={canvas}
          isLocalDev={isLocalDev}
        />
        <PageSelector currentName={canvasId} pages={siblingPages} isLocalDev={isLocalDev} />
        {isLocalDev && (
          <span className={styles.localEditingLabel}>Local editing</span>
        )}
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
        onMouseDown={(e) => { handlePanStart(e); handleMarqueeMouseDown(e); }}
      >
        <MarqueeOverlay rect={marqueeScreenRect} />
        <div
          ref={zoomElRef}
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
          <ConnectorLayer
            connectors={localConnectors}
            widgets={localWidgets ?? []}
            onRemove={isLocalDev ? handleConnectorRemove : undefined}
            onEndpointDrag={isLocalDev ? handleEndpointDrag : undefined}
            dragPreview={connectorDrag}
          />
          <Canvas {...canvasProps} onDragStart={isLocalDev ? handleItemDragStart : undefined} onDrag={isLocalDev ? handleItemDrag : undefined} onDragEnd={isLocalDev ? handleItemDragEnd : undefined}>
            {allChildren}
          </Canvas>
        </div>
      </div>
      {showGhInstallBanner && (
        <aside className={styles.ghInstallBanner} role="status" aria-live="polite">
          <span className={styles.ghInstallBannerText}>
            GitHub embeds require local <code>gh</code> CLI access.
          </span>
          <a
            href={GH_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ghInstallBannerLink}
          >
            Install GitHub CLI
          </a>
          <button
            type="button"
            className={styles.ghInstallBannerDismiss}
            onClick={() => setShowGhInstallBanner(false)}
          >
            Dismiss
          </button>
        </aside>
      )}
    </>
  )
}
