<!--
  CanvasCreateMenu — CoreUIBar dropdown for adding widgets to the active canvas.
  Dispatches custom events to bridge Svelte → React.
  Only visible when a canvas page is active.
-->

<script lang="ts">
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
  import { Button } from './lib/components/ui/button/index.js'
  import { Input } from './lib/components/ui/input/index.js'
  import { Label } from './lib/components/ui/label/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    config?: any
    data?: any
    canvasName?: string
    zoom?: number
    tabindex?: number
  }

  let { config = {}, data, canvasName = '', zoom, tabindex }: Props = $props()

  const widgetTypes = [
    { type: 'sticky-note', label: 'Sticky Note' },
    { type: 'markdown', label: 'Markdown' },
    { type: 'prototype', label: 'Prototype' },
  ]

  interface StoryEntry {
    name: string
    path: string
    exports: string[]
  }

  type View = 'menu' | 'create' | 'notification'

  let menuOpen = $state(false)
  let view: View = $state('menu')
  let stories: StoryEntry[] = $state([])
  let storiesLoaded = $state(false)

  // Create form state
  let createName = $state('')
  let createLocation = $state('canvas')
  let createFormat = $state('jsx')
  let submitting = $state(false)
  let createError: string | null = $state(null)
  let notificationPath: string | null = $state(null)

  const kebabName = $derived(
    createName.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/[\s_]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
  )
  const nameError = $derived(
    createName.trim() && !kebabName ? 'Name must contain at least one alphanumeric character' : null
  )
  const filePreview = $derived(
    kebabName ? `${kebabName}.story.${createFormat}` : ''
  )
  const canSubmit = $derived(!!kebabName && !nameError && !submitting)

  function getApiUrl() {
    const basePath = (window as any).__STORYBOARD_BASE_PATH__ || '/'
    return basePath.replace(/\/$/, '') + '/_storyboard/canvas'
  }

  async function loadStories() {
    try {
      const res = await fetch(getApiUrl() + '/stories')
      if (res.ok) {
        const data = await res.json()
        stories = data.stories || []
      }
    } catch { /* ignore */ }
    storiesLoaded = true
  }

  // Load stories when menu opens
  $effect(() => {
    if (menuOpen) loadStories()
  })

  // Focus the first menu item when the dropdown opens
  $effect(() => {
    if (menuOpen && view === 'menu') {
      requestAnimationFrame(() => {
        const item = document.querySelector('[data-bits-dropdown-menu-content] [data-bits-dropdown-menu-item]:not([data-disabled])') as HTMLElement
        item?.focus()
      })
    }
  })

  // Reset view when menu closes (but not during view transitions)
  $effect(() => {
    if (!menuOpen && view === 'menu') {
      resetCreateForm()
    }
  })

  function resetCreateForm() {
    createName = ''
    createLocation = 'canvas'
    createFormat = 'jsx'
    createError = null
    submitting = false
  }

  function addWidget(type: string) {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:add-widget', {
      detail: { type, canvasName }
    }))
    menuOpen = false
  }

  function addStoryWidget(storyId: string) {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:add-story-widget', {
      detail: { storyId, canvasName }
    }))
    menuOpen = false
  }

  function showCreateForm() {
    resetCreateForm()
    view = 'create'
  }

  async function submitCreate() {
    if (!canSubmit) return
    submitting = true; createError = null
    try {
      const bridgeState = (window as any).__storyboardCanvasBridgeState
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
      const data = await res.json()
      if (!res.ok) { createError = data.error || 'Failed to create component'; submitting = false; return }

      // Add the new component to the canvas
      addStoryWidget(data.name)

      // Show inline notification
      notificationPath = data.path
      view = 'notification'
      menuOpen = true

      // Refresh story list for next time
      storiesLoaded = false

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        if (view === 'notification') {
          menuOpen = false
          view = 'menu'
          notificationPath = null
        }
      }, 6000)
    } catch (err: any) { createError = err.message || 'Network error' } finally { submitting = false }
  }
</script>

