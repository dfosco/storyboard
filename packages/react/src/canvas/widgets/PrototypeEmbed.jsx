import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import { buildPrototypeIndex } from '@dfosco/storyboard-core'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, prototypeEmbedSchema } from './widgetProps.js'
import { getEmbedChromeVars, subscribeCanvasTheme } from './embedTheme.js'
import { useIframeDevLogs } from './iframeDevLogs.js'
import { useSnapshotCapture } from './useSnapshotCapture.js'
import { enqueueRefresh, cancelRefresh } from './refreshQueue.js'
import styles from './PrototypeEmbed.module.css'
import overlayStyles from './embedOverlay.module.css'

function CollageFrameIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M19.4 20H4.6C4.26863 20 4 19.7314 4 19.4V4.6C4 4.26863 4.26863 4 4.6 4H19.4C19.7314 4 20 4.26863 20 4.6V19.4C20 19.7314 19.7314 20 19.4 20Z" />
      <path d="M11 12V4" />
      <path d="M4 12H20" />
    </svg>
  )
}

function formatName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function listInternalPrototypes(index) {
  const allProtos = []
  const sortedFolders = index.sorted?.title?.folders
  const sortedPrototypes = index.sorted?.title?.prototypes
  const folderList = Array.isArray(sortedFolders) && sortedFolders.length > 0
    ? sortedFolders
    : (index.folders || [])
  const standaloneList = Array.isArray(sortedPrototypes) && sortedPrototypes.length > 0
    ? sortedPrototypes
    : (index.prototypes || [])

  for (const folder of folderList) {
    for (const proto of folder.prototypes || []) {
      if (!proto.isExternal) allProtos.push(proto)
    }
  }
  for (const proto of standaloneList) {
    if (!proto.isExternal) allProtos.push(proto)
  }
  return allProtos
}

