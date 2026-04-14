<!--
  CanvasCreateMenu — CoreUIBar dropdown for adding widgets to the active canvas.
  Dispatches custom events to bridge Svelte → React.
  Only visible when a canvas page is active.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
  import * as Panel from './lib/components/ui/panel/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import CreateStoryForm from './workshop/features/createStory/CreateStoryForm.svelte'

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
    { type: 'prototype', label: 'Prototype embed' },
  ]

  interface StoryEntry {
    name: string
    path: string
    exports: string[]
  }

  let menuOpen = $state(false)
  let createStoryOpen = $state(false)
  let stories: StoryEntry[] = $state([])
  let storiesLoaded = $state(false)

  function getApiUrl() {
    const basePath = (window as any).__STORYBOARD_BASE_PATH__ || '/'
    return basePath.replace(/\/$/, '') + '/_storyboard/canvas'
  }

  async function loadStories() {
    if (storiesLoaded) return
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

  function openCreateStory() {
    menuOpen = false
    createStoryOpen = true
  }
</script>

<DropdownMenu.Root bind:open={menuOpen}>
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

  <DropdownMenu.Content side="top" align="start" sideOffset={16} class="min-w-[180px]" style={config.menuWidth ? `width: ${config.menuWidth}` : ''}>
    <DropdownMenu.Label>Add to canvas</DropdownMenu.Label>
    {#each widgetTypes as wt (wt.type)}
      <DropdownMenu.Item onclick={() => addWidget(wt.type)}>
        {wt.label}
      </DropdownMenu.Item>
    {/each}

    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>Component</DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent class="min-w-[200px] max-h-[320px] overflow-y-auto">
        <DropdownMenu.Item onclick={openCreateStory}>
          <span class="font-medium">Create new component…</span>
        </DropdownMenu.Item>
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
  </DropdownMenu.Content>
</DropdownMenu.Root>

{#if createStoryOpen}
  <Panel.Root open={true} onOpenChange={(open) => { if (!open) createStoryOpen = false }}>
    <Panel.Content>
      <CreateStoryForm onClose={() => { createStoryOpen = false }} />
    </Panel.Content>
  </Panel.Root>
{/if}
