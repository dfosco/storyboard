/**
 * Viewfinder Home — SaaS-style homescreen story.
 * Re-imagines the Viewfinder as a traditional app dashboard
 * with sidebar navigation, artifact grid, create menu, and user profile.
 */
import { useState, useCallback, useSyncExternalStore } from 'react'
import css from './viewfinder-home.module.css'

/* ─── Icons (matching widget title bars) ─── */

function PrototypeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M19.4 20H4.6C4.26863 20 4 19.7314 4 19.4V4.6C4 4.26863 4.26863 4 4.6 4H19.4C19.7314 4 20 4.26863 20 4.6V19.4C20 19.7314 19.7314 20 19.4 20Z" />
      <path d="M11 12V4" />
      <path d="M4 12H20" />
    </svg>
  )
}

function ComponentIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5.21173 15.1113L2.52473 12.4243C2.29041 12.1899 2.29041 11.8101 2.52473 11.5757L5.21173 8.88873C5.44605 8.65442 5.82595 8.65442 6.06026 8.88873L8.74727 11.5757C8.98158 11.8101 8.98158 12.1899 8.74727 12.4243L6.06026 15.1113C5.82595 15.3456 5.44605 15.3456 5.21173 15.1113Z" />
      <path d="M11.5757 21.475L8.88874 18.788C8.65443 18.5537 8.65443 18.1738 8.88874 17.9395L11.5757 15.2525C11.8101 15.0182 12.19 15.0182 12.4243 15.2525L15.1113 17.9395C15.3456 18.1738 15.3456 18.5537 15.1113 18.788L12.4243 21.475C12.19 21.7094 11.8101 21.7094 11.5757 21.475Z" />
      <path d="M17.9395 15.1113L15.2525 12.4243C15.0182 12.1899 15.0182 11.8101 15.2525 11.5757L17.9395 8.88873C18.1738 8.65442 18.5537 8.65442 18.788 8.88873L21.475 11.5757C21.7094 11.8101 21.7094 12.1899 21.475 12.4243L18.788 15.1113C18.5537 15.3456 18.1738 15.3456 17.9395 15.1113Z" />
      <path d="M11.5757 8.74727L8.88874 6.06026C8.65443 5.82595 8.65443 5.44605 8.88874 5.21173L11.5757 2.52473C11.8101 2.29041 12.19 2.29041 12.4243 2.52473L15.1113 5.21173C15.3456 5.44605 15.3456 5.82595 15.1113 6.06026L12.4243 8.74727C12.19 8.98158 11.8101 8.98158 11.5757 8.74727Z" />
    </svg>
  )
}

// Canvas icon from assets/icons/canvas.svg
function CanvasIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 23" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="1" y="1" width="26" height="21" rx="7" />
      <path d="M17.8421 12.9776V12.9788L17.8409 12.9812C18.2386 12.451 18.9901 12.3434 19.5204 12.7409C20.0506 13.1385 20.1582 13.8901 19.7606 14.4204L18.8008 13.7008C19.7416 14.4064 19.7606 14.4209 19.7606 14.4215L19.7583 14.4239C19.7573 14.4252 19.756 14.427 19.7548 14.4286C19.7524 14.4317 19.7499 14.436 19.7466 14.4403C19.7399 14.449 19.7311 14.4601 19.7208 14.4731C19.7001 14.4992 19.6715 14.5332 19.6364 14.5751C19.566 14.6589 19.4665 14.7734 19.3387 14.9067C19.0842 15.1723 18.712 15.5216 18.2312 15.8713C17.2736 16.5677 15.831 17.3011 14.0003 17.3011C12.1695 17.3011 10.727 16.5677 9.76938 15.8713C9.28854 15.5216 8.91634 15.1723 8.66184 14.9067C8.53409 14.7734 8.43453 14.6589 8.36415 14.5751C8.32905 14.5332 8.30044 14.4992 8.27977 14.4731C8.26946 14.4601 8.26066 14.449 8.25398 14.4403C8.25066 14.436 8.24819 14.4317 8.24578 14.4286C8.24457 14.427 8.24325 14.4252 8.24226 14.4239L8.23992 14.4215C8.24001 14.4209 8.25896 14.4064 9.19979 13.7008L8.23992 14.4204C7.8424 13.8901 7.94999 13.1385 8.48018 12.7409C9.01029 12.3435 9.76077 12.4513 10.1585 12.9812L10.1597 12.98L10.1585 12.9776H10.1573C10.1583 12.9789 10.1602 12.9801 10.162 12.9823C10.1691 12.9914 10.182 13.0091 10.2018 13.0327C10.2416 13.08 10.3064 13.1534 10.394 13.2449C10.5708 13.4293 10.8366 13.6804 11.1805 13.9305C11.873 14.4341 12.8308 14.9009 14.0003 14.9009C15.1698 14.9009 16.1276 14.4341 16.8201 13.9305C17.164 13.6804 17.4298 13.4293 17.6065 13.2449C17.6942 13.1534 17.759 13.08 17.7987 13.0327C17.8186 13.0091 17.8314 12.9914 17.8386 12.9823L17.8421 12.9776Z" fill="currentColor" stroke="none" />
      <path d="M10.4111 6.5C11.0739 6.5 11.6112 7.03731 11.6112 7.70012C11.6112 8.36293 11.0739 8.90025 10.4111 8.90025H10.3993C9.73653 8.90025 9.19922 8.36293 9.19922 7.70012C9.19922 7.03731 9.73653 6.5 10.3993 6.5H10.4111Z" fill="currentColor" stroke="none" />
      <path d="M17.6103 6.5C18.2731 6.5 18.8104 7.03731 18.8104 7.70012C18.8104 8.36293 18.2731 8.90025 17.6103 8.90025H17.5986C16.9358 8.90025 16.3984 8.36293 16.3984 7.70012C16.3984 7.03731 16.9358 6.5 17.5986 6.5H17.6103Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function AllItemsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  )
}

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
  { id: 'all', label: 'All items', icon: <AllItemsIcon size={16} /> },
  { id: 'prototypes', label: 'Prototypes', icon: <PrototypeIcon size={16} /> },
  { id: 'canvases', label: 'Canvases', icon: <CanvasIcon size={16} /> },
  { id: 'components', label: 'Components', icon: <ComponentIcon size={16} /> },
]

const TAB_FILTERS = ['All', 'Recent', 'Starred']

function getThumbClass(color) {
  return css[`thumb${color}`] || css.thumbSlate
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
    { icon: <PrototypeIcon size={18} />, title: 'Prototype', desc: 'Interactive page flow' },
    { icon: <CanvasIcon size={18} />, title: 'Canvas', desc: 'Freeform board' },
    { icon: <ComponentIcon size={18} />, title: 'Component', desc: 'Reusable widget' },
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
            <span className={css.starredDot} style={{ background: getBadge(s.type).dotColor }} />
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
