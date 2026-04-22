import { useState, useEffect, useCallback, useMemo } from 'react'
import 'react-cmdk/dist/cmdk.css'
import * as ReactCmdk from 'react-cmdk'
const CommandPalette = ReactCmdk.default || ReactCmdk
const { filterItems, getItemIndex } = ReactCmdk
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
  getTheme,
  isExcludedByRoute,
} from '@dfosco/storyboard-core'
import { widgetTypes } from '../canvas/widgets/widgetConfig.js'
import CreateDialog from './CreateDialog.jsx'
import BranchBar from '../BranchBar/BranchBar.jsx'
import AuthModal from '../AuthModal/AuthModal.jsx'
import './command-palette.css'

/**
 * Check if a tool should be hidden from the command palette on the current route.
 * Uses the same pattern-matching logic as excludeRoutes.
 */
function isHiddenInPalette(tool, basePath) {
  const val = tool.hideInCommandPalette
  if (val === true) return true
  if (!val || !Array.isArray(val) || val.length === 0) return false
  if (typeof window === 'undefined') return false
  let pathname = window.location.pathname
  const base = (basePath || '/').replace(/\/+$/, '')
  if (base && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || '/'
  }
  return val.some(pattern => new RegExp(pattern).test(pathname))
}

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
  const usedToolIds = new Set() // Track tools already listed by source:"tools" sections
  const basePath = prefix || '/'

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
      // Defer tool-subpages — needs usedToolIds from all other sections first
      if (section.source === 'tool-subpages') continue
      const result = buildDynamicSection(section, prefix, onNavigateToPage, onCreateAction)
      if (result?.group) groups.push(result.group)
      if (result?.subPages) toolMenus.push(...result.subPages)
      if (result?.usedToolIds) result.usedToolIds.forEach(id => usedToolIds.add(id))
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

  // Resolve tool-subpages sections (deferred — needs complete usedToolIds)
  for (const section of sections) {
    if (section.source !== 'tool-subpages') continue
    
    // Scan all toolbar tools for sub-page candidates not already listed
    const toolbarConfig = getToolbarConfig()
    const allTools = toolbarConfig?.tools || {}
    const mode = getCurrentMode() || 'default'
    const actions = getActionsForMode(mode)
    const remainingItems = []

    for (const [toolId, tool] of Object.entries(allTools)) {
      if (usedToolIds.has(toolId)) continue
      const state = getToolbarToolState(toolId)
      if (state === 'disabled' || state === 'hidden') continue
      if (tool.disabled) continue
      if (isHiddenInPalette(tool, basePath)) continue

      const label = tool.label || tool.ariaLabel || toolId
      const excluded = isExcludedByRoute(tool)

      // Route-excluded tools show as disabled with hint
      if (excluded) {
        remainingItems.push({
          id: `cfg:${section.id}:${toolId}`,
          children: <><span>{label}</span><span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.5 }}>Not available on this page</span></>,
          keywords: [label, toolId].filter(Boolean),
          showType: false,
          disabled: true,
        })
        continue
      }

      // Tools with submenu children
      if (tool.render === 'submenu' || tool.render === 'menu') {
        const action = actions.find(a => a.toolKey === toolId)
        if (action?.type === 'submenu') {
          const children = getActionChildren(action.id)
          if (children.length > 0) {
            const pageId = `tool:${toolId}`
            toolMenus.push({
              id: pageId, label, title: label,
              keywords: [label, toolId].filter(Boolean),
              options: children.map(child => ({ label: child.label, execute: child.execute })),
            })
            remainingItems.push({
              id: `cfg:${section.id}:${toolId}`,
              children: label,
              keywords: [label, toolId].filter(Boolean),
              showType: false,
              onClick: () => onNavigateToPage?.(pageId),
              closeOnSelect: false,
            })
            continue
          }
        }
        // Declarative options
        if (tool.options?.length > 0) {
          const pageId = `tool:${toolId}`
          toolMenus.push({
            id: pageId, label, title: label,
            keywords: [label, toolId].filter(Boolean),
            options: tool.options.map(opt => ({ label: opt.label, toolHandler: tool.handler || `core:${toolId}`, value: opt.value })),
          })
          remainingItems.push({
            id: `cfg:${section.id}:${toolId}`,
            children: label,
            keywords: [label, toolId].filter(Boolean),
            showType: false,
            onClick: () => onNavigateToPage?.(pageId),
            closeOnSelect: false,
          })
          continue
        }
      }

      // Inline actions (e.g. toggle-chrome for hide toolbars)
      if (tool.inlineAction === 'toggle-chrome') {
        remainingItems.push({
          id: `cfg:${section.id}:${toolId}`,
          children: label,
          keywords: [label, toolId, 'hide', 'show', 'toolbar'].filter(Boolean),
          showType: false,
          onClick: () => {
            document.documentElement.classList.toggle('storyboard-chrome-hidden')
          },
        })
        continue
      }

      if (tool.inlineAction === 'open-palette') {
        // Skip — no point opening the palette from within itself
        continue
      }

      // Any remaining tools (all surfaces)
      if (tool.render === 'link' && tool.url) {
        remainingItems.push({
          id: `cfg:${section.id}:${toolId}`,
          children: label,
          keywords: [label, toolId].filter(Boolean),
          showType: false,
          onClick: () => { window.location.href = tool.url },
        })
      } else {
        // Menu tools: close palette and click the toolbar button to open the menu
        if (tool.render === 'menu') {
          const ariaLabel = tool.ariaLabel || tool.label || toolId
          remainingItems.push({
            id: `cfg:${section.id}:${toolId}`,
            children: label,
            keywords: [label, toolId].filter(Boolean),
            showType: false,
            onClick: () => {
              // Find and click the toolbar button
              setTimeout(() => {
                const btn = document.querySelector(`[aria-label="${ariaLabel}"]`)
                if (btn) btn.click()
              }, 100)
            },
          })
        } else {
          // Fallback: click toolbar button or execute action
          const action = actions.find(a => a.toolKey === toolId)
          const ariaLabel = tool.ariaLabel || tool.label || toolId
          remainingItems.push({
            id: `cfg:${section.id}:${toolId}`,
            children: label,
            keywords: [label, toolId].filter(Boolean),
            showType: false,
            onClick: action
              ? () => executeAction(action.id)
              : () => {
                  setTimeout(() => {
                    const btn = document.querySelector(`[aria-label="${ariaLabel}"]`)
                    if (btn) btn.click()
                  }, 100)
                },
          })
        }
      }
    }

    // Also include any toolMenus sub-pages not yet listed
    for (const menu of toolMenus) {
      const menuToolId = menu.id?.replace('tool:', '')
      if (usedToolIds.has(menuToolId)) continue
      if (remainingItems.some(i => i.id === `cfg:${section.id}:${menuToolId}`)) continue
      remainingItems.push({
        id: `cfg:${section.id}:${menuToolId || menu.id}`,
        children: menu.label || menu.id,
        keywords: menu.keywords || [menu.label || menu.id],
        showType: false,
        onClick: () => onNavigateToPage?.(menu.id),
        closeOnSelect: false,
      })
    }

    if (remainingItems.length === 0) continue
    groups.push({
      heading: section.title,
      id: `cfg:${section.id}`,
      items: remainingItems,
    })
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
      { id: 'create:canvas', children: 'Canvas', keywords: ['create', 'canvas', 'new', 'board'], showType: false, onClick: () => onCreateAction?.('Canvas') },
      { id: 'create:prototype', children: 'Prototype', keywords: ['create', 'prototype', 'new', 'page'], showType: false, onClick: () => onCreateAction?.('Prototype') },
      { id: 'create:component', children: 'Component', keywords: ['create', 'component', 'new', 'story'], showType: false, onClick: () => onCreateAction?.('Component') },
      { id: 'create:flow', children: 'Prototype Flow', keywords: ['create', 'flow', 'new', 'data'], showType: false, onClick: () => onCreateAction?.('Flow') },
      { id: 'create:page', children: 'Prototype Page', keywords: ['create', 'page', 'new'], showType: false, onClick: () => onCreateAction?.('Page') },
    ]
    return { group: { heading: section.title, id: `cfg:${section.id}`, items: createItems } }
  }

  // --- Create widget source (all canvas widget types) ---
  if (section.source === 'create-widget') {
    const isLocalDev = typeof window !== 'undefined' && window.__SB_LOCAL_DEV__ === true
    if (!isLocalDev) return null
    const isCanvasRoute = typeof window !== 'undefined' && window.location.pathname.includes('/canvas/')
    if (!isCanvasRoute) return null
    const hiddenTypes = new Set(['link-preview', 'image', 'figma-embed', 'codepen-embed', 'story', 'terminal-read'])
    const items = Object.entries(widgetTypes).filter(([type]) => !hiddenTypes.has(type)).map(([type, def]) => ({
      id: `create-widget:${type}`,
      children: def.label,
      keywords: ['add', 'widget', 'create', type, def.label.toLowerCase()],
      showType: false,
      onClick: () => {
        document.dispatchEvent(new CustomEvent('storyboard:canvas:add-widget', { detail: { type } }))
      },
    }))
    return { group: { heading: section.title, id: `cfg:${section.id}`, items } }
  }

  // --- Starred source (reads from viewfinder localStorage) ---
  if (section.source === 'starred') {
    const STARRED_KEY = 'sb-viewfinder-starred'
    let starredIds = []
    try { starredIds = JSON.parse(localStorage.getItem(STARRED_KEY)) || [] } catch {}
    if (starredIds.length === 0) return null

    const index = buildPrototypeIndex()
    // Build a lookup map of all artifacts
    const artifactMap = new Map()
    const allProtos = [...index.prototypes]
    for (const folder of index.folders) {
      allProtos.push(...folder.prototypes)
      if (folder.canvases) folder.canvases.forEach(c => artifactMap.set(`canvas:${c.dirName}`, { ...c, _type: 'canvas' }))
    }
    for (const c of index.canvases) artifactMap.set(`canvas:${c.dirName}`, { ...c, _type: 'canvas' })
    for (const p of allProtos) artifactMap.set(`proto:${p.dirName}`, { ...p, _type: 'prototype' })

    const items = []
    for (const id of starredIds) {
      const artifact = artifactMap.get(id)
      if (!artifact) continue
      const route = artifact._type === 'canvas'
        ? `${prefix}/canvas/${artifact.dirName}`
        : artifact.isExternal
          ? artifact.externalUrl
          : `${prefix}/${artifact.dirName}`
      items.push({
        id: `starred:${id}`,
        children: artifact.name,
        keywords: ['starred', 'star', artifact.name.toLowerCase()],
        showType: false,
        onClick: () => {
          if (artifact.isExternal) {
            window.open(route, '_blank')
          } else {
            window.location.href = route
          }
        },
      })
    }
    if (items.length === 0) return null
    return { group: { heading: section.title, id: `cfg:${section.id}`, items } }
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
 * Otherwise include all command-palette tools.
 *
 * toolIds format: ["theme", "flows"] or [{ id: "theme", label: "Change theme" }]
 */
function buildToolsSection(section, prefix, onNavigateToPage) {
  const toolbarConfig = getToolbarConfig()
  const tools = toolbarConfig?.tools || {}
  const mode = getCurrentMode() || 'default'
  const actions = getActionsForMode(mode)
  const basePath = prefix || '/'

  let entries = []

  if (section.toolIds && section.toolIds.length > 0) {
    for (const entry of section.toolIds) {
      const toolId = typeof entry === 'string' ? entry : entry.id
      const customLabel = typeof entry === 'object' ? entry.label : null
      const tool = tools[toolId]
      if (!tool) continue
      const state = getToolbarToolState(toolId)
      if (state === 'disabled' || state === 'hidden') continue
      if (isHiddenInPalette(tool, basePath)) continue
      entries.push({ toolId, tool, label: customLabel || tool.label || toolId })
    }
  } else {
    for (const [toolId, tool] of Object.entries(tools)) {
      if (tool.surface !== 'command-palette') continue
      const state = getToolbarToolState(toolId)
      if (state === 'disabled' || state === 'hidden') continue
      if (isHiddenInPalette(tool, basePath)) continue
      entries.push({ toolId, tool, label: tool.label || toolId })
    }
  }

  if (entries.length === 0) return null

  const items = []
  const subPages = []

  for (const { toolId, tool, label } of entries) {
    // Inline actions
    if (tool.inlineAction === 'toggle-chrome') {
      const isHidden = document.documentElement.classList.contains('storyboard-chrome-hidden')
      items.push({
        id: `cfg:${section.id}:${toolId}`,
        children: <span style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{label}</span>
          <span>{isHidden ? '✓' : ''}</span>
        </span>,
        keywords: [label, toolId, 'hide', 'show', 'toolbar'].filter(Boolean),
        showType: false,
        onClick: () => {
          document.documentElement.classList.toggle('storyboard-chrome-hidden')
          setRefreshKey(k => k + 1)
        },
      })
      continue
    }

    if (tool.inlineAction === 'open-palette') {
      items.push({
        id: `cfg:${section.id}:${toolId}`,
        children: label,
        keywords: [label, toolId, 'command', 'palette', 'search'].filter(Boolean),
        showType: false,
        onClick: () => {
          document.dispatchEvent(new CustomEvent('storyboard:open-palette'))
        },
      })
      continue
    }

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
              type: child.type,
              active: child.active,
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

      // Menu tool without sub-items or options — click toolbar button
      const ariaLabel = tool.ariaLabel || tool.label || toolId
      items.push({
        id: `cfg:${section.id}:${toolId}`,
        children: label,
        keywords: [label, toolId].filter(Boolean),
        showType: false,
        onClick: () => {
          setTimeout(() => {
            const btn = document.querySelector(`[aria-label="${ariaLabel}"]`)
            if (btn) btn.click()
          }, 100)
        },
      })
      continue
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
    usedToolIds: entries.map(e => e.toolId),
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
 * Build a map of author → artifacts from the prototype index.
 * Returns { authorIndex: Map<lowercase-author, { author, items[] }> }
 */
function buildAuthorIndex(prefix) {
  const index = buildPrototypeIndex()
  const authorMap = new Map()

  function addItem(author, item) {
    const key = author.toLowerCase()
    if (!authorMap.has(key)) authorMap.set(key, { author, items: [] })
    authorMap.get(key).items.push(item)
  }

  function processAuthors(authors, item) {
    if (!authors) return
    const list = Array.isArray(authors) ? authors : [authors]
    for (const a of list) if (a) addItem(a, item)
  }

  for (const p of index.prototypes) {
    processAuthors(p.author, { name: p.name, route: `${prefix}/${p.dirName}`, id: p.dirName, type: 'Prototype' })
  }
  for (const f of index.folders) {
    for (const p of f.prototypes) {
      processAuthors(p.author, { name: p.name, route: `${prefix}/${p.dirName}`, id: p.dirName, type: 'Prototype' })
    }
    if (f.canvases) {
      for (const c of f.canvases) {
        processAuthors(c.author, { name: c.name, route: `${prefix}${c.route}`, id: c.dirName, type: 'Canvas' })
      }
    }
  }
  for (const c of index.canvases) {
    processAuthors(c.author, { name: c.name, route: `${prefix}${c.route}`, id: c.dirName, type: 'Canvas' })
  }

  return authorMap
}

/**
 * Build the JSON structure for react-cmdk from all data providers.
 * Entirely config-driven — all sections come from commandPalette.sections.
 */
function buildPaletteItems(basePath, onCreateAction, onNavigateToPage) {
  const base = (basePath || '/').replace(/\/+$/, '')
  const prefix = base === '/' ? '' : base

  const { groups, toolMenus } = buildConfigSections(prefix, onNavigateToPage, onCreateAction)
  const authorIndex = buildAuthorIndex(prefix)

  return { groups, toolMenus, authorIndex }
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
  const [authorIndex, setAuthorIndex] = useState(new Map())
  const [activePage, setActivePage] = useState('root')
  const [createType, setCreateType] = useState(null)
  const [currentTheme, setCurrentTheme] = useState(() => getTheme())
  const [refreshKey, setRefreshKey] = useState(0)

  // Keep currentTheme in sync when theme changes
  useEffect(() => {
    const handler = (e) => setCurrentTheme(e.detail.theme)
    document.addEventListener('storyboard:theme:changed', handler)
    return () => document.removeEventListener('storyboard:theme:changed', handler)
  }, [])

  function handleCreateAction(type) {
    setOpen(false)
    requestAnimationFrame(() => setCreateType(type))
  }

  function handleNavigateToPage(pageId) {
    setSearch('')
    setActivePage(pageId)
  }

  // Listen for Cmd+K directly to toggle the palette
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const built = buildPaletteItems(basePath, handleCreateAction, handleNavigateToPage)
        setItems(built.groups)
        setToolMenus(built.toolMenus)
        setAuthorIndex(built.authorIndex)
        setSearch('')
        setActivePage('root')
        setOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [basePath])

  // Listen for toggle/open events from toolbar buttons (e.g. CommandPaletteTrigger)
  useEffect(() => {
    function handleToggle() {
      setOpen(prev => {
        if (!prev) {
          // Use setTimeout to set items after open state is committed
          setTimeout(() => {
            const built = buildPaletteItems(basePath, handleCreateAction, handleNavigateToPage)
            setItems(built.groups)
            setToolMenus(built.toolMenus)
            setAuthorIndex(built.authorIndex)
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
      setAuthorIndex(built.authorIndex)
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

  // Rebuild palette items when a toggle is clicked (refreshKey changes)
  useEffect(() => {
    if (refreshKey === 0) return
    const built = buildPaletteItems(basePath, handleCreateAction, handleNavigateToPage)
    setItems(built.groups)
    setToolMenus(built.toolMenus)
  }, [refreshKey, basePath])

  const handleChangeOpen = useCallback((value) => {
    if (!value) {
      setOpen(false)
      setActivePage('root')
    }
  }, [])

  // Flatten sub-page options into searchable groups so they appear in root search
  const subPageGroups = useMemo(() => {
    return toolMenus.map(menu => ({
      heading: menu.label || menu.title || menu.id,
      id: `subpage:${menu.id}`,
      items: (menu.options || []).map((opt, i) => ({
        id: `subpage:${menu.id}:${i}`,
        children: opt.type === 'toggle'
          ? <span style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}><span>{opt.label}</span><span>{opt.active ? '✓' : ''}</span></span>
          : opt.toolHandler === 'core:theme' && opt.value === currentTheme
            ? <span style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}><span>{opt.label}</span><span>✓</span></span>
            : opt.label,
        keywords: [opt.label, menu.label || menu.id],
        showType: false,
        onClick: () => {
          if (opt.execute) {
            opt.execute()
          } else if (opt.toolHandler === 'core:theme' && opt.value) {
            setTheme(opt.value)
          } else if (opt.action) {
            executeAction(opt.action, opt.value)
          }
          if (opt.type === 'toggle') {
            setRefreshKey(k => k + 1)
          } else {
            setOpen(false)
            setActivePage('root')
          }
        },
      })),
    })).filter(g => g.items.length > 0)
  }, [toolMenus, currentTheme, refreshKey])

  const filteredItems = useMemo(() => {
    const base = filterItems(items, search)
    if (!search) return base
    const matchingSub = filterItems(subPageGroups, search)
    const result = [...base, ...matchingSub]

    // Author search: match usernames against author index
    const q = search.toLowerCase()
    const authorQ = q.startsWith('@') ? q.slice(1) : q
    for (const [key, { author, items: authorItems }] of authorIndex) {
      if (!key.includes(authorQ)) continue
      // Avoid duplicates with already-shown artifact items
      const shownIds = new Set(result.flatMap(g => g.items.map(i => i.id)))
      const uniqueItems = authorItems.filter(item => !shownIds.has(`author:${item.id}`))
      if (uniqueItems.length === 0) continue
      result.push({
        heading: `Artifacts by @${author}`,
        id: `author:${key}`,
        items: uniqueItems.map(item => ({
          id: `author:${item.id}`,
          children: (
            <span style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{item.name}</span>
              <span style={{ fontSize: '12px', color: 'var(--fgColor-muted, #999)' }}>{item.type}</span>
            </span>
          ),
          keywords: [item.name, item.id, item.type, author, `@${author}`],
          showType: false,
          onClick: () => {
            trackRecent(item.type.toLowerCase(), item.id, item.name)
            window.location.href = item.route
          },
        })),
      })
    }

    return result
  }, [items, search, subPageGroups, authorIndex])

  // Remove consecutive separators and leading/trailing separators
  const deduplicatedItems = useMemo(() => {
    const result = []
    for (const item of filteredItems) {
      const isSep = item.id?.startsWith('cfg:sep')
      if (isSep && (result.length === 0 || result[result.length - 1].id?.startsWith('cfg:sep'))) continue
      result.push(item)
    }
    // Remove trailing separator
    while (result.length > 0 && result[result.length - 1].id?.startsWith('cfg:sep')) result.pop()
    return result
  }, [filteredItems])

  // Items without separators — used for keyboard navigation indexing
  const navigableItems = useMemo(
    () => deduplicatedItems.filter(list => !list.id?.startsWith('cfg:sep')),
    [deduplicatedItems]
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
        {deduplicatedItems.length ? (
          deduplicatedItems.map((list) => (
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
                {opt.toolHandler === 'core:theme' && opt.value === currentTheme
                  ? <span style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}><span>{opt.label}</span><span>✓</span></span>
                  : opt.label}
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
    <BranchBar basePath={basePath} />
    <AuthModal />
    </>
  )
}
