import { useState, useEffect, useCallback, useMemo } from 'react'
import 'react-cmdk/dist/cmdk.css'
import CommandPalette, { filterItems, getItemIndex } from 'react-cmdk'
import {
  buildPrototypeIndex,
  listStories,
  getStoryData,
  getActionsForMode,
  executeAction,
  getActionChildren,
  getToolbarToolState,
  getCurrentMode,
  getRecent,
  trackRecent,
  getCommandPaletteConfig,
} from '@dfosco/storyboard-core'
import CreateDialog from './CreateDialog.jsx'
import './command-palette.css'

/**
 * Build groups from commandPalette.sections config.
 * Returns { groups, toolMenus } where toolMenus are entries with sub-pages.
 */
function buildConfigSections(prefix, onNavigateToPage) {
  const config = getCommandPaletteConfig()
  const sections = config?.sections || []
  const groups = []
  const toolMenus = []

  for (const section of sections) {
    if (section.type === 'tool-menu') {
      // Tool-menu entries appear in a dedicated group and open a sub-page
      toolMenus.push(section)
      continue
    }

    if (section.source) {
      // Dynamic list from data source
      const group = buildDynamicSection(section, prefix)
      if (group) groups.push(group)
      continue
    }

    if (section.items && section.items.length > 0) {
      // Static items
      groups.push({
        heading: section.title || section.id,
        id: `cfg:${section.id}`,
        items: section.items.map((item, i) => {
          const id = `cfg:${section.id}:${i}`
          if (item.type === 'link') {
            return {
              id,
              children: item.label,
              keywords: item.keywords || [item.label],
              onClick: () => {
                const url = item.url?.startsWith('/') ? prefix + item.url : item.url
                if (url) window.location.href = url
              },
            }
          }
          if (item.type === 'action') {
            return {
              id,
              children: item.label,
              keywords: item.keywords || [item.label],
              onClick: () => { if (item.action) executeAction(item.action) },
            }
          }
          return { id, children: item.label, keywords: [item.label] }
        }),
      })
    }
  }

  // Add tool-menu entries as a group with navigation
  if (toolMenus.length > 0) {
    const menuItems = toolMenus.map(menu => ({
      id: `toolmenu:${menu.id}`,
      children: menu.label || menu.id,
      keywords: menu.keywords || [menu.label || menu.id],
      onClick: () => onNavigateToPage?.(menu.id),
    }))
    groups.push({ heading: 'Tools', id: 'cfg:tool-menus', items: menuItems })
  }

  return { groups, toolMenus }
}

