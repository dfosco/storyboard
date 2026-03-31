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

  interface Props { onClose?: () => void }
  let { onClose }: Props = $props()

  let name = $state('')
  let title = $state('')
  let titleTouched = $state(false)
  let selectedPrototype = $state('')
  let author = $state('')
  let description = $state('')
  let copyFrom = $state('')

  interface PrototypeEntry { name: string; folder?: string }
  interface FlowEntry { name: string; title: string; path: string }

  let prototypes: PrototypeEntry[] = $state([])
  let flows: FlowEntry[] = $state([])
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
  const canSubmit = $derived(!!kebabName && !nameError && !submitting)

  const selectedProtoEntry = $derived(
    selectedPrototype ? prototypes.find(p => p.name === selectedPrototype) : null
  )

  function getApiUrl() {
    const basePath = document.querySelector('base')?.getAttribute('href') || '/'
    return basePath.replace(/\/$/, '') + '/_storyboard/workshop/flows'
  }

  onMount(async () => {
    try {
      const res = await fetch(getApiUrl())
      if (res.ok) {
        const data = await res.json()
        prototypes = data.prototypes || []
        flows = data.flows || []
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kebabName,
          title: displayTitle,
          prototype: selectedPrototype || undefined,
          folder: selectedProtoEntry?.folder || undefined,
          author: author.trim() || undefined,
          description: description.trim() || undefined,
          copyFrom: copyFrom || undefined,
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
<div class="p-4 pt-2 space-y-3" onkeydown={handleKeydown}>
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

  <div class="grid grid-cols-2 gap-3">
    <div class="space-y-1">
      <Label for="sb-flow-prototype">Prototype</Label>
      <select class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" id="sb-flow-prototype" bind:value={selectedPrototype} disabled={loading}>
        <option value="">Global</option>
        {#each prototypes as p}<option value={p.name}>{p.folder ? `${p.folder} / ${p.name}` : p.name}</option>{/each}
      </select>
    </div>
    <div class="space-y-1">
      <Label for="sb-flow-copy">Copy from</Label>
      <select class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" id="sb-flow-copy" bind:value={copyFrom} disabled={loading}>
        <option value="">None</option>
        {#each flows as f}<option value={f.path}>{f.title} ({f.name})</option>{/each}
      </select>
    </div>
  </div>

  <div class="space-y-1">
    <Label for="sb-flow-author">Author</Label>
    <Input id="sb-flow-author" placeholder="GitHub handle(s), comma-separated" bind:value={author} />
  </div>

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
