<!--
  CreatePrototypeForm — workshop form for creating a new prototype.

  Fetches available folders and partials from the server API, then
  submits the form to create a full prototype scaffold (directory,
  prototype.json, index.jsx, optional flow).
-->

<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    onClose?: () => void
  }

  let { onClose }: Props = $props()

  let name = $state('')
  let title = $state('')
  let titleTouched = $state(false)
  let folder = $state('')
  let partial = $state('')
  let author = $state('')
  let description = $state('')
  let createFlow = $state(false)

  interface Partial {
    directory: string
    name: string
    globals?: string[]
  }

  let folders: string[] = $state([])
  let partials: Partial[] = $state([])
  let loading = $state(true)
  let submitting = $state(false)
  let error: string | null = $state(null)
  let success: string | null = $state(null)

  const kebabName = $derived(
    name
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  )

  const autoTitle = $derived(
    kebabName
      ? kebabName
          .split('-')
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .join('')
          .replace(/([A-Z])/g, ' $1')
          .trim()
      : ''
  )

  const displayTitle = $derived(titleTouched ? title : autoTitle)

  const routePreview = $derived(kebabName ? `/${kebabName}` : '')

  const nameError = $derived(
    name.trim() && !kebabName
      ? 'Name must contain at least one alphanumeric character'
      : name.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(kebabName)
        ? 'Name must be kebab-case (lowercase letters, numbers, hyphens)'
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
        if (data.partials?.length) {
          partials = data.partials
          partial = partials[0].name
        }
      }
    } catch {
      // Use defaults
    } finally {
      loading = false
    }
  })

  function handleTitleInput(e: Event) {
    const target = e.target as HTMLInputElement
    title = target.value
    titleTouched = true
  }

  function handleTitleBlur() {
    if (!title.trim()) {
      titleTouched = false
    }
  }

  async function submit() {
    if (!canSubmit) return
    submitting = true
    error = null
    success = null

    try {
      const res = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: kebabName,
          title: displayTitle,
          folder: folder || undefined,
          recipe: partial,
          author: author.trim() || undefined,
          description: description.trim() || undefined,
          createFlow,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        error = data.error || 'Failed to create prototype'
        return
      }

      success = `Created ${data.path}`

      // Navigate after HMR picks up the new files
      setTimeout(() => {
        const base = document.querySelector('base')?.href || '/'
        window.location.href = base + data.route.slice(1)
      }, 1500)
    } catch (err: any) {
      error = err.message || 'Network error'
    } finally {
      submitting = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && canSubmit) {
      submit()
    }
  }
</script>

<div class="sb-workshop-modal sb-bg ba sb-b-default br3 sb-shadow">
  <div class="modal-header">
    <h2 class="ma0 f5 fw6 sb-fg">Create prototype</h2>
    <button class="close-btn" onclick={onClose} aria-label="Close">&times;</button>
  </div>

  <div class="modal-body" onkeydown={handleKeydown}>
    <!-- Name -->
    <label class="field-label" for="sb-proto-name">Name</label>
    <input
      class="sb-input field-input"
      id="sb-proto-name"
      type="text"
      placeholder="e.g. my-prototype"
      autocomplete="off"
      spellcheck="false"
      bind:value={name}
    />
    {#if nameError}
      <div class="field-error">{nameError}</div>
    {/if}

    {#if routePreview}
      <div class="route-preview">
        Route: <code class="route-code">{routePreview}</code>
      </div>
    {/if}

    <!-- Title -->
    <label class="field-label" for="sb-proto-title">Title</label>
    <input
      class="sb-input field-input"
      id="sb-proto-title"
      type="text"
      placeholder={autoTitle || 'Auto-derived from name'}
      value={displayTitle}
      oninput={handleTitleInput}
      onblur={handleTitleBlur}
    />

    <!-- Folder + Partial row -->
    <div class="field-row">
      <div class="field-col">
        <label class="field-label" for="sb-proto-folder">Folder</label>
        <select class="sb-input sb-select" id="sb-proto-folder" bind:value={folder} disabled={loading}>
          <option value="">None</option>
          {#each folders as f}
            <option value={f}>{f}</option>
          {/each}
        </select>
      </div>
      <div class="field-col">
        <label class="field-label" for="sb-proto-partial">Template</label>
        <select class="sb-input sb-select" id="sb-proto-partial" bind:value={partial} disabled={loading || partials.length === 0}>
          {#each partials as r}
            <option value={r.name}>{r.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Author -->
    <label class="field-label" for="sb-proto-author">Author</label>
    <input
      class="sb-input field-input"
      id="sb-proto-author"
      type="text"
      placeholder="GitHub handle(s), comma-separated"
      bind:value={author}
    />

    <!-- Description -->
    <label class="field-label" for="sb-proto-desc">Description</label>
    <input
      class="sb-input field-input"
      id="sb-proto-desc"
      type="text"
      placeholder="Optional description"
      bind:value={description}
    />

    <!-- Create flow checkbox -->
    <label class="checkbox-label">
      <input type="checkbox" bind:checked={createFlow} />
      Create flow file
    </label>

    <!-- Error / success -->
    {#if error}
      <div class="message message-error">{error}</div>
    {/if}
    {#if success}
      <div class="message message-success">{success}</div>
    {/if}

    <!-- Actions -->
    <div class="actions">
      <button class="sb-workshop-btn sb-workshop-btn-secondary" onclick={onClose}>Cancel</button>
      <button
        class="sb-workshop-btn sb-workshop-btn-primary"
        onclick={submit}
        disabled={!canSubmit}
      >
        {submitting ? 'Creating…' : 'Create'}
      </button>
    </div>
  </div>
</div>

<style>
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--sb-border-muted, #21262d);
  }

  .close-btn {
    font-size: 20px;
    line-height: 1;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--sb-fg-muted, #8b949e);
    cursor: pointer;
  }
  .close-btn:hover {
    background-color: var(--sb-bg-muted, #21262d);
  }

  .modal-body {
    padding: 16px;
  }

  .field-label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    font-size: 13px;
    color: var(--sb-fg, #e6edf3);
  }

  .field-input {
    width: 100%;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    display: block;
    margin-bottom: 12px;
    box-sizing: border-box;
  }

  .field-error {
    margin: -8px 0 12px;
    font-size: 12px;
    color: var(--sb-fg-danger, #f85149);
  }

  .route-preview {
    margin: -8px 0 12px;
    font-size: 12px;
    color: var(--sb-fg-muted, #8b949e);
    line-height: 1.4;
  }

  .route-code {
    display: inline-block;
    padding: 1px 6px;
    background: var(--sb-bg-muted, #21262d);
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
    color: var(--sb-fg, #e6edf3);
    font-size: 12px;
  }

  .field-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .field-col {
    flex: 1;
  }

  .field-col .field-label {
    margin-bottom: 4px;
  }

  :global(.sb-select) {
    width: 100%;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    appearance: auto;
    cursor: pointer;
    box-sizing: border-box;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: var(--sb-fg, #e6edf3);
    cursor: pointer;
  }

  .message {
    margin-bottom: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
  }

  .message-error {
    color: var(--sb-fg-danger, #f85149);
    background: rgba(209, 36, 47, 0.1);
  }

  .message-success {
    color: var(--sb-fg-success, #3fb950);
    background: rgba(35, 134, 54, 0.1);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
