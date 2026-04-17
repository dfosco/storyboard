import { useState, useMemo, useCallback } from 'react'
import { buildPrototypeIndex, getLocal, setLocal } from '@dfosco/storyboard-core'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LinkExternalIcon,
  FileDirectoryFillIcon,
  FileDirectoryOpenFillIcon,
  GitBranchIcon,
  AlertIcon,
} from '@primer/octicons-react'
import styles from './Viewfinder.module.css'

// ── Storage keys (match Svelte implementation exactly) ──

const VIEW_MODE_KEY = 'viewfinder.viewMode'
const EXPANDED_KEY = 'viewfinder.expanded'

// ── Helpers ──

function withBase(basePath, route) {
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`
  const normalizedBase = (basePath || '/').replace(/\/+$/, '')
  if (!normalizedBase || normalizedBase === '/') return normalizedRoute
  return `${normalizedBase}${normalizedRoute}`.replace(/\/+/g, '/')
}

function protoRoute(basePath, dirName) {
  return withBase(basePath, `/${dirName}`)
}

function formatName(name) {
  return (name || '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function loadExpanded() {
  const raw = getLocal(EXPANDED_KEY)
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function placeholderSvg(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  h = Math.abs(h)

  let rects = ''
  for (let i = 0; i < 12; i++) {
    const s = h * (i + 1)
    const x = (s * 7 + i * 31) % 320
    const y = (s * 13 + i * 17) % 200
    const w = 20 + (s * (i + 3)) % 80
    const ht = 8 + (s * (i + 7)) % 40
    const opacity = 0.06 + ((s * (i + 2)) % 20) / 100
    const fill = i % 3 === 0
      ? 'var(--sb--placeholder-accent)'
      : i % 3 === 1
        ? 'var(--sb--placeholder-fg)'
        : 'var(--sb--placeholder-muted)'
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

// ── Sub-components ──

function AuthorDisplay({ author, gitAuthor }) {
  if (author) {
    const authors = Array.isArray(author) ? author : [author]
    return (
      <div className={styles.author}>
        <span className={styles.authorAvatars}>
          {authors.map(a => (
            <img
              key={a}
              src={`https://github.com/${a}.png?size=48`}
              alt={a}
              className={styles.authorAvatar}
            />
          ))}
        </span>
        <span className={styles.authorName}>{authors.join(', ')}</span>
      </div>
    )
  }
  if (gitAuthor) {
    return <p className={styles.authorPlain}>{gitAuthor}</p>
  }
  return null
}

