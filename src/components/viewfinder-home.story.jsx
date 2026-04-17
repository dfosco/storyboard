/**
 * Viewfinder Home — SaaS-style homescreen story.
 * Re-imagines the Viewfinder as a traditional app dashboard
 * with sidebar navigation, artifact grid, create menu, and user profile.
 */
import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import { Tabs } from '@base-ui/react/tabs'
import { Separator } from '@base-ui/react/separator'
import { Tooltip } from '@base-ui/react/tooltip'
import css from './viewfinder-home.module.css'

/* ─── Mock Data ─── */

const PROTOTYPES = [
  { id: 'p1', name: 'Security Overview', author: 'dfosco', updated: '2 hours ago', color: 'Blue' },
  { id: 'p2', name: 'Repository Settings', author: 'dfosco', updated: '5 hours ago', color: 'Slate' },
  { id: 'p3', name: 'Actions Dashboard', author: 'mona', updated: 'Yesterday', color: 'Green' },
  { id: 'p4', name: 'Copilot Chat', author: 'dfosco', updated: '2 days ago', color: 'Purple' },
  { id: 'p5', name: 'Issue Tracker', author: 'mona', updated: '3 days ago', color: 'Amber' },
  { id: 'p6', name: 'PR Review Flow', author: 'dfosco', updated: '4 days ago', color: 'Rose' },
]

const CANVASES = [
  { id: 'c1', name: 'Viewfinder Redesign', author: 'dfosco', updated: 'Just now', color: 'Purple' },
  { id: 'c2', name: 'Navigation Patterns', author: 'dfosco', updated: '1 day ago', color: 'Blue' },
  { id: 'c3', name: 'Component Library', author: 'mona', updated: '3 days ago', color: 'Green' },
]

const COMPONENTS = [
  { id: 'k1', name: 'TextInput', author: 'dfosco', updated: '1 day ago', color: 'Slate' },
  { id: 'k2', name: 'Button Patterns', author: 'dfosco', updated: '2 days ago', color: 'Blue' },
  { id: 'k3', name: 'Textarea', author: 'mona', updated: '5 days ago', color: 'Green' },
]

const STARRED = [
  { name: 'Security Overview', color: '#3b82f6' },
  { name: 'Viewfinder Redesign', color: '#a855f7' },
  { name: 'Actions Dashboard', color: '#10b981' },
]

const NAV_ITEMS = [
  { id: 'all', label: 'All items', icon: '⊞', count: 12 },
  { id: 'prototypes', label: 'Prototypes', icon: '◇', count: 6 },
  { id: 'canvases', label: 'Canvases', icon: '▢', count: 3 },
  { id: 'components', label: 'Components', icon: '⬡', count: 3 },
]

const TAB_FILTERS = ['All', 'Recent', 'Shared with me', 'Archived']

const THUMB_COLORS = ['thumbBlue', 'thumbAmber', 'thumbGreen', 'thumbPurple', 'thumbRose', 'thumbSlate']

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

/* ─── Card Component ─── */

function ArtifactCard({ name, author, updated, color, type }) {
  const badge = getBadge(type)
  return (
    <div className={css.card}>
      <div className={`${css.cardThumb} ${getThumbClass(color)}`}>
        <span className={`${css.cardBadge} ${badge.cls}`}>{badge.label}</span>
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
    { icon: '◇', title: 'Prototype', desc: 'Interactive page flow', bg: '#dbeafe', fg: '#2563eb' },
    { icon: '▢', title: 'Canvas', desc: 'Freeform board', bg: '#fef3c7', fg: '#b45309' },
    { icon: '⬡', title: 'Component', desc: 'Reusable widget', bg: '#d1fae5', fg: '#059669' },
    { icon: '⊕', title: 'External', desc: 'Link to external URL', bg: '#f3e8ff', fg: '#7c3aed' },
    { icon: '{}', title: 'Object', desc: 'Data fragment', bg: '#f1f5f9', fg: '#475569' },
    { icon: '≡', title: 'Record', desc: 'Data collection', bg: '#ffe4e6', fg: '#e11d48' },
  ]

  return (
    <div className={css.createMenuOverlay} onClick={onClose}>
      <div className={css.createMenu} onClick={e => e.stopPropagation()}>
        <div className={css.createMenuTitle}>Create new</div>
        <div className={css.createMenuGrid}>
          {items.map(it => (
            <button key={it.title} className={css.createMenuItem} onClick={onClose}>
              <div className={css.createMenuIcon} style={{ background: it.bg, color: it.fg }}>{it.icon}</div>
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

export function ViewfinderHome() {
  const [activeNav, setActiveNav] = useState('all')
  const [activeTab, setActiveTab] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [showPAT, setShowPAT] = useState(false)

  const items = (() => {
    switch (activeNav) {
      case 'prototypes':
        return PROTOTYPES.map(p => ({ ...p, type: 'prototype' }))
      case 'canvases':
        return CANVASES.map(c => ({ ...c, type: 'canvas' }))
      case 'components':
        return COMPONENTS.map(k => ({ ...k, type: 'component' }))
      default:
        return [
          ...PROTOTYPES.map(p => ({ ...p, type: 'prototype' })),
          ...CANVASES.map(c => ({ ...c, type: 'canvas' })),
          ...COMPONENTS.map(k => ({ ...k, type: 'component' })),
        ]
    }
  })()

  const pageTitle = NAV_ITEMS.find(n => n.id === activeNav)?.label || 'All items'

  return (
    <div className={css.layout}>
      {/* ─── Sidebar ─── */}
      <aside className={css.sidebar}>
        <div className={css.sidebarHeader}>
          <div className={css.logo}>S</div>
          <span className={css.appName}>Storyboard</span>
        </div>

        <input className={css.searchBox} placeholder="Search…" />

        <nav className={css.navSection}>
          {NAV_ITEMS.map(nav => (
            <button
              key={nav.id}
              className={activeNav === nav.id ? css.navItemActive : css.navItem}
              onClick={() => setActiveNav(nav.id)}
            >
              <span className={css.navIcon}>{nav.icon}</span>
              {nav.label}
              <span className={css.navCount}>{nav.count}</span>
            </button>
          ))}
        </nav>

        <div className={css.separator} />

        <div className={css.sectionLabel}>Starred</div>
        {STARRED.map(s => (
          <div key={s.name} className={css.starredItem}>
            <span className={css.starredDot} style={{ background: s.color }} />
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
            <div className={css.viewToggle}>
              <button className={css.viewToggleBtnActive} title="Grid">⊞</button>
              <button className={css.viewToggleBtn} title="List">≡</button>
            </div>
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
          <div className={css.grid}>
            {items.map(item => (
              <ArtifactCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showCreate && <CreateMenu onClose={() => setShowCreate(false)} />}
      <PATDialog open={showPAT} onClose={() => setShowPAT(false)} />
    </div>
  )
}