function normalizeRoutePath(value, basePath = '') {
  if (!value || /^https?:\/\//.test(value)) return ''
  const noHash = value.split('#')[0]
  let route = noHash.split('?')[0]
  route = route.replace(/^\/branch--[^/]+/, '')
  if (basePath && route.startsWith(basePath)) {
    route = route.slice(basePath.length) || '/'
  }
  if (!route.startsWith('/')) route = `/${route}`
  route = route.replace(/\/+$/, '')
  return route || '/'
}

export default forwardRef(function PrototypeEmbed({ id: widgetId, props, onUpdate, resizable }, ref) {
  const src = readProp(props, 'src', prototypeEmbedSchema)
  const width = readProp(props, 'width', prototypeEmbedSchema)
  const height = readProp(props, 'height', prototypeEmbedSchema)
  const zoom = readProp(props, 'zoom', prototypeEmbedSchema)
  const label = readProp(props, 'label', prototypeEmbedSchema) || src
  const snapshot = props?.snapshot || props?.snapshotLight || props?.snapshotDark || ''

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

  const scale = zoom / 100

  const [editing, setEditing] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [showIframe, setShowIframe] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [filter, setFilter] = useState('')
  const [canvasTheme, setCanvasTheme] = useState('light')
  const [brokenSnaps, setBrokenSnaps] = useState({})

  const inputRef = useRef(null)
  const filterRef = useRef(null)
  const embedRef = useRef(null)
  const iframeRef = useRef(null)
  const captureOnReadyRef = useRef(false)
  const exitSessionRef = useRef(0)
  const teardownTimerRef = useRef(null)
  const inlineContainerRef = useRef(null)
  const modalContainerRef = useRef(null)
  const resizeTimerRef = useRef(null)
  const prevInteractiveRef = useRef(false)

  // Snapshot capture hook — only active in dev mode (onUpdate present)
  const isExternal = /^https?:\/\//.test(src || '')
  const { iframeReady, requestCapture } = useSnapshotCapture({
    iframeRef,
    widgetId,
    onUpdate: isExternal ? null : onUpdate,
  })

  // Single snapshot — backward compat reads snapshotLight/snapshotDark if snapshot is missing
  const hasSnap = !isExternal && !!(snapshot && snapshot.includes(widgetId) && !brokenSnaps[snapshot])

  const iframeSrc = useMemo(() => {
    if (!rawSrc) return ''
    // External URLs are embedded as-is — storyboard query params only apply to local prototypes
    if (/^https?:\/\//.test(rawSrc)) return rawSrc
    const hashIdx = rawSrc.indexOf('#')
    const base = hashIdx >= 0 ? rawSrc.slice(0, hashIdx) : rawSrc
    const hash = hashIdx >= 0 ? rawSrc.slice(hashIdx) : ''
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}_sb_embed&_sb_theme_target=prototype${hash}`
  }, [rawSrc])

  useIframeDevLogs({
    widget: 'PrototypeEmbed',
    loaded: showIframe && Boolean(iframeSrc),
    src: iframeSrc,
  })

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

    const allProtos = listInternalPrototypes(idx)

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

  const prototypeName = useMemo(() => {
    const currentRoute = normalizeRoutePath(src, basePath) || normalizeRoutePath(rawSrc, basePath)
    if (!currentRoute) return ''

    let bestMatchName = ''
    let bestMatchLength = -1

    for (const proto of listInternalPrototypes(prototypeIndex)) {
      const candidateRoutes = [
        `/${proto.dirName}`,
        ...(proto.flows || []).map((flow) => flow.route),
      ]
      for (const candidate of candidateRoutes) {
        const candidateRoute = normalizeRoutePath(candidate, basePath)
        if (!candidateRoute || candidateRoute === '/') continue
        if (currentRoute === candidateRoute || currentRoute.startsWith(`${candidateRoute}/`)) {
          if (candidateRoute.length > bestMatchLength) {
            bestMatchLength = candidateRoute.length
            bestMatchName = proto.name || ''
          }
        }
      }
    }

    return bestMatchName
  }, [prototypeIndex, src, rawSrc, basePath])

  const prototypeTitle = prototypeName || label || 'Prototype'

  const hasPicker = pickerGroups.length > 0

  useEffect(() => {
    if (editing && hasPicker && filterRef.current) {
      filterRef.current.focus()
    } else if (editing && !hasPicker && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing, hasPicker])

  useEffect(() => {
    if (!showIframe) setIframeLoaded(false)
  }, [showIframe])

  // Exit interactive mode when clicking outside the embed.
  // Hides iframe immediately for a responsive feel, then captures
  // snapshots in the background with the iframe hidden but still mounted.
  useEffect(() => {
    if (!interactive || expanded) return
    function handlePointerDown(e) {
      if (embedRef.current && !embedRef.current.contains(e.target)) {
        const chromeEl = e.target.closest(`[data-widget-id="${widgetId}"]`)
        if (chromeEl) return

        setInteractive(false)
        if (onUpdate && !isExternal && iframeLoaded && iframeRef.current?.contentWindow) {
          if (iframeRef.current) iframeRef.current.style.visibility = 'hidden'
          const session = ++exitSessionRef.current
          setTimeout(() => {
            if (exitSessionRef.current !== session) return
            requestCapture({ force: true }).then((updates) => {
              if (exitSessionRef.current !== session) return
              const snap = updates?.snapshot
              if (snap) {
                const img = new Image()
                const done = () => {
                  if (exitSessionRef.current === session) setShowIframe(false)
                }
                img.onload = done
                img.onerror = done
                img.src = snap
                setTimeout(done, 2000)
              } else {
                setShowIframe(false)
              }
            })
          }, 0)
        } else if (isExternal && showIframe) {
          // External embeds (e.g. Figma) are slow to reload — keep the
          // iframe mounted for 2 min so re-entering is instant.
          const session = ++exitSessionRef.current
          clearTimeout(teardownTimerRef.current)
          teardownTimerRef.current = setTimeout(() => {
            if (exitSessionRef.current !== session) return
            setShowIframe(false)
          }, 2 * 60 * 1000)
        } else {
          setShowIframe(false)
        }
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive, expanded, onUpdate, isExternal, iframeLoaded, requestCapture])

  useEffect(() => subscribeCanvasTheme({
    anchorRef: embedRef,
    onTheme: setCanvasTheme,
  }), [])

  // On canvas theme change, enqueue a background snapshot refresh.
  // Skips the initial render (canvasThemeInitRef tracks first value).
  const canvasThemeInitRef = useRef(true)
  const refreshResolveRef = useRef(null)
  useEffect(() => {
    if (canvasThemeInitRef.current) { canvasThemeInitRef.current = false; return }
    if (isExternal || !onUpdate || interactive) return
    enqueueRefresh(widgetId, () => {
      return new Promise((resolve) => {
        refreshResolveRef.current = resolve
        captureOnReadyRef.current = true
        setShowIframe(true)
        // Safety timeout — free queue slot even if capture stalls
        setTimeout(() => { refreshResolveRef.current = null; resolve() }, 10000)
      })
    })
  }, [canvasTheme]) // eslint-disable-line react-hooks/exhaustive-deps

  // Capture snapshot on first iframe ready (when no existing snapshot)
  useEffect(() => {
    if (!iframeReady || !onUpdate || isExternal) return
    if (!hasSnap) {
      requestCapture()
    }
  }, [iframeReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Capture when iframe becomes ready after refresh-thumbnail requested it
  useEffect(() => {
    if (iframeReady && captureOnReadyRef.current) {
      captureOnReadyRef.current = false
      requestCapture().then((updates) => {
        // If this was a queued refresh, preload then tear down iframe
        const resolve = refreshResolveRef.current
        if (resolve) {
          refreshResolveRef.current = null
          const snap = updates?.snapshot
          if (snap) {
            const img = new Image()
            const done = () => setShowIframe(false)
            img.onload = done
            img.onerror = done
            img.src = snap
            setTimeout(done, 2000)
          } else {
            setShowIframe(false)
          }
          resolve()
        }
      })
    }
  }, [iframeReady, requestCapture])

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(resizeTimerRef.current)
    clearTimeout(teardownTimerRef.current)
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
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [src, props, onUpdate])

  const chromeVars = useMemo(() => getEmbedChromeVars(canvasTheme), [canvasTheme])

  const enterInteractive = useCallback(() => {
    exitSessionRef.current++
    clearTimeout(teardownTimerRef.current)
    cancelRefresh(widgetId)
    setShowIframe(true)
    setInteractive(true)
  }, [widgetId])

  // Expose imperative action handlers for WidgetChrome
  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'edit') {
        setEditing(true)
      } else if (actionId === 'expand') {
        setShowIframe(true)
        setExpanded(true)
      } else if (actionId === 'open-external') {
        if (rawSrc) window.open(rawSrc, '_blank', 'noopener')
      } else if (actionId === 'refresh-thumbnail') {
        if (iframeReady && iframeRef.current?.contentWindow) {
          requestCapture()
        } else {
          captureOnReadyRef.current = true
          setShowIframe(true)
        }
      }
    },
  }), [rawSrc, iframeReady, requestCapture])

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
        <div className={styles.header}>
          <span className={styles.headerIcon}><CollageFrameIcon size={16} /></span>
          <span className={styles.headerTitle}>{prototypeTitle}</span>
        </div>
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
            <div
              ref={inlineContainerRef}
              className={styles.iframeContainer}
              style={expanded ? { visibility: 'hidden' } : undefined}
            >
              {/* Snapshot layer — single image */}
              {hasSnap && (
                <img
                  src={snapshot}
                  className={styles.snapshotImage}
                  alt={`${prototypeTitle} snapshot`}
                  draggable={false}
                  onError={() => setBrokenSnaps(prev => ({ ...prev, [snapshot]: true }))}
                />
              )}

              {/* Iframe layer — on top, transparent until loaded */}
              {showIframe && (
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  className={styles.iframe}
                  style={{
                    width: width / scale,
                    height: height / scale,
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0',
                    transition: 'opacity 150ms ease',
                    ...(iframeLoaded ? {} : { opacity: 0 }),
                  }}
                  onLoad={() => setIframeLoaded(true)}
                  title={`${prototypeTitle} prototype`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              )}

              {/* Placeholder — only when no snapshot and no iframe */}
              {!hasSnap && !showIframe && (
                <div className={styles.placeholder} />
              )}
            </div>

            {!interactive && !expanded && (
              <div
                className={overlayStyles.interactOverlay}
                onClick={(e) => {
                  if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
                  enterInteractive()
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    enterInteractive()
                  }
                }}
                aria-label={hasSnap ? 'Click to interact with prototype' : 'Click to open prototype'}
              >
                <span className={overlayStyles.interactHint}>{hasSnap ? 'Click to interact' : 'Click to open'}</span>
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
              // Recapture snapshot after resize (debounced)
              clearTimeout(resizeTimerRef.current)
              resizeTimerRef.current = setTimeout(() => requestCapture(), 1500)
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
