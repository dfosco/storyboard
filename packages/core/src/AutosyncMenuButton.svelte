<!--
  AutosyncMenuButton — toolbar dropdown for automatic git sync.

  Provides branch selection, an enable/disable toggle, and live
  status reporting. All git operations happen server-side via
  /_storyboard/autosync/ API endpoints.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    config?: {
      ariaLabel?: string
      icon?: string
      meta?: Record<string, any>
      label?: string
      menuWidth?: string
    }
    basePath?: string
    tabindex?: number
  }

  let { config = {}, basePath = '/', tabindex = -1 }: Props = $props()

  const apiBase = $derived((basePath === '/' ? '' : basePath.replace(/\/$/, '')) + '/_storyboard/autosync')

  let menuOpen = $state(false)
  let branches: string[] = $state([])
  let currentBranch = $state('')
  let selectedBranch = $state('')
  let enabledScopes = $state<{ canvas: boolean; prototype: boolean }>({ canvas: false, prototype: false })
  let lastSyncTime: string | null = $state(null)
  let lastError: string | null = $state(null)
  let lastErrorByScope = $state<{ canvas: string | null; prototype: string | null }>({ canvas: null, prototype: null })
  let syncing = $state(false)
  let syncingScope = $state<'canvas' | 'prototype' | null>(null)
  let loading = $state(false)

  let statusPollInterval: ReturnType<typeof setInterval> | null = null

  function isProtectedBranch(name: string): boolean {
    const normalized = String(name || '').toLowerCase()
    return normalized === 'main' || normalized === 'master'
  }

  async function fetchBranches() {
    try {
      const res = await fetch(`${apiBase}/branches`)
      const data = await res.json()
      branches = data.branches || []
      currentBranch = data.current || ''
      if (!selectedBranch || isProtectedBranch(selectedBranch) || !branches.includes(selectedBranch)) {
        selectedBranch = branches.includes(currentBranch) ? currentBranch : (branches[0] || '')
      }
    } catch { /* ignore */ }
  }

  function isScopeEnabled(target: 'canvas' | 'prototype') {
    return enabledScopes[target] === true
  }

  function hasEnabledScopes() {
    return enabledScopes.canvas || enabledScopes.prototype
  }

  function applyStatus(data: any) {
    const wasEnabled = hasEnabledScopes()
    const incomingScopes = data.enabledScopes
    if (incomingScopes && typeof incomingScopes === 'object') {
      enabledScopes = {
        canvas: incomingScopes.canvas === true,
        prototype: incomingScopes.prototype === true,
      }
    } else {
      enabledScopes = {
        canvas: data.enabled === true && data.scope === 'canvas',
        prototype: data.enabled === true && data.scope === 'prototype',
      }
    }

    currentBranch = data.branch || currentBranch
    if (data.targetBranch) selectedBranch = data.targetBranch
    lastSyncTime = data.lastSyncTime || null
    lastError = data.lastError || null
    syncing = data.syncing === true
    syncingScope = data.syncingScope === 'prototype' || data.syncingScope === 'canvas'
      ? data.syncingScope
      : null

    const incomingErrorByScope = data.lastErrorByScope
    if (incomingErrorByScope && typeof incomingErrorByScope === 'object') {
      lastErrorByScope = {
        canvas: incomingErrorByScope.canvas || null,
        prototype: incomingErrorByScope.prototype || null,
      }
    }

    // Manage polling based on enabled state
    if (hasEnabledScopes() && !statusPollInterval) startPolling()
    if (!hasEnabledScopes() && !menuOpen && wasEnabled) stopPolling()
  }

  async function fetchStatus() {
    try {
      const res = await fetch(`${apiBase}/status`)
      const data = await res.json()
      applyStatus(data)
    } catch { /* ignore */ }
  }

  async function setAutosyncScope(scope: 'canvas' | 'prototype', shouldEnable: boolean, e: Event) {
    e.preventDefault()
    loading = true
    lastError = null

    try {
      if (shouldEnable && !selectedBranch) {
        lastError = 'Select a non-main branch first'
        return
      }

      const res = await fetch(
        shouldEnable ? `${apiBase}/enable` : `${apiBase}/disable`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            shouldEnable
              ? { branch: selectedBranch, scope }
              : { scope },
          ),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        lastError = data.error || (shouldEnable ? 'Failed to enable' : 'Failed to disable')
      } else {
        applyStatus(data)
      }
    } catch (err: any) {
      lastError = err.message || 'Request failed'
    } finally {
      loading = false
    }
  }

  function handleBranchChange(e: Event) {
    selectedBranch = (e.target as HTMLSelectElement).value
  }

  function startPolling() {
    if (statusPollInterval) return
    statusPollInterval = setInterval(fetchStatus, 5000)
  }

  function stopPolling() {
    if (statusPollInterval) {
      clearInterval(statusPollInterval)
      statusPollInterval = null
    }
  }

  function handleOpenChange(open: boolean) {
    menuOpen = open
    if (open) {
      fetchBranches()
      fetchStatus()
      startPolling()
    } else if (!hasEnabledScopes()) {
      stopPolling()
    }
  }

  function formatSyncTime(iso: string | null): string {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return iso
    }
  }

  onMount(() => {
    fetchStatus()
  })

  onDestroy(() => {
    stopPolling()
  })
</script>

