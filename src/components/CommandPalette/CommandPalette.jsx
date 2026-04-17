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
} from '@dfosco/storyboard-core'
import CreateDialog from './CreateDialog.jsx'
import './command-palette.css'

/**
 * Build the JSON structure for react-cmdk from all data providers.
 */
function buildPaletteItems(basePath, onCreateAction) {
  const base = (basePath || '/').replace(/\/+$/, '')
  const prefix = base === '/' ? '' : base
  const groups = []
  const isLocalDev = typeof window !== 'undefined' && window.__SB_LOCAL_DEV__ === true

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

  return groups
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
  const [createType, setCreateType] = useState(null)

  function handleCreateAction(type) {
    setOpen(false)
    // Delay so palette closes before dialog opens
    requestAnimationFrame(() => setCreateType(type))
  }

  // Listen for toggle events from Svelte CoreUIBar (dispatched on cmd+k)
  useEffect(() => {
    function handleToggle() {
      setOpen(prev => {
        if (!prev) {
          const built = buildPaletteItems(basePath, handleCreateAction)
          setTimeout(() => {
            setItems(built)
            setSearch('')
          }, 0)
        }
        return !prev
      })
    }

    function handleOpen() {
      const built = buildPaletteItems(basePath, handleCreateAction)
      setItems(built)
      setSearch('')
      setOpen(true)
    }

    document.addEventListener('storyboard:toggle-palette', handleToggle)
    document.addEventListener('storyboard:open-palette', handleOpen)
    return () => {
      document.removeEventListener('storyboard:toggle-palette', handleToggle)
      document.removeEventListener('storyboard:open-palette', handleOpen)
    }
  }, [basePath])

  // Guard against react-cmdk calling onChangeOpen(false) unexpectedly
  const handleChangeOpen = useCallback((value) => {
    if (!value) {
      setOpen(false)
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
      page="root"
      placeholder="Search commands, prototypes, canvases, stories..."
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
    </CommandPalette>

    <CreateDialog
      type={createType}
      basePath={basePath}
      onClose={() => setCreateType(null)}
    />
    </>
  )
}