function buildDynamicSection(section, prefix) {
  const index = buildPrototypeIndex()
  let sourceItems = []

  if (section.source === 'canvases') {
    for (const c of index.canvases) sourceItems.push({ name: c.name, route: `${prefix}${c.route}`, id: c.dirName, type: 'canvas' })
    for (const f of index.folders) {
      if (f.canvases) for (const c of f.canvases) sourceItems.push({ name: c.name, route: `${prefix}${c.route}`, id: c.dirName, type: 'canvas' })
    }
  } else if (section.source === 'prototypes') {
    for (const p of index.prototypes) sourceItems.push({ name: p.name, route: `${prefix}/${p.dirName}`, id: p.dirName, type: 'prototype' })
    for (const f of index.folders) {
      for (const p of f.prototypes) sourceItems.push({ name: p.name, route: `${prefix}/${p.dirName}`, id: p.dirName, type: 'prototype' })
    }
  } else if (section.source === 'stories') {
    for (const name of listStories()) {
      const data = getStoryData(name)
      const route = data?._route || `/components/${name}`
      sourceItems.push({ name, route: `${prefix}${route}`, id: name, type: 'story' })
    }
  }

  if (sourceItems.length === 0) return null

  // Order
  if (section.order === 'recent') {
    const recent = getRecent()
    const recentKeys = recent.map(r => r.key)
    sourceItems.sort((a, b) => {
      const ai = recentKeys.indexOf(a.id)
      const bi = recentKeys.indexOf(b.id)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  } else if (section.order === 'alphabetical') {
    sourceItems.sort((a, b) => a.name.localeCompare(b.name))
  }

  if (section.limit) sourceItems = sourceItems.slice(0, section.limit)

  return {
    heading: section.title || section.id,
    id: `cfg:${section.id}`,
    items: sourceItems.map(item => ({
      id: `cfg:${section.id}:${item.id}`,
      children: item.name,
      keywords: [item.name, item.id, item.type],
      onClick: () => {
        trackRecent(item.type, item.id, item.name)
        window.location.href = item.route
      },
    })),
  }
}

/**
 * Build the JSON structure for react-cmdk from all data providers.
 */
function buildPaletteItems(basePath, onCreateAction, onNavigateToPage) {
  const base = (basePath || '/').replace(/\/+$/, '')
  const prefix = base === '/' ? '' : base
  const groups = []
  const isLocalDev = typeof window !== 'undefined' && window.__SB_LOCAL_DEV__ === true

  // Config-driven sections (prepended)
  const { groups: configGroups, toolMenus } = buildConfigSections(prefix, onNavigateToPage)

  // --- Create (dev only) ---
  if (isLocalDev) {
    groups.push({
      heading: 'Create',
      id: 'create',
      items: [
        { id: 'create:canvas', children: 'New Canvas', keywords: ['create', 'canvas', 'new', 'board'], onClick: () => onCreateAction?.('Canvas') },
        { id: 'create:prototype', children: 'New Prototype', keywords: ['create', 'prototype', 'new', 'page'], onClick: () => onCreateAction?.('Prototype') },
        { id: 'create:component', children: 'New Component', keywords: ['create', 'component', 'new', 'story'], onClick: () => onCreateAction?.('Component') },
        { id: 'create:flow', children: 'New Prototype Flow', keywords: ['create', 'flow', 'new', 'data'], onClick: () => onCreateAction?.('Flow') },
        { id: 'create:page', children: 'New Prototype Page', keywords: ['create', 'page', 'new'], onClick: () => onCreateAction?.('Page') },
      ],
    })
  }

  // --- Recent ---
  const recent = getRecent()
  if (recent.length > 0) {
    groups.push({
      heading: 'Recent',
      id: 'recent',
      items: recent.map(entry => ({
        id: `recent:${entry.type}:${entry.key}`,
        children: entry.label,
        keywords: [entry.type, entry.key],
        onClick: () => {
          trackRecent(entry.type, entry.key, entry.label)
          const route = resolveRecentRoute(entry, prefix)
          if (route) window.location.href = route
        },
      })),
    })
  }

  // --- Commands ---
  const mode = getCurrentMode() || 'default'
  const actions = getActionsForMode(mode)
  const commandItems = []

  for (const action of actions) {
    if (action.type === 'header' || action.type === 'separator' || action.type === 'footer') continue
    if (action.toolKey) {
      const state = getToolbarToolState(action.toolKey)
      if (state === 'disabled' || state === 'hidden') continue
    }

    if (action.type === 'submenu') {
      const children = getActionChildren(action.id)
      for (const child of children) {
        commandItems.push({
          id: `cmd:${action.id}/${child.id || child.label}`,
          children: child.label,
          keywords: [action.label, child.label],
          onClick: () => { if (child.execute) child.execute() },
        })
      }
    } else if (action.type === 'link' && action.url) {
      commandItems.push({
        id: `cmd:${action.id}`,
        children: action.label,
        keywords: [action.label],
        onClick: () => {
          if (action.url.startsWith('/') && !action.url.startsWith('//')) {
            window.location.href = prefix + action.url
          } else {
            window.location.href = action.url
          }
        },
      })
    } else {
      commandItems.push({
        id: `cmd:${action.id}`,
        children: action.label,
        keywords: [action.label],
        onClick: () => executeAction(action.id),
      })
    }
  }

  if (commandItems.length > 0) {
    groups.push({ heading: 'Commands', id: 'commands', items: commandItems })
  }

  // --- Prototypes ---
  const index = buildPrototypeIndex()
  const protoItems = []

  function addProto(proto) {
    if (proto.isExternal) {
      protoItems.push({
        id: `proto:${proto.dirName}`,
        children: proto.name,
        keywords: [proto.dirName, proto.name, ...(proto.author ? [].concat(proto.author) : []), proto.folder || ''].filter(Boolean),
        href: proto.externalUrl,
        target: '_blank',
        onClick: () => trackRecent('prototype', proto.dirName, proto.name),
      })
    } else {
      protoItems.push({
        id: `proto:${proto.dirName}`,
        children: proto.name,
        keywords: [proto.dirName, proto.name, ...(proto.author ? [].concat(proto.author) : []), proto.folder || ''].filter(Boolean),
        onClick: () => {
          trackRecent('prototype', proto.dirName, proto.name)
          window.location.href = `${prefix}/${proto.dirName}`
        },
      })
    }
  }

  for (const proto of index.prototypes) addProto(proto)
  for (const folder of index.folders) {
    for (const proto of folder.prototypes) addProto(proto)
  }

  if (protoItems.length > 0) {
    groups.push({ heading: 'Prototypes', id: 'prototypes', items: protoItems })
  }

  // --- Canvases ---
  const canvasItems = []

  function addCanvas(canvas) {
    canvasItems.push({
      id: `canvas:${canvas.dirName}`,
      children: canvas.name,
      keywords: [canvas.dirName, canvas.name, ...(canvas.author ? [].concat(canvas.author) : []), canvas.folder || ''].filter(Boolean),
      onClick: () => {
        trackRecent('canvas', canvas.dirName, canvas.name)
        window.location.href = `${prefix}${canvas.route}`
      },
    })
  }

  for (const canvas of index.canvases) addCanvas(canvas)
  for (const folder of index.folders) {
    if (folder.canvases) {
      for (const canvas of folder.canvases) addCanvas(canvas)
    }
  }

  if (canvasItems.length > 0) {
    groups.push({ heading: 'Canvases', id: 'canvases', items: canvasItems })
  }

  // --- Stories ---
  const storyNames = listStories()
  const storyItems = []
  for (const name of storyNames) {
    const data = getStoryData(name)
    if (!data) continue
    const route = data._route || `/components/${name}`
    storyItems.push({
      id: `story:${name}`,
      children: name,
      keywords: [name, 'story', 'component'],
      onClick: () => {
        trackRecent('story', name, name)
        window.location.href = `${prefix}${route}`
      },
    })
  }

  if (storyItems.length > 0) {
    groups.push({ heading: 'Stories', id: 'stories', items: storyItems })
  }

  return { groups: [...configGroups, ...groups], toolMenus }
}

function resolveRecentRoute(entry, prefix) {
  switch (entry.type) {
    case 'prototype':
      return `${prefix}/${entry.key}`
    case 'canvas':
      return `${prefix}/canvas/${entry.key}`
    case 'story': {
      const data = getStoryData(entry.key)
      const route = data?._route || `/components/${entry.key}`
      return `${prefix}${route}`
    }
    default:
      return null
  }
}

/**
 * StoryboardCommandPalette — React command palette using react-cmdk.
 * Mounted at app root, listens for custom events from Svelte CoreUIBar.
 */
export default function StoryboardCommandPalette({ basePath }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState([])
  const [toolMenus, setToolMenus] = useState([])
  const [activePage, setActivePage] = useState('root')
  const [createType, setCreateType] = useState(null)

  function handleCreateAction(type) {
    setOpen(false)
    requestAnimationFrame(() => setCreateType(type))
  }

  function handleNavigateToPage(pageId) {
    setSearch('')
    setActivePage(pageId)
  }

  function rebuildItems() {
    const built = buildPaletteItems(basePath, handleCreateAction, handleNavigateToPage)
    setItems(built.groups)
    setToolMenus(built.toolMenus)
    setSearch('')
    setActivePage('root')
  }

  // Listen for Cmd+K directly
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => {
          if (!prev) setTimeout(rebuildItems, 0)
          return !prev
        })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [basePath])

  // Listen for toggle events from Svelte CoreUIBar
  useEffect(() => {
    function handleToggle() {
      setOpen(prev => {
        if (!prev) setTimeout(rebuildItems, 0)
        return !prev
      })
    }

    function handleOpen() {
      rebuildItems()
      setOpen(true)
    }

    document.addEventListener('storyboard:toggle-palette', handleToggle)
    document.addEventListener('storyboard:open-palette', handleOpen)
    return () => {
      document.removeEventListener('storyboard:toggle-palette', handleToggle)
      document.removeEventListener('storyboard:open-palette', handleOpen)
    }
  }, [basePath])

  const handleChangeOpen = useCallback((value) => {
    if (!value) {
      setOpen(false)
      setActivePage('root')
    }
  }, [])

  const filteredItems = useMemo(
    () => filterItems(items, search),
    [items, search]
  )

  const handleChangeSearch = useCallback((value) => {
    setSearch(value)
  }, [])

  return (
    <>
    <CommandPalette
      onChangeSearch={handleChangeSearch}
      onChangeOpen={handleChangeOpen}
      search={search}
      isOpen={open}
      page={activePage}
      placeholder={activePage === 'root'
        ? 'Search commands, prototypes, canvases, stories...'
        : `Search ${toolMenus.find(m => m.id === activePage)?.label || ''}...`
      }
    >
      <CommandPalette.Page id="root">
        {filteredItems.length ? (
          filteredItems.map((list) => (
            <CommandPalette.List key={list.id} heading={list.heading}>
              {list.items.map(({ id, ...rest }) => (
                <CommandPalette.ListItem
                  key={id}
                  index={getItemIndex(filteredItems, id)}
                  {...rest}
                />
              ))}
            </CommandPalette.List>
          ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No results for &ldquo;{search}&rdquo;
          </div>
        )}
      </CommandPalette.Page>

      {/* Tool-menu sub-pages */}
      {toolMenus.map(menu => (
        <CommandPalette.Page
          key={menu.id}
          id={menu.id}
          onEscape={() => { setActivePage('root'); setSearch('') }}
          searchPrefix={[menu.label || menu.id]}
        >
          <CommandPalette.List heading={menu.title || menu.label || menu.id}>
            {(menu.options || []).map((opt, i) => (
              <CommandPalette.ListItem
                key={`${menu.id}:${i}`}
                index={i}
                onClick={() => {
                  if (opt.action) executeAction(opt.action, opt.value)
                  setOpen(false)
                  setActivePage('root')
                }}
              >
                {opt.label}
              </CommandPalette.ListItem>
            ))}
          </CommandPalette.List>
        </CommandPalette.Page>
      ))}
    </CommandPalette>

    <CreateDialog
      type={createType}
      basePath={basePath}
      onClose={() => setCreateType(null)}
    />
    </>
  )
}