<DropdownMenu.Root bind:open={menuOpen} onOpenChange={(open) => {
  if (!open && view !== 'menu') {
    // User dismissed the panel — reset everything
    view = 'menu'
    notificationPath = null
    resetCreateForm()
  }
}}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <TriggerButton
        active={menuOpen}
        size="icon-xl"
        aria-label={config.ariaLabel || 'Add widget'}
        {tabindex}
        {...props}
      >
        {#if config.icon}
          <Icon name={config.icon} size={16} {...(config.meta || {})} />
        {:else}
          +
        {/if}
      </TriggerButton>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content side="top" align="start" sideOffset={16} class="min-w-[180px]" style={config.menuWidth ? `width: ${config.menuWidth}` : ''} onInteractOutside={(e) => { if (view === 'create') e.preventDefault() }}>
    {#if view === 'menu'}
      <DropdownMenu.Label>Add to canvas</DropdownMenu.Label>
      {#each widgetTypes as wt (wt.type)}
        <DropdownMenu.Item onclick={() => addWidget(wt.type)}>
          {wt.label}
        </DropdownMenu.Item>
      {/each}

      <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger>Component</DropdownMenu.SubTrigger>
        <DropdownMenu.SubContent class="min-w-[200px] max-h-[320px] overflow-y-auto">
          <button
            class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground w-full text-left bg-transparent border-none"
            onclick={(e) => { e.preventDefault(); e.stopPropagation(); showCreateForm() }}
            onpointerdown={(e) => e.stopPropagation()}
          >
            <span class="font-medium">Create new component…</span>
          </button>
          {#if stories.length > 0}
            <DropdownMenu.Separator />
            <DropdownMenu.Label>Existing stories</DropdownMenu.Label>
            {#each stories as story (story.name)}
              <DropdownMenu.Item onclick={() => addStoryWidget(story.name)}>
                <span class="flex flex-col">
                  <span>{story.name}</span>
                  <span class="text-xs text-muted-foreground">{story.path}</span>
                </span>
              </DropdownMenu.Item>
            {/each}
          {/if}
        </DropdownMenu.SubContent>
      </DropdownMenu.Sub>

      <DropdownMenu.Separator />
      <div class="px-2 py-1.5 text-xs text-muted-foreground flex flex-row items-baseline"><span class="inline-flex w-2 h-2 rounded-full mr-1.5" style="background: hsl(212, 92%, 45%)"></span>Only available in dev environment</div>

    {:else if view === 'create'}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="p-3 space-y-3 min-w-[280px]" onkeydown={(e) => { if (e.key === 'Enter' && canSubmit) submitCreate(); if (e.key === 'Escape') { view = 'menu' } }} onclick={(e) => e.stopPropagation()} onpointerdown={(e) => e.stopPropagation()}>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Create component</span>
          <button class="text-muted-foreground hover:text-foreground text-xs bg-transparent border-none cursor-pointer p-0.5" onclick={() => { view = 'menu' }}>← Back</button>
        </div>

        <div class="space-y-1">
          <Label for="sb-create-comp-name" class="text-xs">Name</Label>
          <Input id="sb-create-comp-name" placeholder="e.g. user-card" autocomplete="off" spellcheck="false" bind:value={createName} class="h-8 text-sm" />
          {#if nameError}<p class="text-xs text-destructive">{nameError}</p>{/if}
          {#if filePreview}<p class="text-xs text-muted-foreground">{filePreview}</p>{/if}
        </div>

        <fieldset class="space-y-1">
          <Label class="text-xs">Location</Label>
          <div class="flex flex-col gap-1">
            <label class="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="sb-create-location" value="canvas" bind:group={createLocation} class="accent-primary" />
              This canvas directory
            </label>
            <label class="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="sb-create-location" value="components" bind:group={createLocation} class="accent-primary" />
              <code class="text-xs">src/components/</code>
            </label>
          </div>
        </fieldset>

        <fieldset class="space-y-1">
          <Label class="text-xs">Format</Label>
          <div class="flex gap-3">
            <label class="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="sb-create-format" value="jsx" bind:group={createFormat} class="accent-primary" />
              JSX
            </label>
            <label class="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="sb-create-format" value="tsx" bind:group={createFormat} class="accent-primary" />
              TSX
            </label>
          </div>
        </fieldset>

        {#if createError}<p class="text-xs text-destructive">{createError}</p>{/if}

        <div class="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onclick={() => { view = 'menu' }}>Cancel</Button>
          <Button size="sm" onclick={submitCreate} disabled={!canSubmit}>{submitting ? 'Creating…' : 'Create'}</Button>
        </div>
      </div>

    {:else if view === 'notification'}
      <div class="p-3 min-w-[260px] space-y-1">
        <p class="text-sm font-medium">✓ Component added to canvas</p>
        {#if notificationPath}
          <p class="text-xs text-muted-foreground">To edit your component, go to</p>
          <code class="text-xs block bg-muted px-2 py-1 rounded">{notificationPath}</code>
        {/if}
      </div>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
