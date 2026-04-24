/**
 * CanvasCreateMenu — CoreUIBar dropdown for adding widgets to the active canvas.
 * Dispatches custom events to bridge to React canvas system.
 * Only visible when a canvas page is active.
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
import { Button } from './lib/components/ui/button/index.js'
import { Input } from './lib/components/ui/input/index.js'
import { Label } from './lib/components/ui/label/index.js'
import Icon from './svelte-plugin-ui/components/Icon.jsx'
import { getConfig } from './configStore.js'

const widgetTypes = [
  { type: 'sticky-note', label: 'Sticky Note' },
  { type: 'markdown', label: 'Markdown' },
  { type: 'prompt', label: 'Prompt' },
  { type: 'prototype', label: 'Prototype' },
  { type: 'terminal', label: 'Terminal' },
]

function getApiUrl() {
  const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
  return basePath.replace(/\/$/, '') + '/_storyboard/canvas'
}

export default function CanvasCreateMenu({ config = {}, data, canvasName = '', zoom, tabindex }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState('menu')
  const [stories, setStories] = useState([])
  const [storiesLoaded, setStoriesLoaded] = useState(false)

  const showAgentsInMenu = useMemo(() => {
    const canvasConfig = getConfig('canvas')
    return canvasConfig?.showAgentsInAddMenu !== false
  }, [])

  // Read agent configs from canvas.agents
  const agents = useMemo(() => {
    if (!showAgentsInMenu) return []
    const canvasConfig = getConfig('canvas')
    const agentsConfig = canvasConfig?.agents
    if (!agentsConfig || typeof agentsConfig !== 'object') return []
    return Object.entries(agentsConfig).map(([id, cfg]) => ({
      id,
      label: cfg.label || id,
      startupCommand: cfg.startupCommand || id,
      defaultWidth: cfg.defaultWidth,
      defaultHeight: cfg.defaultHeight,
    }))
  }, [])

  // Create form state
  const [createName, setCreateName] = useState('')
  const [createLocation, setCreateLocation] = useState('canvas')
  const [createFormat, setCreateFormat] = useState('jsx')
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [notificationPath, setNotificationPath] = useState(null)

  const kebabName = useMemo(
    () => createName.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/[\s_]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, ''),
    [createName]
  )
  const nameError = useMemo(
    () => createName.trim() && !kebabName ? 'Name must contain at least one alphanumeric character' : null,
    [createName, kebabName]
  )
  const filePreview = useMemo(
    () => kebabName ? `${kebabName}.story.${createFormat}` : '',
    [kebabName, createFormat]
  )
  const canSubmit = !!kebabName && !nameError && !submitting

  function resetCreateForm() {
    setCreateName('')
    setCreateLocation('canvas')
    setCreateFormat('jsx')
    setCreateError(null)
    setSubmitting(false)
  }

  async function loadStories() {
    try {
      const res = await fetch(getApiUrl() + '/stories')
      if (res.ok) {
        const d = await res.json()
        setStories(d.stories || [])
      }
    } catch { /* ignore */ }
    setStoriesLoaded(true)
  }

  // Load stories when menu opens
  useEffect(() => {
    if (menuOpen) loadStories()
  }, [menuOpen])

  // Focus first menu item when dropdown opens on menu view
  useEffect(() => {
    if (menuOpen && view === 'menu') {
      requestAnimationFrame(() => {
        const item = document.querySelector('[data-bits-dropdown-menu-content] [data-bits-dropdown-menu-item]:not([data-disabled])')
        item?.focus()
      })
    }
  }, [menuOpen, view])

  // Reset when menu closes on menu view
  useEffect(() => {
    if (!menuOpen && view === 'menu') {
      resetCreateForm()
    }
  }, [menuOpen, view])

  function addWidget(type, props) {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:add-widget', {
      detail: { type, canvasName, props }
    }))
    setMenuOpen(false)
  }

  function addStoryWidget(storyId) {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:add-story-widget', {
      detail: { storyId, canvasName }
    }))
    setMenuOpen(false)
  }

  function showCreateForm() {
    resetCreateForm()
    setView('create')
  }

  const viewRef = useRef(view)
  viewRef.current = view

  async function submitCreate() {
    if (!canSubmit) return
    setSubmitting(true)
    setCreateError(null)
    try {
      const bridgeState = window.__storyboardCanvasBridgeState
      const activeCanvasId = bridgeState?.canvasId || bridgeState?.name || canvasName

      const res = await fetch(getApiUrl() + '/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kebabName,
          location: createLocation,
          format: createFormat,
          canvasName: createLocation === 'canvas' ? activeCanvasId : undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) { setCreateError(d.error || 'Failed to create component'); setSubmitting(false); return }

      addStoryWidget(d.name)

      setNotificationPath(d.path)
      setView('notification')
      setMenuOpen(true)
      setStoriesLoaded(false)

      setTimeout(() => {
        if (viewRef.current === 'notification') {
          setMenuOpen(false)
          setView('menu')
          setNotificationPath(null)
        }
      }, 6000)
    } catch (err) {
      setCreateError(err.message || 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenChange(open) {
    setMenuOpen(open)
    if (!open && view !== 'menu') {
      setView('menu')
      setNotificationPath(null)
      resetCreateForm()
    }
  }

  return (
    <DropdownMenu.Root open={menuOpen} onOpenChange={handleOpenChange}>
      <DropdownMenu.Trigger asChild>
        <TriggerButton
          active={menuOpen}
          size="icon-xl"
          aria-label={config.ariaLabel || 'Add widget'}
          tabIndex={tabindex}
        >
          {config.icon ? (
            <Icon name={config.icon} size={16} {...(config.meta || {})} />
          ) : '+'}
        </TriggerButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="top"
        align="start"
        sideOffset={16}
        className="min-w-[180px]"
        style={config.menuWidth ? { width: config.menuWidth } : undefined}
        onInteractOutside={(e) => { if (view === 'create') e.preventDefault() }}
      >
        {view === 'menu' && (
          <>
            <DropdownMenu.Label>Add to canvas</DropdownMenu.Label>
            {widgetTypes.map((wt) => (
              <DropdownMenu.Item key={wt.type} onClick={() => addWidget(wt.type)}>
                {wt.label}
              </DropdownMenu.Item>
            ))}

            {agents.length > 0 && (
              <>
                <DropdownMenu.Separator />
                <DropdownMenu.Label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="agents" size={12} />
                    Agents
                  </span>
                </DropdownMenu.Label>
                {agents.map((agent) => (
                  <DropdownMenu.Item key={agent.id} onClick={() => addWidget('agent', {
                    agentId: agent.id,
                    startupCommand: agent.startupCommand,
                    ...(agent.defaultWidth ? { width: agent.defaultWidth } : {}),
                    ...(agent.defaultHeight ? { height: agent.defaultHeight } : {}),
                  })}>
                    {agent.label}
                  </DropdownMenu.Item>
                ))}
              </>
            )}

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Component</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent className="min-w-[200px] max-h-[320px] overflow-y-auto">
                <button
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground w-full text-left bg-transparent border-none"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); showCreateForm() }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="font-medium">Create new component…</span>
                </button>
                {stories.length > 0 && (
                  <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Label>Existing stories</DropdownMenu.Label>
                    {stories.map((story) => (
                      <DropdownMenu.Item key={story.name} onClick={() => addStoryWidget(story.name)}>
                        <span className="flex flex-col">
                          <span>{story.name}</span>
                          <span className="text-xs text-muted-foreground">{story.path}</span>
                        </span>
                      </DropdownMenu.Item>
                    ))}
                  </>
                )}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>

            <DropdownMenu.Separator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground flex flex-row items-baseline">
              <span className="inline-flex w-2 h-2 rounded-full mr-1.5" style={{ background: 'hsl(212, 92%, 45%)' }}></span>
              Only available in dev environment
            </div>
          </>
        )}

        {view === 'create' && (
          <div
            className="p-3 space-y-3 min-w-[280px]"
            onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) submitCreate(); if (e.key === 'Escape') setView('menu') }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Create component</span>
              <button className="text-muted-foreground hover:text-foreground text-xs bg-transparent border-none cursor-pointer p-0.5" onClick={() => setView('menu')}>← Back</button>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sb-create-comp-name" className="text-xs">Name</Label>
              <Input id="sb-create-comp-name" placeholder="e.g. user-card" autoComplete="off" spellCheck={false} value={createName} onChange={(e) => setCreateName(e.target.value)} className="h-8 text-sm" />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              {filePreview && <p className="text-xs text-muted-foreground">{filePreview}</p>}
            </div>

            <fieldset className="space-y-1">
              <Label className="text-xs">Location</Label>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="sb-create-location" value="canvas" checked={createLocation === 'canvas'} onChange={() => setCreateLocation('canvas')} className="accent-primary" />
                  This canvas directory
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="sb-create-location" value="components" checked={createLocation === 'components'} onChange={() => setCreateLocation('components')} className="accent-primary" />
                  <code className="text-xs">src/components/</code>
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-1">
              <Label className="text-xs">Format</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="sb-create-format" value="jsx" checked={createFormat === 'jsx'} onChange={() => setCreateFormat('jsx')} className="accent-primary" />
                  JSX
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="sb-create-format" value="tsx" checked={createFormat === 'tsx'} onChange={() => setCreateFormat('tsx')} className="accent-primary" />
                  TSX
                </label>
              </div>
            </fieldset>

            {createError && <p className="text-xs text-destructive">{createError}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setView('menu')}>Cancel</Button>
              <Button size="sm" onClick={submitCreate} disabled={!canSubmit}>{submitting ? 'Creating…' : 'Create'}</Button>
            </div>
          </div>
        )}

        {view === 'notification' && (
          <div className="p-3 min-w-[260px] space-y-1">
            <p className="text-sm font-medium">✓ Component added to canvas</p>
            {notificationPath && (
              <>
                <p className="text-xs text-muted-foreground">To edit your component, go to</p>
                <code className="text-xs block bg-muted px-2 py-1 rounded">{notificationPath}</code>
              </>
            )}
          </div>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
