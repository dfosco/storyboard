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
  getToolbarConfig,
  setTheme,
} from '@dfosco/storyboard-core'
import CreateDialog from './CreateDialog.jsx'
import './command-palette.css'

/**
 * Build groups from commandPalette.sections config.
 * Returns { groups, toolMenus } where toolMenus are entries with sub-pages.
 *
 * Section types:
 *   - Static items:  { items: [...] }
 *   - Dynamic list:  { source: "canvases"|"prototypes"|"stories"|"recent" }
 *   - Tool section:  { source: "tools", toolIds: ["theme", "flows"] }
 *   - Tool-menu:     { type: "tool-menu", options: [...] }
 */
function buildConfigSections(prefix, onNavigateToPage, onCreateAction) {
  const config = getCommandPaletteConfig()
  const sections = config?.sections || []
  const groups = []
  const toolMenus = []

  for (const section of sections) {
    // Separator: id starts with "sep"
    if (section.id?.startsWith('sep')) {
      groups.push({ id: `cfg:${section.id}`, items: [{ id: `cfg:${section.id}:sep`, children: '', keywords: ['*'] }] })
      continue
    }

    if (section.type === 'tool-menu') {
      toolMenus.push(section)
      continue
    }

    if (section.source) {
      const result = buildDynamicSection(section, prefix, onNavigateToPage, onCreateAction)
      if (result?.group) groups.push(result.group)
      if (result?.subPages) toolMenus.push(...result.subPages)
      continue
    }

    if (section.items && section.items.length > 0) {
      groups.push({
        heading: section.title,
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
      closeOnSelect: false,
    }))
    groups.push({ heading: 'Tools', id: 'cfg:tool-menus', items: menuItems })
  }

  return { groups, toolMenus }
}

function buildDynamicSection(section, prefix, onNavigateToPage, onCreateAction) {
  if (section.source === 'tools') {
    return buildToolsSection(section, prefix, onNavigateToPage)
  }

  // --- Create source (dev-only workshop actions) ---
  if (section.source === 'create') {
    const isLocalDev = typeof window !== 'undefined' && window.__SB_LOCAL_DEV__ === true
    if (!isLocalDev) return null
    const createItems = [
      { id: 'create:canvas', children: 'New Canvas', keywords: ['create', 'canvas', 'new', 'board'], showType: false, onClick: () => onCreateAction?.('Canvas') },
      { id: 'create:prototype', children: 'New Prototype', keywords: ['create', 'prototype', 'new', 'page'], showType: false, onClick: () => onCreateAction?.('Prototype') },
      { id: 'create:component', children: 'New Component', keywords: ['create', 'component', 'new', 'story'], showType: false, onClick: () => onCreateAction?.('Component') },
      { id: 'create:flow', children: 'New Prototype Flow', keywords: ['create', 'flow', 'new', 'data'], showType: false, onClick: () => onCreateAction?.('Flow') },
      { id: 'create:page', children: 'New Prototype Page', keywords: ['create', 'page', 'new'], showType: false, onClick: () => onCreateAction?.('Page') },
    ]
    return { group: { heading: section.title, id: `cfg:${section.id}`, items: createItems } }
  }

  // --- Commands source (all registered toolbar actions) ---
  if (section.source === 'commands') {
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
            const url = action.url.startsWith('/') && !action.url.startsWith('//') ? prefix + action.url : action.url
            window.location.href = url
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
    if (commandItems.length === 0) return null
    return { group: { heading: section.title, id: `cfg:${section.id}`, items: commandItems } }
  }

  // --- Recent source: all artifact types from getRecent() ---
  if (section.source === 'recent') {
    const recent = getRecent()
    if (recent.length === 0) return null
    let items = recent
    if (section.limit) items = items.slice(0, section.limit)
    return {
      group: {
        heading: section.title,
        id: `cfg:${section.id}`,
        items: items.map(entry => ({
          id: `cfg:${section.id}:${entry.type}:${entry.key}`,
          children: entry.label,
          keywords: [entry.type, entry.key, entry.label],
          onClick: () => {
            trackRecent(entry.type, entry.key, entry.label)
            const route = resolveRecentRoute(entry, prefix)
            if (route) window.location.href = route
          },
      })),
      },
    }
  }

  // --- Artifact sources: canvases, prototypes, stories ---
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
    group: {
      heading: section.title,
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
    },
  }
}

