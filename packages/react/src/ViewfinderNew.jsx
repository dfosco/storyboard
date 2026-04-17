/**
 * ViewfinderNew — SaaS-style homescreen for Storyboard.
 *
 * Replaces the old list-based Viewfinder with a sidebar + grid layout.
 * Wired to real data from buildPrototypeIndex and listStories.
 */
import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { buildPrototypeIndex, listStories, getStoryData, getLocal, setLocal } from '@dfosco/storyboard-core'
import Icon from './Icon.jsx'
import css from './ViewfinderNew.module.css'

/* ─── localStorage helpers ─── */

const STARRED_KEY = 'sb-viewfinder-starred'
const RECENT_KEY = 'sb-viewfinder-recent'
const MAX_RECENT = 30

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback }
  catch { return fallback }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new StorageEvent('storage', { key }))
}

function createLocalStorageStore(key, fallback) {
  const subscribe = (cb) => {
    const handler = (e) => { if (!e.key || e.key === key) cb() }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }
  const getSnapshot = () => localStorage.getItem(key) || JSON.stringify(fallback)
  return { subscribe, getSnapshot }
}

const starredStore = createLocalStorageStore(STARRED_KEY, [])
const recentStore = createLocalStorageStore(RECENT_KEY, [])

function useStarred() {
  const raw = useSyncExternalStore(starredStore.subscribe, starredStore.getSnapshot)
  const ids = JSON.parse(raw)
  const toggle = useCallback((id) => {
    const current = readJSON(STARRED_KEY, [])
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    writeJSON(STARRED_KEY, next)
  }, [])
  return { starred: new Set(ids), toggle }
}

function useRecent() {
  const raw = useSyncExternalStore(recentStore.subscribe, recentStore.getSnapshot)
  return JSON.parse(raw)
}

function trackRecent(id) {
  const current = readJSON(RECENT_KEY, [])
  const next = [id, ...current.filter(x => x !== id)].slice(0, MAX_RECENT)
  writeJSON(RECENT_KEY, next)
}

/* ─── URL helpers ─── */

