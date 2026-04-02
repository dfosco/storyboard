import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { buildPrototypeIndex } from '@dfosco/storyboard-core'
import WidgetWrapper from './WidgetWrapper.jsx'
import { readProp, prototypeEmbedSchema } from './widgetProps.js'
import { getEmbedChromeVars } from './embedTheme.js'
import styles from './PrototypeEmbed.module.css'

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

export default function PrototypeEmbed({ props, onUpdate }) {
  const src = readProp(props, 'src', prototypeEmbedSchema)
  const width = readProp(props, 'width', prototypeEmbedSchema)
  const height = readProp(props, 'height', prototypeEmbedSchema)
  const zoom = readProp(props, 'zoom', prototypeEmbedSchema)
  const label = readProp(props, 'label', prototypeEmbedSchema) || src

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const rawSrc = src ? `${basePath}${src}` : ''

  const scale = zoom / 100

  const [editing, setEditing] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [filter, setFilter] = useState('')
  const [canvasTheme, setCanvasTheme] = useState(() => resolveCanvasThemeFromStorage())
  const inputRef = useRef(null)
  const filterRef = useRef(null)
  const embedRef = useRef(null)

  const iframeSrc = rawSrc
    ? `${rawSrc}${rawSrc.includes('?') ? '&' : '?'}_sb_embed&_sb_theme_target=prototype&_sb_canvas_theme=${canvasTheme}`
    : ''

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

  const chromeVars = useMemo(() => getEmbedChromeVars(canvasTheme), [canvasTheme])

  const enterInteractive = useCallback(() => setInteractive(true), [])

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
            <div className={styles.iframeContainer}>
              <iframe
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
            {!interactive && (
              <div
                className={styles.dragOverlay}
                onDoubleClick={enterInteractive}
              />
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
        {iframeSrc && !editing && (
          <button
            className={styles.editBtn}
            onClick={(e) => { e.stopPropagation(); setEditing(true) }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            title="Edit URL"
            aria-label="Edit prototype URL"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"/></svg>
          </button>
        )}
        {iframeSrc && !editing && (
          <div
            className={styles.zoomBar}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              className={styles.zoomBtn}
              onClick={() => {
                const step = zoom <= 75 ? 5 : 25
                onUpdate?.({ zoom: Math.max(25, zoom - step) })
              }}
              disabled={zoom <= 25}
              aria-label="Zoom out"
            >−</button>
            <span className={styles.zoomLabel}>{zoom}%</span>
            <button
              className={styles.zoomBtn}
              onClick={() => {
                const step = zoom < 75 ? 5 : 25
                onUpdate?.({ zoom: Math.min(200, zoom + step) })
              }}
              disabled={zoom >= 200}
              aria-label="Zoom in"
            >+</button>
          </div>
        )}
      </div>
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
          }
          document.addEventListener('mousemove', onMove)
          document.addEventListener('mouseup', onUp)
        }}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </WidgetWrapper>
  )
}