/**
 * Build a section from toolbar.config.json tools.
 * If toolIds is provided, only include those tools in that order (with optional custom labels).
 * Otherwise include all command-list tools.
 *
 * toolIds format: ["theme", "flows"] or [{ id: "theme", label: "Change theme" }]
 */
function buildToolsSection(section, prefix, onNavigateToPage) {
  const toolbarConfig = getToolbarConfig()
  const tools = toolbarConfig?.tools || {}
  const mode = getCurrentMode() || 'default'
  const actions = getActionsForMode(mode)

  let entries = []

  if (section.toolIds && section.toolIds.length > 0) {
    for (const entry of section.toolIds) {
      const toolId = typeof entry === 'string' ? entry : entry.id
      const customLabel = typeof entry === 'object' ? entry.label : null
      const tool = tools[toolId]
      if (!tool) continue
      const state = getToolbarToolState(toolId)
      if (state === 'disabled' || state === 'hidden') continue
      entries.push({ toolId, tool, label: customLabel || tool.label || toolId })
    }
  } else {
    for (const [toolId, tool] of Object.entries(tools)) {
      if (tool.surface !== 'command-list') continue
      const state = getToolbarToolState(toolId)
      if (state === 'disabled' || state === 'hidden') continue
      entries.push({ toolId, tool, label: tool.label || toolId })
    }
  }

  if (entries.length === 0) return null

  const items = []
  const subPages = []

  for (const { toolId, tool, label } of entries) {
    if (tool.render === 'link' && tool.url) {
      items.push({
        id: `cfg:${section.id}:${toolId}`,
        children: label,
        keywords: [label, toolId].filter(Boolean),
        onClick: () => {
          const url = tool.url.startsWith('/') ? prefix + tool.url : tool.url
          window.location.href = url
        },
      })
      continue
    }

    if (tool.render === 'submenu' || tool.render === 'menu') {
      const action = actions.find(a => a.toolKey === toolId)
      if (action?.type === 'submenu') {
        const children = getActionChildren(action.id)
        if (children.length > 0) {
          const pageId = `tool:${toolId}`
          subPages.push({
            id: pageId,
            label,
            title: label,
            keywords: [label, toolId].filter(Boolean),
            options: children.map(child => ({
              label: child.label,
              execute: child.execute,
            })),
          })
          items.push({
            id: `cfg:${section.id}:${toolId}`,
            children: label,
            keywords: [label, toolId].filter(Boolean),
            onClick: () => onNavigateToPage?.(pageId),
            closeOnSelect: false,
            showType: false,
          })
          continue
        }
      }

      // Declarative options from toolbar.config.json (e.g. theme options)
      if (tool.options && tool.options.length > 0) {
        const pageId = `tool:${toolId}`
        const handlerId = tool.handler || `core:${toolId}`
        subPages.push({
          id: pageId,
          label,
          title: label,
          keywords: [label, toolId].filter(Boolean),
          options: tool.options.map(opt => ({
            label: opt.label,
            // Lazy-execute via the handler's action system
            toolHandler: handlerId,
            value: opt.value,
          })),
        })
        items.push({
          id: `cfg:${section.id}:${toolId}`,
          children: label,
          keywords: [label, toolId].filter(Boolean),
          onClick: () => onNavigateToPage?.(pageId),
          closeOnSelect: false,
          showType: false,
        })
        continue
      }

      if (action) {
        items.push({
          id: `cfg:${section.id}:${toolId}`,
          children: label,
          keywords: [label, toolId].filter(Boolean),
          onClick: () => executeAction(action.id),
          showType: false,
        })
        continue
      }
    }

    if (tool.render === 'sidepanel' && tool.sidepanel) {
      const action = actions.find(a => a.toolKey === toolId)
      items.push({
        id: `cfg:${section.id}:${toolId}`,
        children: label,
        keywords: [label, toolId].filter(Boolean),
        onClick: () => { if (action) executeAction(action.id) },
      })
      continue
    }

    items.push({
      id: `cfg:${section.id}:${toolId}`,
      children: label,
      keywords: [label, toolId].filter(Boolean),
      onClick: () => executeAction(toolId),
    })
  }

  return {
    group: {
      heading: section.title,
      id: `cfg:${section.id}`,
      items,
    },
    subPages,
  }
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
 * Build the JSON structure for react-cmdk from all data providers.
 * Entirely config-driven — all sections come from commandPalette.sections.
 */
function buildPaletteItems(basePath, onCreateAction, onNavigateToPage) {
  const base = (basePath || '/').replace(/\/+$/, '')
  const prefix = base === '/' ? '' : base

  const { groups, toolMenus } = buildConfigSections(prefix, onNavigateToPage, onCreateAction)

  return { groups, toolMenus }
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

  // Listen for Cmd+K directly
  // The Svelte CoreUIBar also handles Cmd+K by dispatching
  // 'storyboard:toggle-palette'. We use rAF to detect if Svelte
  // already fired the toggle event and skip to avoid double-toggle.
  useEffect(() => {
    let toggledByEvent = false

    function handleToggleEvent() {
      toggledByEvent = true
    }

    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggledByEvent = false
        requestAnimationFrame(() => {
          if (toggledByEvent) return
          const built = buildPaletteItems(basePath, handleCreateAction, handleNavigateToPage)
          setItems(built.groups)
          setToolMenus(built.toolMenus)
          setSearch('')
          setActivePage('root')
          setOpen(prev => !prev)
        })
      }
    }

    document.addEventListener('storyboard:toggle-palette', handleToggleEvent)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('storyboard:toggle-palette', handleToggleEvent)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [basePath])

  // Listen for toggle events from Svelte CoreUIBar
  useEffect(() => {
    function handleToggle() {
      setOpen(prev => {
        if (!prev) {
          // Use setTimeout to set items after open state is committed
          setTimeout(() => {
            const built = buildPaletteItems(basePath, handleCreateAction, handleNavigateToPage)
            setItems(built.groups)
            setToolMenus(built.toolMenus)
            setSearch('')
            setActivePage('root')
          }, 0)
        }
        return !prev
      })
    }

    function handleOpen() {
      const built = buildPaletteItems(basePath, handleCreateAction, handleNavigateToPage)
      setItems(built.groups)
      setToolMenus(built.toolMenus)
      setSearch('')
      setActivePage('root')
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

  // Items without separators — used for keyboard navigation indexing
  const navigableItems = useMemo(
    () => filteredItems.filter(list => !list.id?.startsWith('cfg:sep')),
    [filteredItems]
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
            list.id?.startsWith('cfg:sep') ? (
              !search && <hr key={list.id} style={{ border: 'none', borderTop: '1px solid var(--borderColor-muted, #e5e5e5)', margin: '4px 14px' }} />
            ) : (
              <CommandPalette.List key={list.id} heading={list.heading}>
                {list.items.map(({ id, ...rest }) => (
                  <CommandPalette.ListItem
                    key={id}
                    index={getItemIndex(navigableItems, id)}
                    {...rest}
                  />
                ))}
              </CommandPalette.List>
            )
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
                showType={false}
                onClick={() => {
                  if (opt.execute) {
                    opt.execute()
                  } else if (opt.toolHandler === 'core:theme' && opt.value) {
                    setTheme(opt.value)
                  } else if (opt.action) {
                    executeAction(opt.action, opt.value)
                  }
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
