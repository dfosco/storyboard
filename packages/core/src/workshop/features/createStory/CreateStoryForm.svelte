<!--
  CreateStoryForm — workshop form for creating a new .story.jsx/.tsx file.
  Scaffolds a story file via the canvas server API.
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
  let location = $state('canvas')
  let format = $state('jsx')

  let submitting = $state(false)
  let error: string | null = $state(null)
  let success: string | null = $state(null)
  let createdPath: string | null = $state(null)

  // Pre-fill canvasId from the active canvas (set by CanvasPage bridge)
  let canvasId = $state('')

  const kebabName = $derived(
    name.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/[\s_]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
  )

  const nameError = $derived(
    name.trim() && !kebabName ? 'Name must contain at least one alphanumeric character'
    : name.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kebabName) ? 'Name must be kebab-case'
    : null
  )

  const filePreview = $derived(
    kebabName ? `${kebabName}.story.${format}` : ''
  )

  const canSubmit = $derived(!!kebabName && !nameError && !submitting)

  const STORY_SUCCESS_KEY = 'sb-story-created'

  function getApiUrl() {
    const basePath = (window as any).__STORYBOARD_BASE_PATH__ || '/'
    return basePath.replace(/\/$/, '') + '/_storyboard/canvas'
  }

  onMount(() => {
    // Read active canvas ID from the bridge state (window, not sessionStorage)
    try {
      const bridgeState = (window as any).__storyboardCanvasBridgeState
      if (bridgeState?.canvasId) canvasId = bridgeState.canvasId
      else if (bridgeState?.name) canvasId = bridgeState.name
    } catch {}

    // Restore success state after Vite full-reload
    try {
      const saved = sessionStorage.getItem(STORY_SUCCESS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        success = parsed.success
        createdPath = parsed.path
        sessionStorage.removeItem(STORY_SUCCESS_KEY)
      }
    } catch {}
  })

  async function submit() {
    if (!canSubmit) return
    submitting = true; error = null; success = null; createdPath = null
    try {
      const res = await fetch(getApiUrl() + '/create-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kebabName,
          location,
          format,
          canvasName: location === 'canvas' ? canvasId : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { error = data.error || 'Failed to create story'; return }
      success = `Created ${data.path}`
      createdPath = data.path
      // Persist for toast after Vite reload
      try {
        sessionStorage.setItem(STORY_SUCCESS_KEY, JSON.stringify({
          success: `Created ${data.name}.story.${format}`,
          path: data.path,
        }))
      } catch {}
    } catch (err: any) { error = err.message || 'Network error' } finally { submitting = false }
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter' && canSubmit) submit() }
</script>

<Panel.Header>
  <Panel.Title>Create story</Panel.Title>
  <Panel.Close />
</Panel.Header>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="p-4 pt-2 space-y-3" onkeydown={handleKeydown}>
  <div class="space-y-1">
    <Label for="sb-story-name">Component name</Label>
    <Input id="sb-story-name" placeholder="e.g. user-card" autocomplete="off" spellcheck="false" bind:value={name} />
    {#if nameError}<p class="text-sm text-destructive">{nameError}</p>{/if}
    {#if filePreview}<p class="text-xs text-muted-foreground">File: <code class="px-1 py-0.5 bg-muted rounded font-mono text-foreground text-xs">{filePreview}</code></p>{/if}
  </div>

  <fieldset class="space-y-1.5">
    <Label>Location</Label>
    <div class="flex flex-col gap-1.5">
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input type="radio" name="sb-story-location" value="canvas" bind:group={location} class="accent-primary" />
        This canvas directory
      </label>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input type="radio" name="sb-story-location" value="components" bind:group={location} class="accent-primary" />
        <code class="text-xs bg-muted px-1 py-0.5 rounded">src/components/</code>
      </label>
    </div>
  </fieldset>

  <fieldset class="space-y-1.5">
    <Label>Format</Label>
    <div class="flex gap-3">
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input type="radio" name="sb-story-format" value="jsx" bind:group={format} class="accent-primary" />
        JSX
      </label>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input type="radio" name="sb-story-format" value="tsx" bind:group={format} class="accent-primary" />
        TSX
      </label>
    </div>
  </fieldset>

  {#if error}<Alert.Root variant="destructive"><Alert.Description>{error}</Alert.Description></Alert.Root>{/if}
  {#if success}
    <Alert.Root>
      <Alert.Description class="text-success">
        {success}
        {#if createdPath}
          <br /><span class="text-xs text-muted-foreground">To edit your component, go to <code class="px-1 py-0.5 bg-muted rounded font-mono text-xs">{createdPath}</code></span>
        {/if}
      </Alert.Description>
    </Alert.Root>
  {/if}
</div>

<Panel.Footer>
  <Button variant="outline" onclick={onClose}>Cancel</Button>
  <Button onclick={submit} disabled={!canSubmit}>{submitting ? 'Creating\u2026' : 'Create'}</Button>
</Panel.Footer>
