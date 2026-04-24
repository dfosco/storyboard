<!--
  CreateCanvasForm — workshop form for creating a new canvas.
  Uses shadcn-svelte components for all form elements.
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { Button } from '../../../lib/components/ui/button/index.js'
  import { Input } from '../../../lib/components/ui/input/index.js'
  import { Label } from '../../../lib/components/ui/label/index.js'
  import { Checkbox } from '../../../lib/components/ui/checkbox/index.js'
  import * as Panel from '../../../lib/components/ui/panel/index.js'
  import * as Alert from '../../../lib/components/ui/alert/index.js'

  interface Props { onClose?: () => void }
  let { onClose }: Props = $props()

  let name = $state('')
  let title = $state('')
  let titleTouched = $state(false)
  let description = $state('')
  let folder = $state('')
  let grid = $state(true)

  let folders: string[] = $state([])
  let loading = $state(true)
  let submitting = $state(false)
  let error: string | null = $state(null)
  let success: string | null = $state(null)
  let createdRoute: string | null = $state(null)

  const kebabName = $derived(
    name.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/[\s_]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
  )
  const autoTitle = $derived(
    kebabName ? kebabName.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : ''
  )
  const displayTitle = $derived(titleTouched ? title : autoTitle)
  const routePreview = $derived(kebabName ? `/canvas/${kebabName}` : '')
  const nameError = $derived(
    name.trim() && !kebabName ? 'Name must contain at least one alphanumeric character'
    : name.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kebabName) ? 'Name must be kebab-case'
    : null
  )
  const canSubmit = $derived(!!kebabName && !nameError && !submitting)

  function getApiUrl() {
    const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
    return basePath.replace(/\/$/, '') + '/_storyboard/canvas'
  }

  const CANVAS_SUCCESS_KEY = 'sb-canvas-created'

  onMount(async () => {
    // Restore success state after Vite's full-reload on file creation
    try {
      const saved = sessionStorage.getItem(CANVAS_SUCCESS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        success = parsed.success
        createdRoute = parsed.route
        sessionStorage.removeItem(CANVAS_SUCCESS_KEY)
      }
    } catch {}

    try {
      const res = await fetch(getApiUrl() + '/folders')
      if (res.ok) {
        const data = await res.json()
        folders = data.folders || []
      }
    } catch { /* defaults */ } finally { loading = false }
  })

  function handleTitleInput(e: Event) { title = (e.target as HTMLInputElement).value; titleTouched = true }
  function handleTitleBlur() { if (!title.trim()) titleTouched = false }

  async function submit() {
    if (!canSubmit) return
    submitting = true; error = null; success = null; createdRoute = null
    try {
      const res = await fetch(getApiUrl() + '/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: kebabName, title: displayTitle, description: description || undefined, folder: folder || undefined, grid }),
      })
      const data = await res.json()
      if (!res.ok) { error = data.error || 'Failed to create canvas'; return }
      success = `Created ${data.path}`
      createdRoute = data.route
      // Persist success state — Vite does a full-reload when new files are created
      try {
        sessionStorage.setItem(CANVAS_SUCCESS_KEY, JSON.stringify({ success, route: createdRoute }))
      } catch {}
    } catch (err: any) { error = err.message || 'Network error' } finally { submitting = false }
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter' && canSubmit) submit() }
</script>

<Panel.Header>
  <Panel.Title>Create canvas</Panel.Title>
  <Panel.Close />
</Panel.Header>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="p-4 pt-2 space-y-3" onkeydown={handleKeydown}>
  <div class="space-y-1">
    <Label for="sb-canvas-name">Name</Label>
    <Input id="sb-canvas-name" placeholder="e.g. design-overview" autocomplete="off" spellcheck="false" bind:value={name} />
    {#if nameError}<p class="text-sm text-destructive">{nameError}</p>{/if}
    {#if routePreview}<p class="text-xs text-muted-foreground mt-1.5">Route: <code class="px-1 py-0.5 bg-muted rounded font-mono text-foreground text-xs">{routePreview}</code></p>{/if}
  </div>

  <div class="space-y-1">
    <Label for="sb-canvas-description">Description <span class="text-muted-foreground font-normal">(optional)</span></Label>
    <Input id="sb-canvas-description" placeholder="A brief description of this canvas" bind:value={description} />
  </div>

  <div class="space-y-1">
    <Label for="sb-canvas-folder">Folder</Label>
    <select class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" id="sb-canvas-folder" bind:value={folder} disabled={loading}>
      <option value="">None</option>
      {#each folders as f}<option value={f}>{f}</option>{/each}
    </select>
  </div>

  <div class="flex items-center gap-2">
    <Checkbox id="sb-canvas-grid" bind:checked={grid} />
    <Label for="sb-canvas-grid" class="text-sm font-normal cursor-pointer">Show grid</Label>
  </div>

  {#if error}<Alert.Root variant="destructive"><Alert.Description>{error}</Alert.Description></Alert.Root>{/if}
  {#if success}<Alert.Root><Alert.Description class="text-success">{success}{#if createdRoute} — <a href={createdRoute} class="underline font-medium">Go to canvas</a>{/if}</Alert.Description></Alert.Root>{/if}
</div>

<Panel.Footer>
  <Button variant="outline" onclick={onClose}>Cancel</Button>
  <Button onclick={submit} disabled={!canSubmit}>{submitting ? 'Creating\u2026' : 'Create'}</Button>
</Panel.Footer>
