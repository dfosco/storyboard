/**
 * Viewfinder — prototype index and flow dashboard.
 *
 * Full-page component that lists prototypes as expandable groups,
 * each showing its flows. Global flows (not belonging to any prototype)
 * appear as an "Other flows" group.
 *
 * Mounted via mountViewfinder() from the viewfinder plugin entry point.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import './Viewfinder.css'
import { buildPrototypeIndex } from '../../viewfinder.js'
import { getLocal, setLocal } from '../../localStorage.js'
import { Icon } from './Icon.jsx'

const VIEW_MODE_KEY = 'viewfinder.viewMode'
const EXPANDED_KEY = 'viewfinder.expanded'

function loadExpanded() {
  const raw = getLocal(EXPANDED_KEY)
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function formatName(name) {
  return name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function placeholderSvg(name) {
  const h = (function hashStr(s) {
    let v = 0
    for (let i = 0; i < s.length; i++) v = ((v << 5) - v + s.charCodeAt(i)) | 0
    return Math.abs(v)
  })(name)

  let rects = ''
  for (let i = 0; i < 12; i++) {
    const s = h * (i + 1)
    const x = (s * 7 + i * 31) % 320
    const y = (s * 13 + i * 17) % 200
    const w = 20 + (s * (i + 3)) % 80
    const ht = 8 + (s * (i + 7)) % 40
    const opacity = 0.06 + ((s * (i + 2)) % 20) / 100
    const fill = i % 3 === 0 ? 'var(--sb--placeholder-accent)' : i % 3 === 1 ? 'var(--sb--placeholder-fg)' : 'var(--sb--placeholder-muted)'
    rects += `<rect x="${x}" y="${y}" width="${w}" height="${ht}" rx="2" fill="${fill}" opacity="${opacity}" />`
  }

  let lines = ''
  for (let i = 0; i < 6; i++) {
    const s = h * (i + 5)
    const y = 10 + (s % 180)
    lines += `<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="var(--sb--placeholder-grid)" stroke-width="0.5" opacity="0.4" />`
  }
  for (let i = 0; i < 8; i++) {
    const s = h * (i + 9)
    const x = 10 + (s % 300)
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="200" stroke="var(--sb--placeholder-grid)" stroke-width="0.5" opacity="0.3" />`
  }

  return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="320" height="200" fill="var(--sb--placeholder-bg)" />${lines}${rects}</svg>`
}

/* ── Author block ── */
function AuthorBlock({ author, gitAuthor }) {
  if (author) {
    const authors = Array.isArray(author) ? author : [author]
    return (
      <div className="author">
        <span className="authorAvatars">
          {authors.map((a) => (
            <img key={a} src={`https://github.com/${a}.png?size=48`} alt={a} className="authorAvatar" />
          ))}
        </span>
        <span className="authorName">{authors.join(', ')}</span>
      </div>
    )
  }
  if (gitAuthor) {
    return <p className="authorPlain">{gitAuthor}</p>
  }
  return null
}

