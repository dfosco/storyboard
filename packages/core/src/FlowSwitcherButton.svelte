<!--
  FlowSwitcherButton — shows which flow is active for the current prototype
  and lets the user switch between available flows via a dropdown menu.

  Appears in the CoreUIBar when the current prototype has more than one flow.
  Uses RadioGroup/RadioItem so the active flow gets a check indicator.
-->

<script lang="ts">
  import { TriggerButton } from '$lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { getFlowsForPrototype, resolveFlowRoute, resolveFlowName, flowExists } from './loader.js'
  import { getFlowMeta } from './viewfinder.js'

  interface Props {
    config?: { ariaLabel?: string; icon?: string; meta?: Record<string, any> }
    basePath?: string
    tabindex?: number
  }

  let { config = {}, basePath = '/', tabindex = -1 }: Props = $props()

  let menuOpen = $state(false)

  interface FlowEntry {
    key: string
    name: string
    title: string
    route: string
  }

  /**
   * Derive prototype name from the current pathname, stripping the base path.
   */
  function getPrototypeName(): string | null {
    let path = window.location.pathname
    const base = basePath.replace(/\/+$/, '')
    if (base && path.startsWith(base)) {
      path = path.slice(base.length)
    }
    path = path.replace(/\/+$/, '') || '/'
    if (path === '/') return null
    const segments = path.split('/').filter(Boolean)
    return segments[0] || null
  }

  /**
   * Detect the active flow name from the URL (mirrors StoryboardProvider logic).
   */
  function getActiveFlowKey(prototypeName: string | null): string {
    const params = new URLSearchParams(window.location.search)
    const explicit = params.get('flow') || params.get('scene')
    if (explicit) {
      return prototypeName ? resolveFlowName(prototypeName, explicit) : explicit
    }
    let path = window.location.pathname
    const base = basePath.replace(/\/+$/, '')
    if (base && path.startsWith(base)) {
      path = path.slice(base.length)
    }
    path = path.replace(/\/+$/, '') || '/'
    const pageFlow = path === '/' ? 'index' : (path.split('/').pop() || 'index')
    if (prototypeName) {
      const scoped = resolveFlowName(prototypeName, pageFlow)
      if (flowExists(scoped)) return scoped
      const protoFlow = resolveFlowName(prototypeName, prototypeName)
      if (flowExists(protoFlow)) return protoFlow
    }
    return 'default'
  }

  let flows: FlowEntry[] = $state([])
  let activeFlowKey: string = $state('')
  let prototypeName: string | null = $state(null)

  function refreshFlows() {
    prototypeName = getPrototypeName()
    if (!prototypeName) {
      flows = []
      activeFlowKey = ''
      return
    }

    activeFlowKey = getActiveFlowKey(prototypeName)

    const raw = getFlowsForPrototype(prototypeName)
    flows = raw.map(f => {
      const meta = getFlowMeta(f.key)
      return {
        key: f.key,
        name: f.name,
        title: meta?.title || f.name,
        route: resolveFlowRoute(f.key),
      }
    })
  }

  function handleOpenChange(open: boolean) {
    if (open) refreshFlows()
  }

  function switchToFlow(flow: FlowEntry) {
    menuOpen = false
    window.location.href = flow.route
  }

  // Compute on first render
  refreshFlows()
</script>

{#if flows.length > 1}
  <DropdownMenu.Root bind:open={menuOpen} onOpenChange={handleOpenChange}>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <TriggerButton
          active={menuOpen}
          size="icon-xl"
          aria-label={config.ariaLabel || 'Switch flow'}
          {tabindex}
          {...props}
        >
          <Icon name={config.icon || 'feather/fast-forward'} size={16} {...(config.meta || {})} />
        </TriggerButton>
      {/snippet}
    </DropdownMenu.Trigger>

    <DropdownMenu.Content side="top" align="end" sideOffset={16} class="min-w-[200px]">
      <DropdownMenu.Label>Flows</DropdownMenu.Label>
      <DropdownMenu.RadioGroup value={activeFlowKey}>
        {#each flows as flow (flow.key)}
          <DropdownMenu.RadioItem
            value={flow.key}
            onclick={() => switchToFlow(flow)}
          >
            {flow.title}
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