function ProtoEntry({ proto, basePath, showThumbnails, expanded, onToggle }) {
  const isOpen = expanded[proto.dirName] ?? false

  // External prototype — opens in new tab
  if (proto.isExternal) {
    return (
      <section className={styles.protoGroup}>
        <a className={styles.listItem} href={proto.externalUrl} target="_blank" rel="noopener noreferrer">
          <div className={styles.cardBody}>
            <p className={styles.protoName}>
              {proto.icon && <span className={styles.protoIcon}>{proto.icon}</span>}
              {proto.name}
              <span className={styles.externalBadge}>
                <LinkExternalIcon size={12} />
                external
              </span>
            </p>
            {proto.description && <p className={styles.protoDesc}>{proto.description}</p>}
            <AuthorDisplay author={proto.author} gitAuthor={proto.gitAuthor} />
          </div>
        </a>
      </section>
    )
  }

  // Single flow, hidden — navigates directly to the flow
  if (proto.hideFlows && proto.flows?.length === 1) {
    return (
      <section className={styles.protoGroup}>
        <a className={styles.listItem} href={withBase(basePath, proto.flows[0].route)}>
          <div className={styles.cardBody}>
            <p className={`${styles.protoName}${proto.dirName === '__global__' ? ` ${styles.otherflows}` : ''}`}>
              {proto.icon && <span className={styles.protoIcon}>{proto.icon}</span>}
              {proto.name}
            </p>
            {proto.description && <p className={styles.protoDesc}>{proto.description}</p>}
            <AuthorDisplay author={proto.author} gitAuthor={proto.gitAuthor} />
          </div>
        </a>
      </section>
    )
  }

  // Expandable prototype with flows
  if (proto.flows?.length > 0) {
    return (
      <section className={styles.protoGroup}>
        <button
          className={`${styles.listItem} ${styles.protoHeader}`}
          onClick={() => onToggle(proto.dirName)}
          aria-expanded={isOpen}
        >
          <div className={styles.cardBody}>
            <p className={`${styles.protoName}${proto.dirName === '__global__' ? ` ${styles.otherflows}` : ''}`}>
              {proto.icon && <span className={styles.protoIcon}>{proto.icon}</span>}
              {proto.name}
              <span className={styles.protoChevron}>
                {isOpen
                  ? <ChevronDownIcon size={12} />
                  : <ChevronRightIcon size={12} />
                }
              </span>
            </p>
            {proto.description && <p className={styles.protoDesc}>{proto.description}</p>}
            <AuthorDisplay author={proto.author} gitAuthor={proto.gitAuthor} />
          </div>
        </button>

        {isOpen && (
          <div className={styles.flowList}>
            {proto.flows.map(flow => (
              <a key={flow.key} href={withBase(basePath, flow.route)} className={`${styles.listItem} ${styles.flowItem}`}>
                {showThumbnails && (
                  <div className={styles.thumbnail} dangerouslySetInnerHTML={{ __html: placeholderSvg(flow.key) }} />
                )}
                <div className={styles.cardBody}>
                  <p className={styles.protoName}>{flow.meta?.title || formatName(flow.name)}</p>
                  {flow.meta?.description && <p className={styles.flowDesc}>{flow.meta.description}</p>}
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
    <section className={styles.protoGroup}>
      <a className={styles.listItem} href={protoRoute(basePath, proto.dirName)}>
        <div className={styles.cardBody}>
          <p className={`${styles.protoName}${proto.dirName === '__global__' ? ` ${styles.otherflows}` : ''}`}>
            {proto.icon && <span className={styles.protoIcon}>{proto.icon}</span>}
            {proto.name}
          </p>
          {proto.description && <p className={styles.protoDesc}>{proto.description}</p>}
          <AuthorDisplay author={proto.author} gitAuthor={proto.gitAuthor} />
        </div>
      </a>
    </section>
  )
}

function CanvasEntry({ canvas, basePath }) {
  return (
    <section className={styles.protoGroup}>
      <a className={styles.listItem} href={withBase(basePath, canvas.route)}>
        <div className={styles.cardBody}>
          <p className={styles.protoName}>
            <span className={styles.protoIcon}>{canvas.icon || ''}</span>
            {canvas.name}
          </p>
          {canvas.description && <p className={styles.protoDesc}>{canvas.description}</p>}
          <AuthorDisplay author={canvas.author} gitAuthor={canvas.gitAuthor} />
        </div>
      </a>
    </section>
  )
}

function FolderSection({ folder, basePath, showThumbnails, expanded, onToggle, renderEntry }) {
  const folderKey = `folder:${folder.dirName}`
  const isOpen = expanded[folderKey] ?? false

  const items = renderEntry === 'canvas' ? (folder.canvases || []) : folder.prototypes

  return (
    <section className={`${styles.folderGroup}${isOpen ? ` ${styles.folderGroupOpen}` : ''}`}>
      <button
        className={styles.folderHeader}
        onClick={() => onToggle(folderKey)}
        aria-expanded={isOpen}
      >
        <p className={styles.folderName}>
          <span>
            {isOpen
              ? <FileDirectoryOpenFillIcon size={20} fill="#54aeff" />
              : <FileDirectoryFillIcon size={20} fill="#54aeff" />
            }
          </span>
          {folder.name}
        </p>
        {folder.description && <p className={styles.folderDesc}>{folder.description}</p>}
      </button>

      {isOpen && items.length > 0 && (
        <div className={styles.folderContent}>
          {renderEntry === 'canvas'
            ? items.map(canvas => (
                <CanvasEntry key={canvas.dirName} canvas={canvas} basePath={basePath} />
              ))
            : items.map(proto => (
                <ProtoEntry
                  key={proto.dirName}
                  proto={proto}
                  basePath={basePath}
                  showThumbnails={showThumbnails}
                  expanded={expanded}
                  onToggle={onToggle}
                />
              ))
          }
        </div>
      )}
    </section>
  )
}

// ── Main component ──

/**
 * Viewfinder — prototype index and dashboard.
 *
 * Lists prototypes as expandable groups, each showing its flows.
 * Supports folder grouping, canvas view, external prototypes, and branch switching.
 *
 * @param {Object} props
 * @param {Record<string, unknown>} [props.pageModules] - import.meta.glob result for page files
 * @param {string} [props.basePath] - Base URL path
 * @param {string} [props.title] - Header title
 * @param {string} [props.subtitle] - Optional subtitle
 * @param {boolean} [props.showThumbnails] - Show thumbnail previews
 * @param {boolean} [props.hideDefaultFlow] - Hide the "default" flow from the "Other flows" section
 * @param {boolean} [props.hideDefaultScene] - Deprecated alias for hideDefaultFlow
 */
export default function Viewfinder({
  pageModules = {},
  basePath,
  title = 'Storyboard',
  subtitle,
  showThumbnails = false,
  hideDefaultFlow,
  hideDefaultScene = false,
}) {
  const shouldHideDefault = hideDefaultFlow ?? hideDefaultScene

  const knownRoutes = useMemo(() =>
    Object.keys(pageModules)
      .map(p => p.replace('/src/prototypes/', '').replace('.jsx', ''))
      .filter(n => !n.startsWith('_') && n !== 'index' && n !== 'viewfinder'),
    [pageModules],
  )

  const prototypeIndex = useMemo(() => buildPrototypeIndex(knownRoutes), [knownRoutes])

  // ── View mode (prototypes / canvases) — persisted ──
  const [viewMode, setViewMode] = useState(() =>
    getLocal(VIEW_MODE_KEY) === 'canvases' ? 'canvases' : 'prototypes',
  )
  const handleViewMode = useCallback((mode) => {
    setViewMode(mode)
    setLocal(VIEW_MODE_KEY, mode)
  }, [])

  // ── Sort mode ──
  const [sortBy] = useState('updated')

  // ── Expanded state — persisted ──
  const [expanded, setExpanded] = useState(loadExpanded)
  const handleToggle = useCallback((key) => {
    setExpanded(prev => {
      const next = { ...prev, [key]: !prev[key] }
      setLocal(EXPANDED_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // ── Derived data ──
  const globalFlows = useMemo(() =>
    shouldHideDefault
      ? prototypeIndex.globalFlows.filter(f => f.key !== 'default')
      : prototypeIndex.globalFlows,
    [prototypeIndex, shouldHideDefault],
  )

  const sortedProtos = prototypeIndex.sorted?.[sortBy]?.prototypes ?? prototypeIndex.prototypes
  const sortedCanvases = prototypeIndex.sorted?.[sortBy]?.canvases ?? (prototypeIndex.canvases || [])

  const protoOnlyFolders = useMemo(() => {
    const src = prototypeIndex.sorted?.[sortBy]?.folders ?? (prototypeIndex.folders || [])
    return src
      .filter(f => f.prototypes.length > 0)
      .map(f => ({ ...f, canvases: [] }))
  }, [prototypeIndex, sortBy])

  const canvasFolders = useMemo(() => {
    const src = prototypeIndex.sorted?.[sortBy]?.folders ?? (prototypeIndex.folders || [])
    return src
      .filter(f => f.canvases && f.canvases.length > 0)
      .map(f => ({ ...f, prototypes: [], canvases: f.canvases }))
  }, [prototypeIndex, sortBy])

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

  const totalProtos = (prototypeIndex.prototypes?.length || 0) +
    (prototypeIndex.folders || []).reduce((sum, f) => sum + f.prototypes.length, 0)

  const totalCanvases = (prototypeIndex.canvases?.length || 0) +
    (prototypeIndex.folders || []).reduce((sum, f) => sum + (f.canvases?.length || 0), 0)

  // ── Branch switching ──
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

  // ── Empty states ──
  const showProtosEmpty = viewMode === 'prototypes' && totalProtos === 0 && (prototypeIndex.folders || []).length === 0
  const showCanvasEmpty = viewMode === 'canvases' && totalCanvases === 0

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        <div className={styles.controlsRow}>
          {/* View mode toggle */}
          <div className={styles.sortToggle}>
            <button
              className={`${styles.sortButton}${viewMode === 'prototypes' ? ` ${styles.sortButtonActive}` : ''}`}
              onClick={() => handleViewMode('prototypes')}
            >
              Prototypes
            </button>
            <button
              className={`${styles.sortButton}${viewMode === 'canvases' ? ` ${styles.sortButtonActive}` : ''}`}
              onClick={() => handleViewMode('canvases')}
            >
              Canvas
            </button>
          </div>

          {/* Branch dropdown */}
          {branches && branches.length > 0 && (
            <div className={styles.branchDropdown}>
              <span className={styles.branchIcon}>
                <GitBranchIcon size={16} />
              </span>
              <select
                className={styles.branchSelect}
                onChange={handleBranchChange}
                aria-label="Switch branch"
                defaultValue=""
              >
                <option value="" disabled>{currentBranch}</option>
                {branches.map(b => (
                  <option key={b.folder} value={b.folder}>{b.branch}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {showProtosEmpty && (
        <p className={styles.empty}>No flows found. Add a <code>*.flow.json</code> file to get started.</p>
      )}

      {showCanvasEmpty && (
        <p className={styles.empty}>No canvases found. Add a <code>*.canvas.jsonl</code> file to get started.</p>
      )}

      {!showProtosEmpty && !showCanvasEmpty && (
        <div className={styles.list}>
          {viewMode === 'prototypes' ? (
            <>
              {/* Folders containing prototypes */}
              {protoOnlyFolders.map(folder => (
                <FolderSection
                  key={folder.dirName}
                  folder={folder}
                  basePath={basePath}
                  showThumbnails={showThumbnails}
                  expanded={expanded}
                  onToggle={handleToggle}
                  renderEntry="proto"
                />
              ))}

              {/* Ungrouped prototypes */}
              {sortedProtos.map(proto => (
                <ProtoEntry
                  key={proto.dirName}
                  proto={proto}
                  basePath={basePath}
                  showThumbnails={showThumbnails}
                  expanded={expanded}
                  onToggle={handleToggle}
                />
              ))}

              {/* Other flows (always at the bottom) */}
              {otherFlows && (
                <ProtoEntry
                  proto={otherFlows}
                  basePath={basePath}
                  showThumbnails={showThumbnails}
                  expanded={expanded}
                  onToggle={handleToggle}
                />
              )}
            </>
          ) : (
            <>
              {/* Canvas warning */}
              <div className={styles.canvasWarning}>
                <AlertIcon size={14} fill="#9a6700" />
                <span>Canvas is an experimental feature. Use with caution.</span>
              </div>

              {/* Canvas folders */}
              {canvasFolders.map(folder => (
                <FolderSection
                  key={folder.dirName}
                  folder={folder}
                  basePath={basePath}
                  showThumbnails={showThumbnails}
                  expanded={expanded}
                  onToggle={handleToggle}
                  renderEntry="canvas"
                />
              ))}

              {/* Ungrouped canvases */}
              {sortedCanvases.map(canvas => (
                <CanvasEntry key={canvas.dirName} canvas={canvas} basePath={basePath} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