function withBase(basePath, route) {
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`
  const normalizedBase = (basePath || '/').replace(/\/+$/, '')
  if (!normalizedBase || normalizedBase === '/') return normalizedRoute
  return `${normalizedBase}${normalizedRoute}`.replace(/\/+/g, '/')
}

/* ─── Thumbnail color from name hash ─── */

const THUMB_CLASSES = ['thumbBlue', 'thumbAmber', 'thumbGreen', 'thumbPurple', 'thumbRose', 'thumbSlate']

function thumbClass(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  return css[THUMB_CLASSES[Math.abs(h) % THUMB_CLASSES.length]]
}

/* ─── Type helpers ─── */

function getTypeLabel(type) {
  if (type === 'prototype') return 'PROTOTYPE'
  if (type === 'canvas') return 'CANVAS'
  if (type === 'component') return 'COMPONENT'
  return type?.toUpperCase() || ''
}

function getTypeIcon(type, size = 14) {
  if (type === 'prototype') return <Icon name="prototype" size={size} />
  if (type === 'canvas') return <Icon name="canvas" size={size} />
  if (type === 'component') return <Icon name="component" size={size} />
  return null
}

/* ─── Star Button ─── */

function StarBtn({ active, onClick }) {
  return (
    <button
      className={active ? css.starBtnActive : css.starBtn}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}
      aria-label={active ? 'Unstar' : 'Star'}
    >
      {active ? '★' : '☆'}
    </button>
  )
}

/* ─── Artifact Card ─── */

function ArtifactCard({ item, basePath, starred, onToggleStar }) {
  const href = item.route ? withBase(basePath, item.route) : '#'
  const isExternal = item.isExternal

  const handleClick = () => {
    trackRecent(item.id)
  }

  const Tag = isExternal ? 'a' : 'a'
  const linkProps = isExternal
    ? { href: item.externalUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { href }

  return (
    <Tag className={css.card} {...linkProps} onClick={handleClick}>
      <div className={`${css.cardThumb} ${thumbClass(item.name)}`}>
        <span className={css.cardBadge}>{getTypeLabel(item.type)}</span>
        <StarBtn active={starred} onClick={() => onToggleStar(item.id)} />
      </div>
      <div className={css.cardBody}>
        <div className={css.cardTitle}>
          {item.name}
          {isExternal && <span className={css.externalBadge}>↗</span>}
        </div>
        <div className={css.cardMeta}>
          {item.author && <span>{Array.isArray(item.author) ? item.author.join(', ') : item.author}</span>}
          {!item.author && item.gitAuthor && <span>{item.gitAuthor}</span>}
          {(item.author || item.gitAuthor) && formatRelativeTime(item.lastModified) && <span className={css.cardMetaDot} />}
          {formatRelativeTime(item.lastModified) && <span>{formatRelativeTime(item.lastModified)}</span>}
        </div>
      </div>
    </Tag>
  )
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const now = Date.now()
  const diff = now - date.getTime()
  if (diff < 0) return ''
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return date.toLocaleDateString()
}

/* ─── Create Menu ─── */

function CreateMenu({ onClose }) {
  const items = [
    { icon: <Icon name="canvas" size={18} />, title: 'Canvas', desc: 'Interactive board for prototypes, components, and documents' },
    { icon: <Icon name="prototype" size={18} />, title: 'Prototype', desc: 'Interactive page flow' },
    { icon: <Icon name="component" size={18} />, title: 'Component', desc: 'Reusable component' },
  ]

  return (
    <div className={css.createMenuOverlay} onClick={onClose}>
      <div className={css.createMenu} onClick={e => e.stopPropagation()}>
        <div className={css.createMenuTitle}>Create new</div>
        <div className={css.createMenuGrid}>
          {items.map(it => (
            <button key={it.title} className={css.createMenuItem} onClick={onClose}>
              <div className={css.createMenuIcon}>{it.icon}</div>
              <div>
                <div className={css.createMenuItemTitle}>{it.title}</div>
                <div className={css.createMenuItemDesc}>{it.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── PAT Dialog ─── */

function PATDialog({ open, onClose }) {
  if (!open) return null
  return (
    <div className={css.createMenuOverlay} onClick={onClose}>
      <div className={css.dialog} onClick={e => e.stopPropagation()}>
        <div className={css.dialogTitle}>Sign in with GitHub</div>
        <div className={css.dialogDesc}>
          Enter a Personal Access Token to sync prototypes and enable collaboration.
        </div>
        <input
          className={css.dialogInput}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          type="password"
          autoFocus
        />
        <div className={css.dialogActions}>
          <button className={css.btnSecondary} onClick={onClose}>Cancel</button>
          <button className={css.btnPrimary} onClick={onClose}>Connect</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Nav config ─── */

const NAV_ITEMS = [
  { id: 'all', label: 'All items', iconName: 'iconoir/key-command' },
  { id: 'prototypes', label: 'Prototypes', iconName: 'prototype' },
  { id: 'canvases', label: 'Canvas', iconName: 'canvas' },
  { id: 'components', label: 'Components', iconName: 'component' },
]

const TAB_FILTERS = ['All', 'Recent', 'Starred']

/* ─── Main Component ─── */

export default function ViewfinderNew({
  pageModules = {},
  basePath,
  title = 'Storyboard',
  subtitle,
  hideDefaultFlow,
  hideDefaultScene = false,
}) {
  const shouldHideDefault = hideDefaultFlow ?? hideDefaultScene

  // Build data index from real prototype/canvas/story data
  const knownRoutes = useMemo(() =>
    Object.keys(pageModules)
      .map(p => p.replace('/src/prototypes/', '').replace('.jsx', ''))
      .filter(n => !n.startsWith('_') && n !== 'index' && n !== 'viewfinder'),
    [pageModules],
  )

  const prototypeIndex = useMemo(() => buildPrototypeIndex(knownRoutes), [knownRoutes])

  // Build unified items list from all sources
  const allItems = useMemo(() => {
    const items = []

    // Prototypes (ungrouped + from folders)
    const addProto = (proto) => {
      // For prototypes with flows, use the first flow's route
      const route = proto.flows?.length > 0
        ? proto.flows[0].route
        : `/${proto.dirName}`

      items.push({
        id: `proto:${proto.dirName}`,
        name: proto.name,
        type: 'prototype',
        author: proto.author,
        gitAuthor: proto.gitAuthor,
        lastModified: proto.lastModified,
        route,
        isExternal: proto.isExternal,
        externalUrl: proto.externalUrl,
        folder: proto.folder,
        description: proto.description,
      })
    }

    for (const proto of prototypeIndex.prototypes || []) addProto(proto)
    for (const folder of prototypeIndex.folders || []) {
      for (const proto of folder.prototypes || []) addProto(proto)
    }

    // Canvases (ungrouped + from folders)
    const addCanvas = (canvas) => {
      items.push({
        id: `canvas:${canvas.dirName}`,
        name: canvas.name,
        type: 'canvas',
        author: canvas.author,
        gitAuthor: canvas.gitAuthor,
        lastModified: null,
        route: canvas.route,
        isExternal: false,
        externalUrl: null,
        folder: canvas.folder,
        description: canvas.description,
      })
    }

    for (const canvas of prototypeIndex.canvases || []) addCanvas(canvas)
    for (const folder of prototypeIndex.folders || []) {
      for (const canvas of folder.canvases || []) addCanvas(canvas)
    }

    // Components (stories)
    const storyNames = listStories()
    for (const name of storyNames) {
      const data = getStoryData(name)
      if (!data) continue
      items.push({
        id: `component:${name}`,
        name: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        type: 'component',
        author: null,
        gitAuthor: null,
        lastModified: null,
        route: data._route || `/components/${name}`,
        isExternal: false,
        externalUrl: null,
        folder: null,
        description: null,
      })
    }

    return items
  }, [prototypeIndex])

  const itemMap = useMemo(() => Object.fromEntries(allItems.map(i => [i.id, i])), [allItems])

  // State
  const [activeNav, setActiveNav] = useState('all')
  const [activeTab, setActiveTab] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [showPAT, setShowPAT] = useState(false)
  const { starred, toggle: toggleStar } = useStarred()
  const recentIds = useRecent()

  // Filter by nav category
  const navFiltered = useMemo(() => {
    if (activeNav === 'all') return allItems
    const typeMap = { prototypes: 'prototype', canvases: 'canvas', components: 'component' }
    return allItems.filter(i => i.type === typeMap[activeNav])
  }, [allItems, activeNav])

  // Filter by tab
  const items = useMemo(() => {
    if (activeTab === 'Recent') {
      const ordered = recentIds.map(id => itemMap[id]).filter(Boolean)
      if (activeNav !== 'all') {
        const typeMap = { prototypes: 'prototype', canvases: 'canvas', components: 'component' }
        return ordered.filter(i => i.type === typeMap[activeNav])
      }
      return ordered
    }
    if (activeTab === 'Starred') {
      return navFiltered.filter(i => starred.has(i.id))
    }
    return navFiltered
  }, [activeTab, activeNav, navFiltered, recentIds, itemMap, starred])

  // Counts
  const counts = useMemo(() => ({
    all: allItems.length,
    prototypes: allItems.filter(i => i.type === 'prototype').length,
    canvases: allItems.filter(i => i.type === 'canvas').length,
    components: allItems.filter(i => i.type === 'component').length,
  }), [allItems])

  // Starred items for sidebar
  const starredItems = useMemo(() => allItems.filter(i => starred.has(i.id)), [allItems, starred])

  const pageTitle = NAV_ITEMS.find(n => n.id === activeNav)?.label || 'All items'

  return (
    <div className={css.layout}>
      {/* ─── Sidebar ─── */}
      <aside className={css.sidebar}>
        <div className={css.sidebarHeader}>
          <div className={css.logo}>S</div>
          <div>
            <div className={css.appName}>{title}</div>
            {subtitle && <div className={css.appSubtitle}>{subtitle}</div>}
          </div>
        </div>

        <nav className={css.navSection}>
          {NAV_ITEMS.map(nav => (
            <button
              key={nav.id}
              className={activeNav === nav.id ? css.navItemActive : css.navItem}
              onClick={() => setActiveNav(nav.id)}
            >
              <span className={css.navIcon}><Icon name={nav.iconName} size={16} /></span>
              {nav.label}
              <span className={css.navCount}>{counts[nav.id]}</span>
            </button>
          ))}
        </nav>

        <div className={css.separator} />

        <div className={css.sectionLabel}>Starred</div>
        {starredItems.length === 0 && (
          <div className={css.starredEmpty}>Star items to pin them here</div>
        )}
        {starredItems.map(s => (
          <a
            key={s.id}
            className={css.starredItem}
            href={s.isExternal ? s.externalUrl : withBase(basePath, s.route)}
            {...(s.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onClick={() => trackRecent(s.id)}
          >
            <span className={css.starredIcon}>{getTypeIcon(s.type)}</span>
            {s.name}
          </a>
        ))}

        {/* User profile / login */}
        <div className={css.sidebarFooter}>
          <button className={css.loginBtn} onClick={() => setShowPAT(true)}>
            <span className={css.avatar}>👤</span>
            <div>
              <div className={css.userName}>Sign in</div>
              <div className={css.userSub}>Connect with GitHub</div>
            </div>
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className={css.main}>
        <div className={css.topBar}>
          <h1 className={css.pageTitle}>{pageTitle}</h1>
          <div className={css.topActions}>
            <button className={css.createBtn} onClick={() => setShowCreate(true)}>
              + Create
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={css.tabs}>
          {TAB_FILTERS.map(t => (
            <button
              key={t}
              className={activeTab === t ? css.tabActive : css.tab}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className={css.content}>
          {items.length === 0 ? (
            <div className={css.emptyState}>
              {activeTab === 'Recent' && 'No recently opened items yet.'}
              {activeTab === 'Starred' && 'No starred items. Click ☆ on a card to star it.'}
              {activeTab === 'All' && 'No items found. Create a prototype, canvas, or component to get started.'}
            </div>
          ) : (
            <div className={css.grid}>
              {items.map(item => (
                <ArtifactCard
                  key={item.id}
                  item={item}
                  basePath={basePath}
                  starred={starred.has(item.id)}
                  onToggleStar={toggleStar}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreate && <CreateMenu onClose={() => setShowCreate(false)} />}
      <PATDialog open={showPAT} onClose={() => setShowPAT(false)} />
    </div>
  )
}
