<!--
  CommandPalette — fuzzy-searchable command palette overlay.
  Replaces the dropdown CommandMenu with a Dialog-based palette.
  Triggered by ⌘K or toolbar button click.
-->

<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui'
  import { cn } from './lib/utils/index.js'
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { modeState } from './svelte-plugin-ui/stores/modeStore.js'
  import { buildAllItems, searchPalette } from './paletteProviders.js'
  import type { Snippet } from 'svelte'

  interface ShortcutConfig {
    key: string
    label: string
  }

  interface Props {
    basePath?: string
    open?: boolean
    tabindex?: number
    icon?: string
    iconMeta?: Record<string, unknown>
    shortcuts?: { openCommandMenu?: ShortcutConfig; hideChrome?: ShortcutConfig }
  }

  let {
    basePath = '/',
    open = $bindable(false),
    tabindex,
    icon = 'iconoir/key-command',
    iconMeta = {},
    shortcuts = {},
  }: Props = $props()

  let query = $state('')
  let selectedIndex = $state(0)
  let inputEl: HTMLInputElement | null = $state(null)
  let listEl: HTMLElement | null = $state(null)

  // Cache datasets on open, only re-score on query change
  let dataset = $state<ReturnType<typeof buildAllItems> | null>(null)

  const results = $derived.by(() => {
    if (!dataset) return []
    return searchPalette(dataset, query)
  })

  // Flat list of all selectable items for keyboard navigation
  const flatItems = $derived.by(() => {
    const items: any[] = []
    for (const group of results) {
      for (const item of group.items) {
        items.push(item)
      }
    }
    return items
  })

  // Clamp selection when results change
  $effect(() => {
    if (selectedIndex >= flatItems.length) {
      selectedIndex = Math.max(0, flatItems.length - 1)
    }
  })

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      // Build datasets fresh each time the palette opens
      dataset = buildAllItems($modeState.mode, basePath)
      query = ''
      selectedIndex = 0
      // Focus input after dialog renders
      requestAnimationFrame(() => inputEl?.focus())
    } else {
      dataset = null
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        selectedIndex = (selectedIndex + 1) % Math.max(1, flatItems.length)
        scrollSelectedIntoView()
        break
      case 'ArrowUp':
        e.preventDefault()
        selectedIndex = (selectedIndex - 1 + flatItems.length) % Math.max(1, flatItems.length)
        scrollSelectedIntoView()
        break
      case 'Enter':
        e.preventDefault()
        if (flatItems[selectedIndex]) {
          executeItem(flatItems[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        open = false
        break
    }
  }

  function executeItem(item: any) {
    open = false
    // Run action after dialog closes so navigation doesn't fight the overlay
    requestAnimationFrame(() => {
      if (item.action) item.action()
    })
  }

  function scrollSelectedIntoView() {
    requestAnimationFrame(() => {
      const el = listEl?.querySelector('[data-selected="true"]')
      if (el) el.scrollIntoView({ block: 'nearest' })
    })
  }

  // Track cumulative item index across groups for selection highlighting
  function getItemGlobalIndex(groupIdx: number, itemIdx: number): number {
    let count = 0
    for (let g = 0; g < groupIdx; g++) {
      count += results[g].items.length
    }
    return count + itemIdx
  }
</script>

<!-- Trigger button — stays in the toolbar -->
<TriggerButton
  active={open}
  class="text-2xl"
  aria-label="Command Menu"
  {tabindex}
  onclick={() => { open = !open }}
><Icon name={icon} size={16} {...iconMeta} /></TriggerButton>

<!-- Palette dialog -->
<DialogPrimitive.Root bind:open onOpenChange={handleOpenChange}>
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      class="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50"
    />
    <DialogPrimitive.Content
      data-slot="command-palette-content"
      class={cn(
        'font-sans bg-background text-foreground',
        'fixed top-[20%] left-1/2 z-50 w-full max-w-md -translate-x-1/2',
        'rounded-xl ring-1 ring-border shadow-lg',
        'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 duration-100',
        'flex flex-col overflow-hidden outline-none',
      )}
      onkeydown={handleKeydown}
    >
      <!-- Hidden title for accessibility -->
      <DialogPrimitive.Title class="sr-only">Command Palette</DialogPrimitive.Title>

      <!-- Search input -->
      <div class="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <svg class="size-4 shrink-0 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          placeholder="Search commands, prototypes, canvases..."
          class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          oninput={() => { selectedIndex = 0 }}
          data-slot="command-palette-input"
        />
        {#if shortcuts.openCommandMenu}
          <kbd class="hidden sm:inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            {shortcuts.openCommandMenu.label}
          </kbd>
        {/if}
      </div>

      <!-- Results list -->
      <div
        bind:this={listEl}
        class="max-h-[min(300px,50vh)] overflow-y-auto p-1.5"
        role="listbox"
        aria-label="Command palette results"
      >
        {#if flatItems.length === 0 && query}
          <div class="px-3 py-6 text-center text-sm text-muted-foreground">
            No results for "{query}"
          </div>
        {:else}
          {#each results as group, gi (group.category)}
            <div class="mb-1" role="group" aria-label={group.category}>
              <div class="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
                {group.category}
              </div>
              {#each group.items as item, ii (item.id)}
                {@const globalIdx = getItemGlobalIndex(gi, ii)}
                {@const isSelected = globalIdx === selectedIndex}
                <button
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  class={cn(
                    'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left cursor-default transition-colors',
                    isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  )}
                  onmouseenter={() => { selectedIndex = globalIdx }}
                  onclick={() => executeItem(item)}
                >
                  <span class="flex-1 truncate">{item.label}</span>
                  {#if item.hint}
                    <span class="text-xs text-muted-foreground truncate max-w-[120px]">{item.hint}</span>
                  {/if}
                  {#if item.localOnly}
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-600 shrink-0"></span>
                  {/if}
                </button>
              {/each}
            </div>
          {/each}
        {/if}
      </div>

      <!-- Footer -->
      {#if shortcuts.hideChrome}
        <div class="border-t border-border px-3 py-1.5 flex items-center gap-3">
          <span class="text-[10px] text-muted-foreground font-mono">{shortcuts.hideChrome.label}</span>
        </div>
      {/if}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
