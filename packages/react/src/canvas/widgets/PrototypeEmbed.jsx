import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import { buildPrototypeIndex, getFlag } from '@dfosco/storyboard-core'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, prototypeEmbedSchema } from './widgetProps.js'
import { getEmbedChromeVars } from './embedTheme.js'
import { uploadImage } from '../canvasApi.js'
import { useIframeQueue } from './useViewportEntry.js'
import styles from './PrototypeEmbed.module.css'
import overlayStyles from './embedOverlay.module.css'

function devLog(...args) {
  try { if (getFlag('dev-logs')) console.log('[canvas:prototype-embed]', ...args) } catch { /* */ }
}

function formatName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
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

export default forwardRef(function PrototypeEmbed({ id: widgetId, props, onUpdate, resizable }, ref) {
  const src = readProp(props, 'src', prototypeEmbedSchema)
  const width = readProp(props, 'width', prototypeEmbedSchema)
  const height = readProp(props, 'height', prototypeEmbedSchema)
  const zoom = readProp(props, 'zoom', prototypeEmbedSchema)
  const label = readProp(props, 'label', prototypeEmbedSchema) || src

  // Snapshot props for lazy loading
  const snapshotLight = props?.snapshotLight || null
  const snapshotDark = props?.snapshotDark || null

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const baseSegment = basePath.replace(/^\//, '')
  const rawSrc = useMemo(() => {
    if (!src) return ''
    if (/^https?:\/\//.test(src)) return src
    const cleaned = src.replace(/^\/branch--[^/]+/, '')
    if (baseSegment && cleaned.startsWith(basePath)) return cleaned
    if (baseSegment && cleaned.startsWith(baseSegment)) return `/${cleaned}`
    return `${basePath}${cleaned}`
  }, [src, basePath, baseSegment])

  const isExternal = /^https?:\/\//.test(rawSrc)
  const scale = zoom / 100

  const [editing, setEditing] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [filter, setFilter] = useState('')
  const [canvasTheme, setCanvasTheme] = useState(() => resolveCanvasThemeFromStorage())

  // Lazy loading state — only use snapshots that match this widget's ID
  const snapshotMatchesWidget = (url) => url && widgetId && url.includes(widgetId)
  const validSnapshotLight = snapshotMatchesWidget(snapshotLight) ? snapshotLight : null
  const validSnapshotDark = snapshotMatchesWidget(snapshotDark) ? snapshotDark : null
  const currentSnapshot = canvasTheme?.startsWith('dark') ? validSnapshotDark : validSnapshotLight
  const hasSnapshot = !!currentSnapshot

  // Sequential iframe queue — prevents stampede when many embeds lack snapshots.
  // Widgets with snapshots skip the queue entirely; others load one at a time.
  const { ready: queueReady, releaseSlot } = useIframeQueue(hasSnapshot || isExternal, widgetId)
  const [preloadIframe, setPreloadIframe] = useState(hasSnapshot || isExternal)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [showIframe, setShowIframe] = useState(hasSnapshot || isExternal)
  const [showSpinner, setShowSpinner] = useState(false)
  const capturingRef = useRef(false)

  devLog(widgetId, { hasSnapshot, isExternal, queueReady, preloadIframe, showIframe, iframeLoaded, src })

  // Start loading when the queue grants this widget a slot
  useEffect(() => {
    if (queueReady && !preloadIframe) {
      devLog(widgetId, 'queue ready → loading iframe')
      setPreloadIframe(true)
      setShowIframe(true)
    }
  }, [queueReady, preloadIframe])

  // Release the queue slot once the iframe has loaded or user clicked to interact
  useEffect(() => {
    if (iframeLoaded) {
      devLog(widgetId, 'iframe loaded')
      releaseSlot()
    }
  }, [iframeLoaded, releaseSlot])

  // Click-to-interact: immediately start iframe and release queue slot for others
  const activateIframe = useCallback(() => {
    devLog(widgetId, 'user activated → jumping queue')
    setShowIframe(true)
    setPreloadIframe(true)
    releaseSlot()
  }, [releaseSlot])

  // Show spinner only after 500ms of loading
  useEffect(() => {
    if (showIframe && !iframeLoaded && hasSnapshot) {
      const timer = setTimeout(() => setShowSpinner(true), 500)
      return () => clearTimeout(timer)
    }
    setShowSpinner(false)
  }, [showIframe, iframeLoaded, hasSnapshot])

  const inputRef = useRef(null)
  const filterRef = useRef(null)
  const embedRef = useRef(null)
  const iframeRef = useRef(null)
  const inlineContainerRef = useRef(null)
  const modalContainerRef = useRef(null)

  const iframeSrc = useMemo(() => {
    if (!rawSrc) return ''
    // External URLs are embedded as-is — storyboard query params only apply to local prototypes
    if (/^https?:\/\//.test(rawSrc)) return rawSrc
    const hashIdx = rawSrc.indexOf('#')
    const base = hashIdx >= 0 ? rawSrc.slice(0, hashIdx) : rawSrc
    const hash = hashIdx >= 0 ? rawSrc.slice(hashIdx) : ''
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}_sb_embed&_sb_theme_target=prototype&_sb_canvas_theme=${canvasTheme}${hash}`
  }, [rawSrc, canvasTheme])

  // Build prototype index for the picker
  const prototypeIndex = useMemo(() => {
    try {
      return buildPrototypeIndex()
    } catch {
      return { folders: [], prototypes: [], globalFlows: [], sorted: { title: { prototypes: [], folders: [] } } }
    }
  }, [])

  // Build grouped picker entries from the prototype index
  const pickerGroups = useMemo(() => {
    const groups = []
    const idx = prototypeIndex

    // Collect all prototypes (from folders first, then ungrouped)
    const allProtos = []
    for (const folder of (idx.sorted?.title?.folders || idx.folders || [])) {
      for (const proto of folder.prototypes || []) {
        if (!proto.isExternal) allProtos.push(proto)
      }
    }
    for (const proto of (idx.sorted?.title?.prototypes || idx.prototypes || [])) {
      if (!proto.isExternal) allProtos.push(proto)
    }

    for (const proto of allProtos) {
      if (proto.hideFlows && proto.flows.length === 1) {
        groups.push({
          label: proto.name,
          items: [{ name: proto.name, route: proto.flows[0].route }],
        })
      } else if (proto.flows.length > 0) {
        groups.push({
          label: proto.name,
          items: proto.flows.map((f) => ({
            name: f.meta?.title || formatName(f.name),
            route: f.route,
          })),
        })
      } else {
        groups.push({
          label: proto.name,
          items: [{ name: proto.name, route: `/${proto.dirName}` }],
        })
      }
    }

    // Global flows
    const gf = idx.globalFlows || []
    if (gf.length > 0) {
      groups.push({
        label: 'Other flows',
        items: gf.map((f) => ({
          name: f.meta?.title || formatName(f.name),
          route: f.route,
        })),
      })
    }

    return groups
  }, [prototypeIndex])

  // Filter groups by search text
  const filteredGroups = useMemo(() => {
    if (!filter) return pickerGroups
    const q = filter.toLowerCase()
    return pickerGroups
      .map((group) => {
        const labelMatch = group.label.toLowerCase().includes(q)
        if (labelMatch) return group
        const matchedItems = group.items.filter((item) =>
          item.name.toLowerCase().includes(q) || item.route.toLowerCase().includes(q)
        )
        if (matchedItems.length === 0) return null
        return { ...group, items: matchedItems }
      })
      .filter(Boolean)
  }, [pickerGroups, filter])

  const hasPicker = pickerGroups.length > 0

  useEffect(() => {
    if (editing && hasPicker && filterRef.current) {
      filterRef.current.focus()
    } else if (editing && !hasPicker && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing, hasPicker])

  // Exit interactive mode when clicking outside the embed
  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (embedRef.current && !embedRef.current.contains(e.target)) {
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive])

  useEffect(() => {
    function readToolbarTheme() {
      setCanvasTheme(resolveCanvasThemeFromStorage())
    }
    readToolbarTheme()
    document.addEventListener('storyboard:theme:changed', readToolbarTheme)
    return () => document.removeEventListener('storyboard:theme:changed', readToolbarTheme)
  }, [])

  // Close expanded modal on Escape
  useEffect(() => {
    if (!expanded) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setExpanded(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [expanded])

  // Reparent iframe DOM node between inline container and modal.
  // Uses moveBefore() (Chrome 133+) which preserves the iframe's
  // browsing context — no reload. Falls back to appendChild which
  // will reload but still works functionally.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    if (expanded && modalContainerRef.current) {
      iframe._savedClassName = iframe.className
      iframe._savedStyle = iframe.getAttribute('style') || ''
      iframe.className = styles.expandIframe
      iframe.removeAttribute('style')
      const target = modalContainerRef.current
      if (target.moveBefore) {
        target.moveBefore(iframe, target.firstChild)
      } else {
        target.prepend(iframe)
      }
    } else if (!expanded && inlineContainerRef.current) {
      if (iframe._savedClassName !== undefined) {
        iframe.className = iframe._savedClassName
        iframe.setAttribute('style', iframe._savedStyle)
        delete iframe._savedClassName
        delete iframe._savedStyle
      }
      const target = inlineContainerRef.current
      if (target.moveBefore) {
        target.moveBefore(iframe, null)
      } else {
        target.appendChild(iframe)
      }
    }
  }, [expanded])

  // Listen for messages from the embedded prototype iframe
  useEffect(() => {
    function handleMessage(e) {
      if (!iframeRef.current?.contentWindow) return
      if (e.source !== iframeRef.current.contentWindow) return

      // Navigation events
      if (e.data?.type === 'storyboard:embed:navigate') {
        const newSrc = e.data.src
        if (newSrc && newSrc !== src) {
          const originalSrc = readProp(props, 'originalSrc', prototypeEmbedSchema)
          onUpdate?.({ src: newSrc, originalSrc: originalSrc || src })
        }
        return
      }

      // Snapshot capture responses
      if (e.data?.type === 'storyboard:embed:snapshot') {
        if (e.data.error) {
          console.warn('[canvas] Snapshot capture failed:', e.data.error)
          return
        }
        handleSnapshotResult(e.data.requestId, e.data.dataUrl)
        return
      }

      // Snapshot-ready signal — iframe content has fully rendered
      if (e.data?.type === 'storyboard:embed:snapshot-ready') {
        setIframeLoaded(true)
        if (onUpdate && !isExternal) requestSnapshotCapture()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [src, props, onUpdate, isExternal])

  // Request a snapshot capture from the iframe
  const requestSnapshotCapture = useCallback(() => {
    if (!iframeRef.current?.contentWindow || capturingRef.current || isExternal) return
    capturingRef.current = true
    const requestId = `snap-${Date.now()}`
    iframeRef.current.contentWindow.postMessage({
      type: 'storyboard:embed:capture',
      requestId,
    }, '*')
  }, [isExternal])

  // Handle a completed snapshot — upload and persist as widget prop
  const handleSnapshotResult = useCallback(async (requestId, dataUrl) => {
    if (!dataUrl || !onUpdate || !widgetId) return
    capturingRef.current = false
    try {
      const result = await uploadImage(dataUrl, `snapshot-${widgetId}`)
      if (!result?.success || !result?.filename) return
      const imageUrl = `/_storyboard/canvas/images/${result.filename}`
      const themeKey = canvasTheme?.startsWith('dark') ? 'snapshotDark' : 'snapshotLight'
      onUpdate?.({ [themeKey]: imageUrl })
    } catch (err) {
      console.warn('[canvas] Failed to upload snapshot:', err)
    }
  }, [onUpdate, canvasTheme, widgetId])

  // Re-capture snapshots after resize (debounced)
  const resizeCaptureTimer = useRef(null)
  const triggerResizeCapture = useCallback(() => {
    if (!onUpdate || isExternal) return
    clearTimeout(resizeCaptureTimer.current)
    resizeCaptureTimer.current = setTimeout(() => {
      requestSnapshotCapture()
    }, 2000)
  }, [requestSnapshotCapture, isExternal, onUpdate])

  // Re-capture when src changes (new prototype selected)
  const prevSrcRef = useRef(src)
  useEffect(() => {
    if (src && src !== prevSrcRef.current && onUpdate && !isExternal && showIframe) {
      prevSrcRef.current = src
      // Wait for the new page to render
      const timer = setTimeout(() => requestSnapshotCapture(), 4000)
      return () => clearTimeout(timer)
    }
    prevSrcRef.current = src
  }, [src, onUpdate, isExternal, showIframe, requestSnapshotCapture])

  // Re-capture for the alternate theme variant when theme changes
  const prevThemeRef = useRef(canvasTheme)
  useEffect(() => {
    if (canvasTheme !== prevThemeRef.current && onUpdate && !isExternal && showIframe) {
      prevThemeRef.current = canvasTheme
      const timer = setTimeout(() => requestSnapshotCapture(), 3000)
      return () => clearTimeout(timer)
    }
    prevThemeRef.current = canvasTheme
  }, [canvasTheme, onUpdate, isExternal, showIframe, requestSnapshotCapture])

  const chromeVars = useMemo(() => getEmbedChromeVars(canvasTheme), [canvasTheme])

  const enterInteractive = useCallback(() => setInteractive(true), [])

  // Expose imperative action handlers for WidgetChrome
  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'edit') {
        setEditing(true)
      } else if (actionId === 'expand') {
        setExpanded(true)
      } else if (actionId === 'open-external') {
        if (rawSrc) window.open(rawSrc, '_blank', 'noopener')
      }
    },
  }), [rawSrc])

  function handlePickRoute(route) {
    onUpdate?.({ src: route })
    setEditing(false)
    setFilter('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const value = inputRef.current?.value?.trim() || ''
    onUpdate?.({ src: value })
    setEditing(false)
    setFilter('')
  }

  function handleCancelEdit() {
    setEditing(false)
    setFilter('')
  }

  return (
    <>
    <WidgetWrapper>
      <div
        ref={embedRef}
        className={styles.embed}
        style={{ width, height, ...chromeVars }}
      >
        {editing ? (
          <div
            className={styles.pickerPanel}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {hasPicker && (
              <>
                <div className={styles.pickerHeader}>
                  <span className={styles.urlLabel}>Pick a prototype</span>
                  <button
                    type="button"
                    className={styles.urlCancel}
                    onClick={handleCancelEdit}
                    aria-label="Cancel"
                  >✕</button>
                </div>
                <input
                  ref={filterRef}
                  className={styles.filterInput}
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter…"
                  onKeyDown={(e) => { if (e.key === 'Escape') handleCancelEdit() }}
                />
                <div className={styles.pickerList} role="listbox">
                  {filteredGroups.map((group) => (
                    <div key={group.label} className={styles.pickerGroup}>
                      {group.items.length === 1 && group.items[0].name === group.label ? (
                        <button
                          className={styles.pickerItem}
                          role="option"
                          onClick={() => handlePickRoute(group.items[0].route)}
                        >
                          {group.label}
                        </button>
                      ) : (
                        <>
                          <div className={styles.pickerGroupLabel}>{group.label}</div>
                          {group.items.map((item) => (
                            <button
                              key={item.route}
                              className={styles.pickerItem}
                              role="option"
                              onClick={() => handlePickRoute(item.route)}
                            >
                              {item.name}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                  {filteredGroups.length === 0 && (
                    <div className={styles.pickerEmpty}>No matches</div>
                  )}
                </div>
                <div className={styles.pickerDivider} />
              </>
            )}
            <form className={styles.customUrlSection} onSubmit={handleSubmit}>
              <label className={styles.urlLabel}>
                {hasPicker ? 'Or enter a custom URL' : 'Prototype URL path'}
              </label>
              <input
                ref={inputRef}
                className={styles.urlInput}
                type="text"
                defaultValue={src}
                placeholder="/MyPrototype/page"
                onKeyDown={(e) => { if (e.key === 'Escape') handleCancelEdit() }}
              />
              <div className={styles.urlActions}>
                <button type="submit" className={styles.urlSave}>Save</button>
                {!hasPicker && (
                  <button type="button" className={styles.urlCancel} onClick={handleCancelEdit}>Cancel</button>
                )}
              </div>
            </form>
          </div>
        ) : iframeSrc ? (
          <>
            {/* Snapshot image — shown until iframe is fully loaded */}
            {hasSnapshot && !(showIframe && iframeLoaded) && (
              <div className={styles.iframeContainer}>
                <img
                  src={basePath + currentSnapshot}
                  alt={label || 'Prototype preview'}
                  className={styles.snapshotImage}
                  style={{ width, height }}
                  draggable={false}
                />
                {showIframe && !iframeLoaded && showSpinner && (
                  <div className={styles.snapshotSpinner}>
                    <div className={styles.spinner} />
                  </div>
                )}
              </div>
            )}

            {/* Iframe — preloaded on hover, revealed after load */}
            {(preloadIframe || showIframe) && (
              <div
                ref={inlineContainerRef}
                className={styles.iframeContainer}
                style={
                  expanded ? { visibility: 'hidden' }
                  : (hasSnapshot && !(showIframe && iframeLoaded)) ? { position: 'absolute', top: 0, left: 0, opacity: 0, pointerEvents: 'none' }
                  : undefined
                }
              >
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  className={styles.iframe}
                  style={{
                    width: width / scale,
                    height: height / scale,
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0',
                  }}
                  title={label || 'Prototype embed'}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </div>
            )}

            {!interactive && !expanded && (
              <div
                className={overlayStyles.interactOverlay}
                onPointerEnter={() => {
                  if (!preloadIframe) setPreloadIframe(true)
                }}
                onClick={(e) => {
                  if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
                  activateIframe()
                  enterInteractive()
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    activateIframe()
                    enterInteractive()
                  }
                }}
                aria-label="Click to interact with prototype"
              >
                <span className={overlayStyles.interactHint}>Click to interact</span>
              </div>
            )}
          </>
        ) : (
          <div
            className={styles.empty}
            onDoubleClick={() => setEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true) }}
          >
            <p>Double-click to set prototype URL</p>
          </div>
        )}
      </div>
      {resizable && (
        <div
          className={styles.resizeHandle}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            const startX = e.clientX
            const startY = e.clientY
            const startW = width
            const startH = height
            function onMove(ev) {
              const newW = Math.max(200, startW + ev.clientX - startX)
              const newH = Math.max(150, startH + ev.clientY - startY)
              onUpdate?.({ width: newW, height: newH })
            }
            function onUp() {
              document.removeEventListener('mousemove', onMove)
              document.removeEventListener('mouseup', onUp)
              triggerResizeCapture()
            }
            document.addEventListener('mousemove', onMove)
            document.addEventListener('mouseup', onUp)
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
    </WidgetWrapper>
    {createPortal(
      <div
        className={styles.expandBackdrop}
        style={expanded ? undefined : { display: 'none' }}
        onClick={() => setExpanded(false)}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') setExpanded(false)
        }}
        onWheel={(e) => e.stopPropagation()}
        tabIndex={-1}
        ref={(el) => { if (el && expanded) el.focus() }}
      >
        <div
          ref={modalContainerRef}
          className={styles.expandContainer}
          onClick={(e) => e.stopPropagation()}
        >
          {/* iframe is reparented here via useEffect */}
          <button
            className={styles.expandClose}
            onClick={() => setExpanded(false)}
            aria-label="Close expanded view"
            autoFocus
          >✕</button>
        </div>
      </div>,
      document.body
    )}
    </>
  )
})