<DropdownMenu.Root bind:open={menuOpen} onOpenChange={handleOpenChange}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <TriggerButton
        active={menuOpen || hasEnabledScopes()}
        size="icon-xl"
        aria-label={config.ariaLabel || 'Autosync'}
        {tabindex}
        {...props}
      >
        <Icon name={config.icon || 'primer/sync'} size={16} {...(config.meta || {})} />
      </TriggerButton>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content
    side="top"
    align="end"
    sideOffset={16}
    style={config.menuWidth ? `min-width: ${config.menuWidth}` : undefined}
    class="min-w-[280px]"
  >
    <p class="menuTitle">{config.label || 'Autosync'}</p>

    <p class="description">
      Automatically commit and push changes every 30s
    </p>

    <DropdownMenu.Separator />

    <!-- Branch selector -->
    <div class="branchRow">
      <label class="branchLabel" for="autosync-branch">Branch</label>
      <select
        id="autosync-branch"
        class="branchSelect"
        value={selectedBranch}
        onchange={handleBranchChange}
        disabled={hasEnabledScopes() || loading}
      >
        {#if branches.length === 0}
          <option value="" disabled selected>No non-main branches available</option>
        {/if}
        {#each branches as branch (branch)}
          <option value={branch}>{branch}</option>
        {/each}
      </select>
    </div>

    <DropdownMenu.Separator />

    <!-- Enable options -->
    <DropdownMenu.CheckboxItem
      checked={isScopeEnabled('canvas')}
      onSelect={(e) => setAutosyncScope('canvas', !isScopeEnabled('canvas'), e)}
      disabled={loading || (!isScopeEnabled('canvas') && !selectedBranch)}
    >
      {isScopeEnabled('canvas')
        ? 'Disable autosync for canvas changes'
        : 'Enable autosync for canvas changes'}
    </DropdownMenu.CheckboxItem>
    <DropdownMenu.CheckboxItem
      checked={isScopeEnabled('prototype')}
      onSelect={(e) => setAutosyncScope('prototype', !isScopeEnabled('prototype'), e)}
      disabled={loading || (!isScopeEnabled('prototype') && !selectedBranch)}
    >
      {isScopeEnabled('prototype')
        ? 'Disable autosync for prototype changes'
        : 'Enable autosync for prototype changes'}
    </DropdownMenu.CheckboxItem>

    <!-- Status display -->
    {#if hasEnabledScopes() || lastError || lastSyncTime || lastErrorByScope.canvas || lastErrorByScope.prototype}
      <DropdownMenu.Separator />
      <div class="statusRow">
        {#if syncing && syncingScope}
          <p class="scopeHint">Syncing <strong>{syncingScope}</strong> changes</p>
        {/if}
        {#if lastError}
          <span class="statusError">⚠ {lastError}</span>
        {/if}
        {#if lastErrorByScope.canvas}
          <span class="statusError">⚠ Canvas: {lastErrorByScope.canvas}</span>
        {/if}
        {#if lastErrorByScope.prototype}
          <span class="statusError">⚠ Prototype: {lastErrorByScope.prototype}</span>
        {/if}
        {#if !syncing && lastSyncTime}
          <span class="statusOk">Last sync: {formatSyncTime(lastSyncTime)}</span>
        {/if}
      </div>
    {/if}

    <DropdownMenu.Separator />
    <p class="footer"><span class="footerDot"></span>Only available in dev environment</p>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<style>
  .menuTitle {
    font-size: 13px;
    font-weight: 500;
    color: var(--fgColor-default, #e6edf3);
    padding: 6px 6px 0;
    margin: 0;
  }

  .description {
    font-size: 12px;
    color: var(--fgColor-muted, #848d97);
    padding: 0 6px 4px;
    margin: 0;
    line-height: 1.4;
  }

  .branchRow {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 6px;
  }

  .branchLabel {
    font-size: 13px;
    font-weight: 500;
    color: var(--fgColor-default, #e6edf3);
  }

  .branchSelect {
    width: 100%;
    appearance: none;
    background-color: var(--bgColor-default, #0d1117);
    color: var(--fgColor-default, #e6edf3);
    border: 1px solid var(--borderColor-default, #30363d);
    border-radius: 8px;
    padding: 8px 32px 8px 12px;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23848d97'%3E%3Cpath d='M6 8.5L1.5 4h9L6 8.5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    transition: border-color 0.15s ease;
  }

  .branchSelect:hover:not(:disabled) {
    border-color: var(--fgColor-muted, #848d97);
  }

  .branchSelect:focus-visible {
    outline: 2px solid var(--borderColor-accent-emphasis, #1f6feb);
    outline-offset: -1px;
  }

  .branchSelect:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .statusRow {
    padding: 4px 6px 2px;
  }

  .scopeHint {
    font-size: 11px;
    color: var(--fgColor-muted, #848d97);
    padding: 4px 0;
    margin: 0;
  }

  .statusError {
    font-size: 11px;
    color: var(--fgColor-danger, #f85149);
  }

  .statusOk {
    font-size: 11px;
    color: var(--fgColor-muted, #848d97);
  }

  .footer {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--fgColor-muted, #848d97);
    padding: 2px 6px 0;
    margin: 0;
  }

  .footerDot {
    width: 8px;
    height: 8px;
    background: hsl(212, 92%, 45%);
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
