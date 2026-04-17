/**
 * Viewfinder Home — SaaS-style homescreen story.
 * Re-imagines the Viewfinder as a traditional app dashboard
 * with sidebar navigation, artifact grid, create menu, and user profile.
 */
import { useState, useCallback, useSyncExternalStore } from 'react'
import Icon from '@dfosco/storyboard-react/Icon'
import css from './viewfinder-home.module.css'

/* ─── localStorage helpers ─── */

const STARRED_KEY = 'sb-viewfinder-starred'
const RECENT_KEY = 'sb-viewfinder-recent'
const MAX_RECENT = 20

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback }
  catch { return fallback }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new StorageEvent('storage', { key }))
}

// Tiny external store so React re-renders on localStorage writes
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

/* ─── Mock Data ─── */

const ALL_ITEMS = [
  { id: 'p1', name: 'Security Overview', author: 'dfosco', updated: '2 hours ago', color: 'Blue', type: 'prototype' },
  { id: 'p2', name: 'Repository Settings', author: 'dfosco', updated: '5 hours ago', color: 'Slate', type: 'prototype' },
  { id: 'p3', name: 'Actions Dashboard', author: 'mona', updated: 'Yesterday', color: 'Green', type: 'prototype' },
  { id: 'p4', name: 'Copilot Chat', author: 'dfosco', updated: '2 days ago', color: 'Purple', type: 'prototype' },
  { id: 'p5', name: 'Issue Tracker', author: 'mona', updated: '3 days ago', color: 'Amber', type: 'prototype' },
  { id: 'p6', name: 'PR Review Flow', author: 'dfosco', updated: '4 days ago', color: 'Rose', type: 'prototype' },
  { id: 'c1', name: 'Viewfinder Redesign', author: 'dfosco', updated: 'Just now', color: 'Purple', type: 'canvas' },
  { id: 'c2', name: 'Navigation Patterns', author: 'dfosco', updated: '1 day ago', color: 'Blue', type: 'canvas' },
  { id: 'c3', name: 'Component Library', author: 'mona', updated: '3 days ago', color: 'Green', type: 'canvas' },
  { id: 'k1', name: 'TextInput', author: 'dfosco', updated: '1 day ago', color: 'Slate', type: 'component' },
  { id: 'k2', name: 'Button Patterns', author: 'dfosco', updated: '2 days ago', color: 'Blue', type: 'component' },
  { id: 'k3', name: 'Textarea', author: 'mona', updated: '5 days ago', color: 'Green', type: 'component' },
]

const ITEM_MAP = Object.fromEntries(ALL_ITEMS.map(i => [i.id, i]))

const NAV_ITEMS = [
  { id: 'all', label: 'All items', icon: <Icon name="iconoir/key-command" size={16} /> },
  { id: 'prototypes', label: 'Prototypes', icon: <Icon name="prototype" size={16} /> },
  { id: 'canvases', label: 'Canvas', icon: <Icon name="canvas" size={16} /> },
  { id: 'components', label: 'Components', icon: <Icon name="component" size={16} /> },
]

const TAB_FILTERS = ['All', 'Recent', 'Starred']

function getThumbClass(color) {
  return css[`thumb${color}`] || css.thumbSlate
}

function getTypeIcon(type, size = 14) {
  if (type === 'prototype') return <Icon name="prototype" size={size} />
  if (type === 'canvas') return <Icon name="canvas" size={size} />
  if (type === 'component') return <Icon name="component" size={size} />
  return null
}

function getBadge(type) {
  const map = {
    prototype: { cls: css.badgePrototype, label: 'Prototype' },
    canvas: { cls: css.badgeCanvas, label: 'Canvas' },
    component: { cls: css.badgeComponent, label: 'Component' },
  }
  return map[type] || map.prototype
}

function countByType(type) {
  return ALL_ITEMS.filter(i => i.type === type).length
}

/* ─── Star Button ─── */

