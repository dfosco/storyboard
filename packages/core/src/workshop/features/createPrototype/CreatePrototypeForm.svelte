<!--
  CreatePrototypeForm — workshop form for creating a new prototype.
  Uses shadcn-svelte components for all form elements.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Alert from '$lib/components/ui/alert/index.js'

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

  interface Partial { directory: string; name: string; globals?: string[] }

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
  const canSubmit = $derived(!!kebabName && !nameError && !submitting)

  function getApiUrl() {
    const basePath = document.querySelector('base')?.getAttribute('href') || '/'
    return basePath.replace(/\/$/, '') + '/_storyboard/workshop/prototypes'
  }

  onMount(async () => {
    try {
      const res = await fetch(getApiUrl())
      if (res.ok) {
        const data = await res.json()
        folders = data.folders || []
        if (data.partials?.length) { partials = data.partials; partial = partials[0].name }
      }
    } catch { /* defaults */ } finally { loading = false }
  })

  function handleTitleInput(e: Event) { title = (e.target as HTMLInputElement).value; titleTouched = true }
  function handleTitleBlur() { if (!title.trim()) titleTouched = false }

  async function submit() {
    if (!canSubmit) return
    submitting = true; error = null; success = null
    try {
      const res = await fetch(getApiUrl(), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: kebabName, title: displayTitle, folder: folder || undefined, recipe: partial, author: author.trim() || undefined, description: description.trim() || undefined, createFlow }),
      })
      const data = await res.json()
      if (!res.ok) { error = data.error || 'Failed to create prototype'; return }
      success = `Created ${data.path}`
      setTimeout(() => { const base = document.querySelector('base')?.href || '/'; window.location.href = base + data.route.slice(1) }, 1500)
    } catch (err: any) { error = err.message || 'Network error' } finally { submitting = false }
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter' && canSubmit) submit() }
</script>

<Dialog.Header>
  <Dialog.Title>Create prototype</Dialog.Title>
</Dialog.Header>

<div class="p-4 space-y-3" onkeydown={handleKeydown}>
  <div class="space-y-1">
    <Label for="sb-proto-name">Name</Label>
    <Input id="sb-proto-name" placeholder="e.g. my-prototype" autocomplete="off" spellcheck="false" bind:value={name} />
    {#if nameError}<p class="text-sm text-destructive">{nameError}</p>{/if}
    {#if routePreview}<p class="text-xs text-muted-foreground">Route: <code class="px-1 py-0.5 bg-muted rounded font-mono text-foreground text-xs">{routePreview}</code></p>{/if}
  </div>

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
    <div class="space-y-1">
      <Label for="sb-proto-partial">Template</Label>
      <select class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" id="sb-proto-partial" bind:value={partial} disabled={loading || partials.length === 0}>
        {#each partials as r}<option value={r.name}>{r.name}</option>{/each}
      </select>
    </div>
  </div>

  <div class="space-y-1">
    <Label for="sb-proto-author">Author</Label>
    <Input id="sb-proto-author" placeholder="GitHub handle(s), comma-separated" bind:value={author} />
  </div>

  <div class="space-y-1">
    <Label for="sb-proto-desc">Description</Label>
    <Input id="sb-proto-desc" placeholder="Optional description" bind:value={description} />
  </div>

  <div class="flex items-center gap-2">
    <Checkbox id="sb-proto-flow" bind:checked={createFlow} />
    <Label for="sb-proto-flow" class="text-sm font-normal cursor-pointer">Create flow file</Label>
  </div>

  {#if error}<Alert.Root variant="destructive"><Alert.Description>{error}</Alert.Description></Alert.Root>{/if}
  {#if success}<Alert.Root><Alert.Description class="text-success">{success}</Alert.Description></Alert.Root>{/if}
</div>

<Dialog.Footer>
  <Button variant="outline" onclick={onClose}>Cancel</Button>
  <Button onclick={submit} disabled={!canSubmit}>{submitting ? 'Creating\u2026' : 'Create'}</Button>
</Dialog.Footer>
