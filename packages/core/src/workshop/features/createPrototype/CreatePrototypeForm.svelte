<!--
  CreatePrototypeForm — workshop form for creating a new prototype.
  Uses shadcn-svelte components for all form elements.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { Button } from '../../../lib/components/ui/button/index.js'
  import { Input } from '../../../lib/components/ui/input/index.js'
  import { Label } from '../../../lib/components/ui/label/index.js'
  import { Checkbox } from '../../../lib/components/ui/checkbox/index.js'
  import * as Panel from '../../../lib/components/ui/panel/index.js'
  import * as DropdownMenu from '../../../lib/components/ui/dropdown-menu/index.js'
  import * as Alert from '../../../lib/components/ui/alert/index.js'

  interface Props { onClose?: () => void }
  let { onClose }: Props = $props()

  let name = $state('')
  let title = $state('')
  let titleTouched = $state(false)
  let folder = $state('')
  let partial = $state('')
  let author = $state('')
  let description = $state('')
  let createFlow = $state(false)
  let isExternal = $state(false)
  let externalUrl = $state('')

  interface Partial {
    id: string
    name: string
    kind: 'template' | 'recipe'
    scope: 'global' | 'prototype'
    prototype?: string
    folder?: string
  }

  let folders: string[] = $state([])
  let partials: Partial[] = $state([])
  let loading = $state(true)
  let submitting = $state(false)
  let error: string | null = $state(null)
  let success: string | null = $state(null)

  const kebabName = $derived(
    name.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/[\s_]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
  )
  const autoTitle = $derived(
    kebabName ? kebabName.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('').replace(/([A-Z])/g, ' $1').trim() : ''
  )
  const displayTitle = $derived(titleTouched ? title : autoTitle)
  const routePreview = $derived(kebabName ? `/${kebabName}` : '')
  const nameError = $derived(
    name.trim() && !kebabName ? 'Name must contain at least one alphanumeric character'
    : name.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kebabName) ? 'Name must be kebab-case'
    : null
  )
  const urlError: string | null = $derived.by(() => {
    if (!isExternal || !externalUrl.trim()) return null
    try {
      const parsed = new URL(externalUrl.trim())
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'Must use http: or https: protocol'
      return null
    } catch {
      return 'Must be a valid URL (e.g. https://example.com)'
    }
  })
  const canSubmit = $derived(!!kebabName && !nameError && !submitting && (!isExternal || (!!externalUrl.trim() && !urlError)))

  const selectedFolderLabel = $derived(folder ? `${folder}.folder` : '')
  const scopedPartials = $derived(
    partials.filter((p) => {
      if (p.scope === 'global') return true
      if (!folder) return false
      return p.folder === folder
    })
  )
  const templateLabel = $derived(
    partial ? scopedPartials.find((p) => p.id === partial)?.name ?? partial : 'No template'
  )
  const templates = $derived(scopedPartials.filter((p) => p.kind === 'template'))
  const recipes = $derived(scopedPartials.filter((p) => p.kind === 'recipe'))
  const globalTemplates = $derived(templates.filter((p) => p.scope === 'global'))
  const globalRecipes = $derived(recipes.filter((p) => p.scope === 'global'))
  const localTemplates = $derived(templates.filter((p) => p.scope === 'prototype'))
  const localRecipes = $derived(recipes.filter((p) => p.scope === 'prototype'))
  let templateMenuOpen = $state(false)

  function getApiUrl() {
    const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
    return basePath.replace(/\/$/, '') + '/_storyboard/workshop/prototypes'
  }

  onMount(async () => {
    try {
      const res = await fetch(getApiUrl())
      if (res.ok) {
        const data = await res.json()
        folders = data.folders || []
        if (data.partials?.length) { partials = data.partials }
      }
    } catch { /* defaults */ } finally { loading = false }
  })

  $effect(() => {
    if (!partial) return
    const stillAvailable = scopedPartials.some((p) => p.id === partial)
    if (!stillAvailable) {
      partial = ''
    }
  })

  function handleTitleInput(e: Event) { title = (e.target as HTMLInputElement).value; titleTouched = true }
  function handleTitleBlur() { if (!title.trim()) titleTouched = false }

  async function submit() {
    if (!canSubmit) return
    submitting = true; error = null; success = null
    try {
      const payload: Record<string, any> = { name: kebabName, title: displayTitle, folder: folder || undefined, author: author.trim() || undefined, description: description.trim() || undefined }
      if (isExternal) {
        payload.url = externalUrl.trim()
      } else {
        payload.recipe = partial || undefined
        payload.createFlow = createFlow
      }
      const res = await fetch(getApiUrl(), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { error = data.error || 'Failed to create prototype'; return }
      success = `Created ${data.path}`
      if (data.isExternal) {
        // External prototype — no local route to navigate to, just close after a moment
        setTimeout(() => onClose?.(), 1500)
      } else {
        setTimeout(() => { const base = (window.__STORYBOARD_BASE_PATH__ || '/').replace(/\/$/, ''); window.location.href = base + data.route }, 1500)
      }
    } catch (err: any) { error = err.message || 'Network error' } finally { submitting = false }
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter' && canSubmit) submit() }
</script>

<Panel.Header>
  <Panel.Title>Create prototype</Panel.Title>
  <Panel.Close />
</Panel.Header>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="p-4 pt-2 space-y-3" onkeydown={handleKeydown}>
  <div class="space-y-1">
    <Label for="sb-proto-name">Name</Label>
    <Input id="sb-proto-name" placeholder="e.g. my-prototype" autocomplete="off" spellcheck="false" bind:value={name} />
    {#if nameError}<p class="text-sm text-destructive">{nameError}</p>{/if}
    {#if routePreview && !isExternal}<p class="text-xs text-muted-foreground">Route: <code class="px-1 py-0.5 bg-muted rounded font-mono text-foreground text-xs">{routePreview}</code></p>{/if}
  </div>

  <div class="flex items-center gap-2">
    <Checkbox id="sb-proto-external" bind:checked={isExternal} />
    <Label for="sb-proto-external" class="text-sm font-normal cursor-pointer">External prototype</Label>
  </div>

  {#if isExternal}
    <div class="space-y-1">
      <Label for="sb-proto-url">URL</Label>
      <Input id="sb-proto-url" placeholder="https://example.com/prototype" autocomplete="off" spellcheck="false" bind:value={externalUrl} />
      {#if urlError}<p class="text-sm text-destructive">{urlError}</p>{/if}
    </div>
  {/if}

  <div class="space-y-1">
    <Label for="sb-proto-title">Title</Label>
    <Input id="sb-proto-title" placeholder={autoTitle || 'Auto-derived from name'} value={displayTitle} oninput={handleTitleInput} onblur={handleTitleBlur} />
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div class="space-y-1">
      <Label for="sb-proto-folder">Folder</Label>
      <select class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" id="sb-proto-folder" bind:value={folder} disabled={loading}>
        <option value="">None</option>
        {#each folders as f}<option value={f}>{f}</option>{/each}
      </select>
    </div>
    {#if !isExternal}
      <div class="space-y-1">
        <Label>Template</Label>
        <DropdownMenu.Root bind:open={templateMenuOpen}>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <button
                {...props}
                class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                <span class={partial ? 'text-foreground' : 'text-muted-foreground'}>{templateLabel}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content side="left" align="start" sideOffset={8} class="min-w-[180px]">
            {#if partial}
              <DropdownMenu.Item onclick={() => { partial = ''; templateMenuOpen = false }}>
                <span class="text-muted-foreground">Clear selection</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
            {/if}

            {#if templates.length > 0}
              <DropdownMenu.Group>
                <DropdownMenu.GroupHeading>Templates</DropdownMenu.GroupHeading>
                  {#each globalTemplates as t (t.id)}
                    <DropdownMenu.Item onclick={() => { partial = t.id; templateMenuOpen = false }}>
                      {t.name}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              {/if}

              {#if localTemplates.length > 0}
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                  <DropdownMenu.GroupHeading>{selectedFolderLabel || 'Prototype local'} / Templates</DropdownMenu.GroupHeading>
                  {#each localTemplates as t (t.id)}
                    <DropdownMenu.Item onclick={() => { partial = t.id; templateMenuOpen = false }}>
                      {t.name}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              {/if}

              {#if globalRecipes.length > 0}
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                  <DropdownMenu.GroupHeading>Recipes</DropdownMenu.GroupHeading>
                  {#each globalRecipes as r (r.id)}
                    <DropdownMenu.Item onclick={() => { partial = r.id; templateMenuOpen = false }}>
                      {r.name}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              {/if}

              {#if localRecipes.length > 0}
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                  <DropdownMenu.GroupHeading>{selectedFolderLabel || 'Prototype local'} / Recipes</DropdownMenu.GroupHeading>
                  {#each localRecipes as r (r.id)}
                    <DropdownMenu.Item onclick={() => { partial = r.id; templateMenuOpen = false }}>
                      {r.name}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
      </div>
    {/if}
  </div>

  <div class="space-y-1">
    <Label for="sb-proto-author">Author</Label>
    <Input id="sb-proto-author" placeholder="GitHub handle(s), comma-separated" bind:value={author} />
  </div>

  <div class="space-y-1">
    <Label for="sb-proto-desc">Description</Label>
    <Input id="sb-proto-desc" placeholder="Optional description" bind:value={description} />
  </div>

  {#if !isExternal}
    <div class="flex items-center gap-2">
      <Checkbox id="sb-proto-flow" bind:checked={createFlow} />
      <Label for="sb-proto-flow" class="text-sm font-normal cursor-pointer">Create flow file</Label>
    </div>
  {/if}

  {#if error}<Alert.Root variant="destructive"><Alert.Description>{error}</Alert.Description></Alert.Root>{/if}
  {#if success}<Alert.Root><Alert.Description class="text-success">{success}</Alert.Description></Alert.Root>{/if}
</div>

<Panel.Footer>
  <Button variant="outline" onclick={onClose}>Cancel</Button>
  <Button onclick={submit} disabled={!canSubmit}>{submitting ? 'Creating\u2026' : 'Create'}</Button>
</Panel.Footer>
