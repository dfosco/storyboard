<!--
  CreatePageForm — workshop form for creating a new page inside a prototype.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { Button } from '../../../lib/components/ui/button/index.js'
  import { Input } from '../../../lib/components/ui/input/index.js'
  import { Label } from '../../../lib/components/ui/label/index.js'
  import * as Panel from '../../../lib/components/ui/panel/index.js'
  import * as DropdownMenu from '../../../lib/components/ui/dropdown-menu/index.js'
  import * as Alert from '../../../lib/components/ui/alert/index.js'

  interface Props { onClose?: () => void }
  let { onClose }: Props = $props()

  interface PrototypeEntry { name: string; folder?: string }
  interface PartialEntry {
    id: string
    name: string
    kind: 'template' | 'recipe'
    scope: 'global' | 'prototype'
    prototype?: string
    folder?: string
  }

  let selectedPrototype = $state('')
  let pagePath = $state('')
  let template = $state('')
  let prototypes: PrototypeEntry[] = $state([])
  let partials: PartialEntry[] = $state([])
  let loading = $state(true)
  let submitting = $state(false)
  let error: string | null = $state(null)
  let success: string | null = $state(null)
  let templateMenuOpen = $state(false)

  const selectedProtoEntry = $derived(
    selectedPrototype ? prototypes.find((p) => p.name === selectedPrototype) : null
  )
  const pagePrefix = $derived(selectedPrototype ? `/${selectedPrototype}/` : '/prototype-name/')
  const pageSuffix = $derived(
    pagePath.startsWith(pagePrefix) ? pagePath.slice(pagePrefix.length) : pagePath
  )
  const canSubmit = $derived(!!selectedPrototype && !!pageSuffix.trim() && !submitting)
  const templateChoices = $derived(
    selectedPrototype
      ? partials.filter((partial) => {
          if (partial.scope === 'global') return true
          return partial.prototype === selectedPrototype && (partial.folder || '') === (selectedProtoEntry?.folder || '')
        })
      : partials.filter((partial) => partial.scope === 'global')
  )
  const globalTemplateChoices = $derived(templateChoices.filter((partial) => partial.scope === 'global'))
  const localTemplateChoices = $derived(
    templateChoices.filter((partial) => partial.scope === 'prototype')
  )
  const localTemplateHeading = $derived(
    selectedPrototype || ''
  )
  const globalTemplates = $derived(globalTemplateChoices.filter((partial) => partial.kind === 'template'))
  const globalRecipes = $derived(globalTemplateChoices.filter((partial) => partial.kind === 'recipe'))
  const localTemplates = $derived(localTemplateChoices.filter((partial) => partial.kind === 'template'))
  const localRecipes = $derived(localTemplateChoices.filter((partial) => partial.kind === 'recipe'))
  const templateLabel = $derived(
    template ? templateChoices.find((choice) => choice.id === template)?.name ?? template : 'Blank page'
  )

  function getApiUrl() {
    const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
    return basePath.replace(/\/$/, '') + '/_storyboard/workshop/pages'
  }

  onMount(async () => {
    try {
      const res = await fetch(getApiUrl())
      if (res.ok) {
        const data = await res.json()
        prototypes = data.prototypes || []
        partials = data.partials || []
      }
    } catch { /* defaults */ } finally { loading = false }
  })

  $effect(() => {
    if (!selectedPrototype) {
      pagePath = ''
      return
    }
    if (!pagePath || !pagePath.startsWith(pagePrefix)) {
      pagePath = `${pagePrefix}new-page`
    }
  })

  $effect(() => {
    if (!template) return
    const stillAvailable = templateChoices.some((choice) => choice.id === template)
    if (!stillAvailable) {
      template = ''
    }
  })

  async function submit() {
    if (!canSubmit) return
    submitting = true; error = null; success = null
    try {
      const res = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prototype: selectedPrototype,
          folder: selectedProtoEntry?.folder || undefined,
          path: pagePath.trim(),
          template: template || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { error = data.error || 'Failed to create page'; return }
      success = `Created ${data.path}`
    } catch (err: any) {
      error = err.message || 'Network error'
    } finally {
      submitting = false
    }
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter' && canSubmit) submit() }
</script>

<Panel.Header>
  <Panel.Title>Create page</Panel.Title>
  <Panel.Close />
</Panel.Header>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="p-4 pt-2 space-y-5" onkeydown={handleKeydown}>
  <div class="space-y-1">
    <Label for="sb-page-prototype">Prototype</Label>
    <select
      class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      id="sb-page-prototype"
      bind:value={selectedPrototype}
      disabled={loading}
    >
      <option value="">Select prototype</option>
      {#each prototypes as p}
        <option value={p.name}>{p.folder ? `${p.folder} / ${p.name}` : p.name}</option>
      {/each}
    </select>
  </div>

  <div class="space-y-1">
    <Label for="sb-page-path">Page path</Label>
    <div class="flex items-center gap-2">
      <span class="text-xs text-muted-foreground font-mono whitespace-nowrap">{pagePrefix}</span>
      <Input
        id="sb-page-path"
        placeholder="new-page"
        value={pageSuffix}
        oninput={(e: Event) => {
          const suffix = (e.target as HTMLInputElement).value.replace(/^\/+/, '')
          pagePath = `${pagePrefix}${suffix}`
        }}
        disabled={!selectedPrototype}
      />
    </div>
  </div>

  <div class="space-y-1">
    <Label>Template / recipe</Label>
    <DropdownMenu.Root bind:open={templateMenuOpen}>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <button
            {...props}
            class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedPrototype}
          >
            <span class={template ? 'text-foreground' : 'text-muted-foreground'}>{templateLabel}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content side="left" align="start" sideOffset={8} class="min-w-[220px]">
        {#if template}
          <DropdownMenu.Item onclick={() => { template = ''; templateMenuOpen = false }}>
            <span class="text-muted-foreground">Blank page</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
        {/if}

        {#if globalTemplates.length > 0}
          <DropdownMenu.Group>
            <DropdownMenu.GroupHeading>Templates</DropdownMenu.GroupHeading>
            {#each globalTemplates as item (item.id)}
              <DropdownMenu.Item onclick={() => { template = item.id; templateMenuOpen = false }}>
                {item.name}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        {/if}

        {#if localTemplates.length > 0}
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            <DropdownMenu.GroupHeading>{localTemplateHeading} / Templates</DropdownMenu.GroupHeading>
            {#each localTemplates as item (item.id)}
              <DropdownMenu.Item onclick={() => { template = item.id; templateMenuOpen = false }}>
                {item.name}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        {/if}

        {#if globalRecipes.length > 0}
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            <DropdownMenu.GroupHeading>Recipes</DropdownMenu.GroupHeading>
            {#each globalRecipes as item (item.id)}
              <DropdownMenu.Item onclick={() => { template = item.id; templateMenuOpen = false }}>
                {item.name}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        {/if}

        {#if localRecipes.length > 0}
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            <DropdownMenu.GroupHeading>{localTemplateHeading} / Recipes</DropdownMenu.GroupHeading>
            {#each localRecipes as item (item.id)}
              <DropdownMenu.Item onclick={() => { template = item.id; templateMenuOpen = false }}>
                {item.name}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  {#if error}<Alert.Root variant="destructive"><Alert.Description>{error}</Alert.Description></Alert.Root>{/if}
  {#if success}<Alert.Root><Alert.Description class="text-success">{success}</Alert.Description></Alert.Root>{/if}
</div>

<Panel.Footer>
  <Button variant="outline" onclick={onClose}>Cancel</Button>
  <Button onclick={submit} disabled={!canSubmit}>{submitting ? 'Creating…' : 'Create page'}</Button>
</Panel.Footer>