/* ── Proto entry ── */
function ProtoEntry({ proto, isExpanded, toggle, withBase, showThumbnails }) {
  if (proto.isExternal) {
    return (
      <section className="protoGroup">
        <a className="listItem" href={proto.externalUrl} target="_blank" rel="noopener noreferrer">
          <div className="cardBody">
            <p className="protoName">
              {proto.icon && <span className="protoIcon">{proto.icon}</span>}
              {proto.name}
              <span className="externalBadge">
                <Icon size={12} color="var(--fgColor-muted)" name="primer/link-external" offsetY={-2} />
                external
              </span>
            </p>
            {proto.description && <p className="protoDesc">{proto.description}</p>}
            <AuthorBlock author={proto.author} gitAuthor={proto.gitAuthor} />
          </div>
        </a>
      </section>
    )
  }

  if (proto.hideFlows && proto.flows.length === 1) {
    return (
      <section className="protoGroup">
        <a className="listItem" href={withBase(proto.flows[0].route)}>
          <div className="cardBody">
            <p className={`protoName${proto.dirName === '__global__' ? ' otherflows' : ''}`}>
              {proto.icon && <span className="protoIcon">{proto.icon}</span>}
              {proto.name}
            </p>
            {proto.description && <p className="protoDesc">{proto.description}</p>}
            <AuthorBlock author={proto.author} gitAuthor={proto.gitAuthor} />
          </div>
        </a>
      </section>
    )
  }

  if (proto.flows.length > 0) {
    const expanded = isExpanded(proto.dirName)
    return (
      <section className="protoGroup">
        <button
          className="listItem protoHeader"
          onClick={() => toggle(proto.dirName)}
          aria-expanded={expanded}
        >
          <div className="cardBody">
            <p className={`protoName${proto.dirName === '__global__' ? ' otherflows' : ''}`}>
              {proto.icon && <span className="protoIcon">{proto.icon}</span>}
              {proto.name}
              <span className="protoChevron">
                {expanded
                  ? <Icon size={12} color="var(--fgColor-disabled)" name="primer/chevron-down" offsetY={-3} offsetX={2} />
                  : <Icon size={12} color="var(--fgColor-disabled)" name="primer/chevron-right" offsetY={-3} offsetX={2} />
                }
              </span>
            </p>
            {proto.description && <p className="protoDesc">{proto.description}</p>}
            <AuthorBlock author={proto.author} gitAuthor={proto.gitAuthor} />
          </div>
        </button>

        {!(proto.hideFlows && proto.flows.length === 1) && expanded && proto.flows.length > 0 && (
          <div className="flowList">
            {proto.flows.map((flow) => (
              <a key={flow.key} href={withBase(flow.route)} className="listItem flowItem">
                {showThumbnails && (
                  <div className="thumbnail" dangerouslySetInnerHTML={{ __html: placeholderSvg(flow.key) }} />
                )}
                <div className="cardBody">
                  <p className="protoName">{flow.meta?.title || formatName(flow.name)}</p>
                  {flow.meta?.description && <p className="flowDesc">{flow.meta.description}</p>}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    )
  }

  // Prototype with no flows — navigates directly
  return (
    <section className="protoGroup">
      <a className="listItem" href={withBase(`/${proto.dirName}`)}>
        <div className="cardBody">
          <p className={`protoName${proto.dirName === '__global__' ? ' otherflows' : ''}`}>
            {proto.icon && <span className="protoIcon">{proto.icon}</span>}
            {proto.name}
          </p>
          {proto.description && <p className="protoDesc">{proto.description}</p>}
          <AuthorBlock author={proto.author} gitAuthor={proto.gitAuthor} />
        </div>
      </a>
    </section>
  )
}

/* ── Canvas entry ── */
function CanvasEntry({ canvas, withBase }) {
  const authors = canvas.author
    ? (Array.isArray(canvas.author) ? canvas.author : [canvas.author])
    : null

  return (
    <section className="protoGroup">
      <a className="listItem" href={withBase(canvas.route)}>
        <div className="cardBody">
          <p className="protoName">
            <span className="protoIcon">{canvas.icon || ''}</span>
            {canvas.name}
          </p>
          {canvas.description && <p className="protoDesc">{canvas.description}</p>}
          {authors ? (
            <div className="author">
              <span className="authorAvatars">
                {authors.map((a) => (
                  <img key={a} src={`https://github.com/${a}.png?size=48`} alt={a} className="authorAvatar" />
                ))}
              </span>
              <span className="authorName">{authors.join(', ')}</span>
            </div>
          ) : canvas.gitAuthor ? (
            <p className="authorPlain">{canvas.gitAuthor}</p>
          ) : null}
        </div>
      </a>
    </section>
  )
}

/* ── Folder section ── */
function FolderSection({ folder, isExpanded, toggle, renderItems, itemKey = 'prototypes' }) {
  const key = `folder:${folder.dirName}`
  const expanded = isExpanded(key)
  const items = folder[itemKey] || []

  return (
    <section className={`folderGroup${expanded ? ' folderGroupOpen' : ''}`}>
      <button
        className="folderHeader"
        onClick={() => toggle(key)}
        aria-expanded={expanded}
      >
        <p className="folderName">
          <span>
            {expanded
              ? <Icon size={20} offsetY={-1.5} name="folder-open" color="#54aeff" />
              : <Icon size={20} offsetY={-1.5} name="folder" color="#54aeff" />
            }
          </span>
          {folder.name}
        </p>
        {folder.description && <p className="folderDesc">{folder.description}</p>}
      </button>
      {expanded && items.length > 0 && (
        <div className="folderContent">
          {renderItems(items)}
        </div>
      )}
    </section>
  )
}

/* ── Main Viewfinder component ── */
export function Viewfinder({
  title = 'Storyboard',
  subtitle = '',
  basePath = '/',
  knownRoutes = [],
  showThumbnails = false,
  hideDefaultFlow = false,
}) {
  const prototypeIndex = useMemo(() => buildPrototypeIndex(knownRoutes), [knownRoutes])

  const globalFlows = useMemo(() => {
    return hideDefaultFlow
      ? prototypeIndex.globalFlows.filter((f) => f.key !== 'default')
      : prototypeIndex.globalFlows
  }, [prototypeIndex, hideDefaultFlow])

  const ungroupedProtos = prototypeIndex.prototypes
  const folders = prototypeIndex.folders || []

  const otherFlows = useMemo(() => {
    if (globalFlows.length === 0) return null
    return {
      name: 'Other flows',
      dirName: '__global__',
      description: null,
      author: null,
      gitAuthor: null,
      lastModified: null,
      icon: null,
      team: null,
      tags: null,
      flows: globalFlows,
    }
  }, [globalFlows])

  const totalProtos = ungroupedProtos.length + folders.reduce((sum, f) => sum + f.prototypes.length, 0)

  // Sorting
  const [sortBy, setSortBy] = useState('updated')
  const sortedProtos = prototypeIndex.sorted?.[sortBy]?.prototypes ?? ungroupedProtos
  const sortedFolders = prototypeIndex.sorted?.[sortBy]?.folders ?? folders

  // Canvases
  const ungroupedCanvases = prototypeIndex.canvases || []
  const sortedCanvases = prototypeIndex.sorted?.[sortBy]?.canvases ?? ungroupedCanvases
  const totalCanvases = ungroupedCanvases.length + folders.reduce((sum, f) => sum + (f.canvases?.length || 0), 0)

  // View mode
  const [viewMode, setViewMode] = useState(() =>
    getLocal(VIEW_MODE_KEY) === 'canvases' ? 'canvases' : 'prototypes'
  )

  useEffect(() => {
    setLocal(VIEW_MODE_KEY, viewMode)
  }, [viewMode])

  // Canvas folders
  const canvasFolders = useMemo(() => {
    const src = prototypeIndex.sorted?.[sortBy]?.folders ?? folders
    return src
      .filter((f) => f.canvases && f.canvases.length > 0)
      .map((f) => ({ ...f, prototypes: [], canvases: f.canvases }))
  }, [prototypeIndex, sortBy, folders])

  // Proto-only folders
  const protoOnlyFolders = useMemo(() => {
    const src = prototypeIndex.sorted?.[sortBy]?.folders ?? folders
    return src
      .filter((f) => f.prototypes.length > 0)
      .map((f) => ({ ...f, canvases: [] }))
  }, [prototypeIndex, sortBy, folders])

  // Expanded state
  const [expanded, setExpanded] = useState(loadExpanded)

  const isExpandedFn = useCallback((dirName) => expanded[dirName] ?? false, [expanded])

  const toggleFn = useCallback((dirName) => {
    setExpanded((prev) => {
      const next = { ...prev, [dirName]: !(prev[dirName] ?? false) }
      setLocal(EXPANDED_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // URL helpers
  const withBase = useCallback((route) => {
    const normalizedRoute = route.startsWith('/') ? route : `/${route}`
    const normalizedBase = (basePath || '/').replace(/\/+$/, '')
    if (!normalizedBase || normalizedBase === '/') return normalizedRoute
    return `${normalizedBase}${normalizedRoute}`.replace(/\/+/g, '/')
  }, [basePath])

  // Branch switching
  const branches = (typeof window !== 'undefined' && Array.isArray(window.__SB_BRANCHES__))
    ? window.__SB_BRANCHES__
    : null

  const branchBasePath = (basePath || '/storyboard-source/').replace(/\/branch--[^/]*\/$/, '/')
  const currentBranch = useMemo(() => {
    const m = (basePath || '').match(/\/branch--([^/]+)\/?$/)
    return m ? m[1] : 'main'
  }, [basePath])

  function handleBranchChange(e) {
    const folder = e.target.value
    if (folder) {
      window.location.href = `${branchBasePath}${folder}/`
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="headerTop">
          <div>
            <h1 className="title">{title}</h1>
            {subtitle && <p className="subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="controlsRow">
          {/* View mode toggle */}
          <div className="sortToggle">
            <button
              className={`sortButton${viewMode === 'prototypes' ? ' sortButtonActive' : ''}`}
              onClick={() => setViewMode('prototypes')}
            >
              Prototypes
            </button>
            <button
              className={`sortButton${viewMode === 'canvases' ? ' sortButtonActive' : ''}`}
              onClick={() => setViewMode('canvases')}
            >
              Canvas
            </button>
          </div>
          {/* Sort toggle — hidden for now */}
          <div className="sortToggle" style={{ display: 'none' }}>
            <button
              className={`sortButton${sortBy === 'updated' ? ' sortButtonActive' : ''}`}
              onClick={() => setSortBy('updated')}
            >
              <Icon name="primer/clock" size={14} color="var(--fgColor-muted)" />
              Last updated
            </button>
            <button
              className={`sortButton${sortBy === 'title' ? ' sortButtonActive' : ''}`}
              onClick={() => setSortBy('title')}
            >
              <Icon name="primer/sort-asc" size={14} color="var(--fgColor-muted)" />
              Title A–Z
            </button>
          </div>
          {branches && branches.length > 0 && (
            <div className="branchDropdown">
              <span className="branchIcon">
                <Icon size={16} color="var(--fgColor-muted)" offsetY={-1} offsetX={2} name="primer/git-branch" />
              </span>
              <select
                className="branchSelect"
                onChange={handleBranchChange}
                aria-label="Switch branch"
                defaultValue=""
              >
                <option value="" disabled>{currentBranch}</option>
                {branches.map((b) => (
                  <option key={b.folder} value={b.folder}>{b.branch}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {viewMode === 'prototypes' && totalProtos === 0 && folders.length === 0 ? (
        <p className="empty">No flows found. Add a <code>*.flow.json</code> file to get started.</p>
      ) : viewMode === 'canvases' && totalCanvases === 0 ? (
        <p className="empty">No canvases found. Add a <code>*.canvas.jsonl</code> file to get started.</p>
      ) : (
        <div className="list">
          {viewMode === 'prototypes' ? (
            <>
              {protoOnlyFolders.map((folder) => (
                <FolderSection
                  key={folder.dirName}
                  folder={folder}
                  isExpanded={isExpandedFn}
                  toggle={toggleFn}
                  renderItems={(protos) =>
                    protos.map((proto) => (
                      <ProtoEntry
                        key={proto.dirName}
                        proto={proto}
                        isExpanded={isExpandedFn}
                        toggle={toggleFn}
                        withBase={withBase}
                        showThumbnails={showThumbnails}
                      />
                    ))
                  }
                />
              ))}

              {sortedProtos.map((proto) => (
                <ProtoEntry
                  key={proto.dirName}
                  proto={proto}
                  isExpanded={isExpandedFn}
                  toggle={toggleFn}
                  withBase={withBase}
                  showThumbnails={showThumbnails}
                />
              ))}

              {otherFlows && (
                <ProtoEntry
                  proto={otherFlows}
                  isExpanded={isExpandedFn}
                  toggle={toggleFn}
                  withBase={withBase}
                  showThumbnails={showThumbnails}
                />
              )}
            </>
          ) : (
            <>
              <div className="canvasWarning">
                <Icon size={14} name="primer/alert" color="#9a6700" offsetY={-1} />
                <span>Canvas is an experimental feature. Use with caution.</span>
              </div>
              {canvasFolders.map((folder) => (
                <FolderSection
                  key={folder.dirName}
                  folder={folder}
                  isExpanded={isExpandedFn}
                  toggle={toggleFn}
                  itemKey="canvases"
                  renderItems={(canvases) =>
                    canvases.map((canvas) => (
                      <CanvasEntry key={canvas.dirName} canvas={canvas} withBase={withBase} />
                    ))
                  }
                />
              ))}

              {sortedCanvases.map((canvas) => (
                <CanvasEntry key={canvas.dirName} canvas={canvas} withBase={withBase} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Viewfinder