function StarBtn({ active, onClick }) {
  return (
    <button
      className={active ? css.starBtnActive : css.starBtn}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      aria-label={active ? 'Unstar' : 'Star'}
    >
      {active ? '★' : '☆'}
    </button>
  )
}

/* ─── Card Component ─── */

function ArtifactCard({ id, name, author, updated, color, type, starred, onToggleStar, onOpen }) {
  const badge = getBadge(type)
  return (
    <div className={css.card} onClick={() => onOpen(id)}>
      <div className={`${css.cardThumb} ${getThumbClass(color)}`}>
        <span className={`${css.cardBadge} ${badge.cls}`}>{badge.label}</span>
        <StarBtn active={starred} onClick={() => onToggleStar(id)} />
      </div>
      <div className={css.cardBody}>
        <div className={css.cardTitle}>{name}</div>
        <div className={css.cardMeta}>
          <span>{author}</span>
          <span className={css.cardMetaDot} />
          <span>{updated}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Create Menu ─── */

function CreateMenu({ onClose }) {
  const items = [
    { icon: <Icon name="prototype" size={18} />, title: 'Prototype', desc: 'Interactive page flow' },
    { icon: <Icon name="canvas" size={18} />, title: 'Canvas', desc: 'Freeform board' },
    { icon: <Icon name="component" size={18} />, title: 'Component', desc: 'Reusable widget' },
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

/* ─── Main Story Export ─── */

export function ViewfinderHome({ title = 'Storyboard', subtitle }) {
  const [activeNav, setActiveNav] = useState('all')
  const [activeTab, setActiveTab] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [showPAT, setShowPAT] = useState(false)
  const { starred, toggle: toggleStar } = useStarred()
  const recentIds = useRecent()

  const handleOpen = useCallback((id) => {
    trackRecent(id)
  }, [])

  // Filter by nav category
  const navFiltered = activeNav === 'all'
    ? ALL_ITEMS
    : ALL_ITEMS.filter(i => i.type === (activeNav === 'canvases' ? 'canvas' : activeNav === 'components' ? 'component' : 'prototype'))

  // Filter by tab
  const items = (() => {
    if (activeTab === 'Recent') {
      const ordered = recentIds.map(id => ITEM_MAP[id]).filter(Boolean)
      if (activeNav !== 'all') {
        const typeFilter = activeNav === 'canvases' ? 'canvas' : activeNav === 'components' ? 'component' : 'prototype'
        return ordered.filter(i => i.type === typeFilter)
      }
      return ordered
    }
    if (activeTab === 'Starred') {
      return navFiltered.filter(i => starred.has(i.id))
    }
    return navFiltered
  })()

  // Starred items for sidebar
  const starredItems = ALL_ITEMS.filter(i => starred.has(i.id))

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
          {NAV_ITEMS.map(nav => {
            const count = nav.id === 'all'
              ? ALL_ITEMS.length
              : countByType(nav.id === 'canvases' ? 'canvas' : nav.id === 'components' ? 'component' : 'prototype')
            return (
              <button
                key={nav.id}
                className={activeNav === nav.id ? css.navItemActive : css.navItem}
                onClick={() => setActiveNav(nav.id)}
              >
                <span className={css.navIcon}>{nav.icon}</span>
                {nav.label}
                <span className={css.navCount}>{count}</span>
              </button>
            )
          })}
        </nav>

        <div className={css.separator} />

        <div className={css.sectionLabel}>Starred</div>
        {starredItems.length === 0 && (
          <div className={css.starredEmpty}>Star items to pin them here</div>
        )}
        {starredItems.map(s => (
          <div key={s.id} className={css.starredItem} onClick={() => handleOpen(s.id)}>
            <span className={css.starredIcon}>{getTypeIcon(s.type)}</span>
            {s.name}
          </div>
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
            </div>
          ) : (
            <div className={css.grid}>
              {items.map(item => (
                <ArtifactCard
                  key={item.id}
                  {...item}
                  starred={starred.has(item.id)}
                  onToggleStar={toggleStar}
                  onOpen={handleOpen}
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
