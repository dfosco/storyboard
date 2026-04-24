<!--
  CreateFlowForm — workshop form for creating a new flow data file.
  Uses shadcn-svelte components for all form elements.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { Button } from '../../../lib/components/ui/button/index.js'
  import { Input } from '../../../lib/components/ui/input/index.js'
  import { Label } from '../../../lib/components/ui/label/index.js'
  import * as Panel from '../../../lib/components/ui/panel/index.js'
  import * as Alert from '../../../lib/components/ui/alert/index.js'

  interface Props {
    onClose?: () => void
  }
  let { onClose }: Props = $props()

  let name = $state('')
  let title = $state('')
  let titleTouched = $state(false)
  let selectedPrototype = $state('')
  let description = $state('')
  let copyFrom = $state('')
  let startingPage = $state('')
  let newPagePath = $state('')
  let newPageTemplate = $state('')
  const CREATE_NEW_PAGE_VALUE = '__create_new_page__'

  interface PrototypeEntry { name: string; folder?: string; routes?: string[] }
  interface FlowEntry { name: string; title: string; path: string; prototype?: string; folder?: string; route?: string }
  interface PartialEntry {
    id: string
    name: string
    kind: 'template' | 'recipe'
    scope: 'global' | 'prototype'
    prototype?: string
    folder?: string
  }

  let prototypes: PrototypeEntry[] = $state([])
  let flows: FlowEntry[] = $state([])
  let partials: PartialEntry[] = $state([])
  let loading = $state(true)
  let submitting = $state(false)
  let error: string | null = $state(null)
  let success: string | null = $state(null)

  const kebabName = $derived(
    name.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/[\s_]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
  )
  const autoTitle = $derived(
    kebabName ? kebabName.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : ''
  )
  const displayTitle = $derived(titleTouched ? title : autoTitle)
  const filePreview = $derived(kebabName ? `${kebabName}.flow.json` : '')
  const nameError = $derived(
    name.trim() && !kebabName ? 'Name must contain at least one alphanumeric character'
    : name.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kebabName) ? 'Name must be kebab-case'
    : null
  )
  const selectedProtoEntry = $derived(
    selectedPrototype ? prototypes.find(p => p.name === selectedPrototype) : null
  )
  const copyFromFlows = $derived(
    selectedPrototype
      ? flows.filter((f) => {
          if (f.prototype !== selectedPrototype) return false
          const flowFolder = f.folder || ''
          const selectedFolder = selectedProtoEntry?.folder || ''
          return flowFolder === selectedFolder
        })
      : []
  )
  const prototypeRoutes = $derived(selectedProtoEntry?.routes || [])
  const showNewPageFields = $derived(startingPage === CREATE_NEW_PAGE_VALUE)
  const newPagePrefix = $derived(selectedPrototype ? `/${selectedPrototype}/` : '/prototype-name/')
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
  const startingPageError = $derived(
    showNewPageFields && !newPagePath.trim()
      ? 'Please provide a new page path'
      : null
  )
  const canSubmit = $derived(
    !!kebabName &&
    !!selectedPrototype &&
    !nameError &&
    !startingPageError &&
    !submitting
  )

  function getApiUrl() {
    const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
    return basePath.replace(/\/$/, '') + '/_storyboard/workshop/flows'
  }

  onMount(async () => {
    try {
      const res = await fetch(getApiUrl())
      if (res.ok) {
        const data = await res.json()
        prototypes = data.prototypes || []
        flows = data.flows || []
        partials = data.partials || []
      }
    } catch { /* defaults */ } finally { loading = false }
  })

  $effect(() => {
    if (!selectedPrototype) {
      copyFrom = ''
      startingPage = ''
      newPagePath = ''
      newPageTemplate = ''
      return
    }

    const routes = selectedProtoEntry?.routes || []
    if (!startingPage || (startingPage !== CREATE_NEW_PAGE_VALUE && !routes.includes(startingPage))) {
      startingPage = routes[0] || ''
    }

    if (showNewPageFields) {
      if (!newPagePath.startsWith(newPagePrefix)) {
        newPagePath = `${newPagePrefix}new-page`
      }
    }

    const activeSelectionStillValid = copyFrom && copyFromFlows.some((f) => f.path === copyFrom)
    if (activeSelectionStillValid) return

    const matchStartingPage = startingPage && startingPage !== CREATE_NEW_PAGE_VALUE
      ? copyFromFlows.find((f) => f.route === startingPage)
      : null
    copyFrom = matchStartingPage?.path || ''
  })

  $effect(() => {
    if (!newPageTemplate) return
    const stillAvailable = templateChoices.some((choice) => choice.id === newPageTemplate)
    if (!stillAvailable) {
      newPageTemplate = ''
    }
  })

  function handleTitleInput(e: Event) { title = (e.target as HTMLInputElement).value; titleTouched = true }
  function handleTitleBlur() { if (!title.trim()) titleTouched = false }

  async function submit() {
    if (!canSubmit) return
    submitting = true; error = null; success = null
    try {
      const res = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kebabName,
          title: displayTitle,
          prototype: selectedPrototype,
          folder: selectedProtoEntry?.folder || undefined,
          description: description.trim() || undefined,
          copyFrom: copyFrom || undefined,
          startingPage: showNewPageFields ? newPagePath.trim() : (startingPage || undefined),
          createPage: showNewPageFields ? {
            path: newPagePath.trim(),
            template: newPageTemplate || undefined,
          } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { error = data.error || 'Failed to create flow'; return }
      success = `Created ${data.path}`
    } catch (err: any) { error = err.message || 'Network error' } finally { submitting = false }
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter' && canSubmit) submit() }
</script>

<Panel.Header>
  <Panel.Title>Create flow</Panel.Title>
  <Panel.Close />
</Panel.Header>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="p-4 pt-2 space-y-5" onkeydown={handleKeydown}>
  <div class="space-y-1">
    <Label for="sb-flow-name">Name</Label>
    <Input id="sb-flow-name" placeholder="e.g. empty-state" autocomplete="off" spellcheck="false" bind:value={name} />
    {#if nameError}<p class="text-sm text-destructive">{nameError}</p>{/if}
    {#if filePreview}<p class="text-xs text-muted-foreground">File: <code class="px-1 py-0.5 bg-muted rounded font-mono text-foreground text-xs">{filePreview}</code></p>{/if}
  </div>

  <div class="space-y-1">
    <Label for="sb-flow-title">Title</Label>
    <Input id="sb-flow-title" placeholder={autoTitle || 'Auto-derived from name'} value={displayTitle} oninput={handleTitleInput} onblur={handleTitleBlur} />
  </div>

  <div class="space-y-1">
    <Label for="sb-flow-prototype">Prototype</Label>
    <select class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" id="sb-flow-prototype" bind:value={selectedPrototype} disabled={loading}>
      <option value="">Select prototype</option>
      {#each prototypes as p}<option value={p.name}>{p.folder ? `${p.folder} / ${p.name}` : p.name}</option>{/each}
    </select>
  </div>

  <div class="space-y-1">
    <Label for="sb-flow-copy">Copy from existing flow <span class="text-muted-foreground">(optional)</span></Label>
    <select
      class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      id="sb-flow-copy"
      bind:value={copyFrom}
      disabled={loading || !selectedPrototype}
    >
      {#if !selectedPrototype}
        <option value="">Select a prototype first</option>
      {:else}
        <option value="">None</option>
        {#each copyFromFlows as f}<option value={f.path}>{f.title} ({f.name})</option>{/each}
      {/if}
    </select>
  </div>

  <div class="space-y-1">
    <Label for="sb-flow-starting-page">Starting page <span class="text-muted-foreground">(optional)</span></Label>
    <select
      class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      id="sb-flow-starting-page"
      bind:value={startingPage}
      disabled={loading || !selectedPrototype}
    >
      {#if !selectedPrototype}
      <option value="">Select a prototype first</option>
      {:else}
      <option value="">None</option>
      {#each prototypeRoutes as route}
      <option value={route}>{route}</option>
      {/each}
      <option value={CREATE_NEW_PAGE_VALUE}>Create new page</option>
      {/if}
    </select>
    <p class="text-xs text-muted-foreground">Users will be redirected to this page</p>
  </div>
  
  {#if showNewPageFields}
    <div class="space-y-1">
      <Label for="sb-flow-new-page-path">New page path</Label>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground font-mono">{newPagePrefix}</span>
        <Input
          id="sb-flow-new-page-path"
          placeholder="new-page"
          value={newPagePath.startsWith(newPagePrefix) ? newPagePath.slice(newPagePrefix.length) : ''}
          oninput={(e: Event) => {
            const suffix = (e.target as HTMLInputElement).value.replace(/^\/+/, '')
            newPagePath = `${newPagePrefix}${suffix}`
          }}
        />
      </div>
    </div>
    <div class="space-y-1">
        <Label for="sb-flow-new-page-template">Template / recipe</Label>
        <select
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          id="sb-flow-new-page-template"
          bind:value={newPageTemplate}
          disabled={!selectedPrototype}
        >
          <option value="">Blank page</option>
          {#if globalTemplateChoices.length > 0}
            <optgroup label="Global">
              {#each globalTemplateChoices as partial}
                <option value={partial.id}>{partial.name}</option>
              {/each}
            </optgroup>
          {/if}
          {#if localTemplateChoices.length > 0}
            <optgroup label={localTemplateHeading}>
              {#each localTemplateChoices as partial}
                <option value={partial.id}>{partial.name}</option>
              {/each}
            </optgroup>
          {/if}
        </select>
      </div>
      {#if startingPageError}<p class="text-sm text-destructive">{startingPageError}</p>{/if}
    {/if}

  <div class="space-y-1">
    <Label for="sb-flow-desc">Description</Label>
    <Input id="sb-flow-desc" placeholder="Optional description" bind:value={description} />
  </div>

  {#if error}<Alert.Root variant="destructive"><Alert.Description>{error}</Alert.Description></Alert.Root>{/if}
  {#if success}<Alert.Root><Alert.Description class="text-success">{success}</Alert.Description></Alert.Root>{/if}
</div>

<Panel.Footer>
  <Button variant="outline" onclick={onClose}>Cancel</Button>
  <Button onclick={submit} disabled={!canSubmit}>{submitting ? 'Creating\u2026' : 'Create'}</Button>
</Panel.Footer>
