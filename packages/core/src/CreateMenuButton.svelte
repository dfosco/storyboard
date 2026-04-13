<!--
  CreateMenuButton — config-driven trigger for create/workshop features.
  Appears to the left of the command button in develop (inspect) mode.
  Menu label and items are defined by toolbar.config.json buttons.create section.

  Icon options (set in config):
    - "icon": octicon name (e.g. "plus", "beaker") — rendered via Octicon.svelte
    - "character": raw character/emoji (e.g. "⌘", "🧩") — rendered as text
    - Falls back to "+" if neither is set
-->

<script lang="ts">
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
  import * as Panel from './lib/components/ui/panel/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { isExcludedByRoute } from './commandActions.js'
  import type { Component } from 'svelte'

  interface CreateMenuFeature {
    name: string
    label: string
    overlayId: string
    overlay: Component<Record<string, any>>
  }

  interface CreateMenuConfig {
    label: string
    ariaLabel?: string
    icon?: string
    character?: string
    items?: Array<{ feature: string; label?: string }>
  }

  interface Props {
    features?: CreateMenuFeature[]
    data?: { features?: CreateMenuFeature[] }
    config?: CreateMenuConfig
    localOnly?: boolean
    tabindex?: number
  }

  let { features: featuresProp = [], data, config = { label: 'Create' }, localOnly, tabindex }: Props = $props()

  // Support both direct `features` prop (legacy) and `data.features` (generic toolbar)
  const features = $derived(featuresProp.length > 0 ? featuresProp : (data?.features || []))

  const menuWidth = $derived((config as any).menuWidth || null)

  let menuOpen = $state(false)
  let activeAction: any | null = $state(null)

  // Build a feature lookup for resolving config actions
  const featuresByName = $derived(
    Object.fromEntries(features.map(f => [f.name, f]))
  )

  // Merge config actions with resolved features, preserving order
  const resolvedActions = $derived.by(() => {
    const actions = (config as any).actions
    if (!Array.isArray(actions)) {
      // Fallback: render a header + feature items if no actions defined
      return [
        { type: 'header', label: config.label, _key: 'header' },
        ...features.map(f => ({ type: 'default', label: f.label, _feature: f, _key: f.overlayId })),
      ]
    }
    return actions.map((a: any, i: number) => {
      if (a.feature) {
        const feat = featuresByName[a.feature]
        if (!feat) return null
        return { ...a, _feature: feat, _key: a.id || `action-${i}` }
      }
      return { ...a, _key: a.id || `${a.type}-${i}` }
    }).filter(Boolean)
  })

  function showOverlay(action: any) {
    activeAction = action
    menuOpen = false
  }

  function closeOverlay() { activeAction = null }
</script>

<DropdownMenu.Root bind:open={menuOpen}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <TriggerButton
        active={menuOpen}
        size="icon-xl"
        aria-label={config.ariaLabel || config.label}
        {tabindex}
        {...props}
      >
        {#if config.icon}
          <Icon name={config.icon} size={16} {...(config.meta || {})} />
        {:else if config.character}
          {config.character}
        {:else}
          +
        {/if}
      </TriggerButton>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content side="top" align="end" sideOffset={16} class="min-w-[180px]" style={menuWidth ? `width: ${menuWidth}` : ''}>
    {#each resolvedActions as action (action._key)}
      {#if isExcludedByRoute(action)}
        <!-- hidden by route -->
      {:else if action.type === 'header'}
        <DropdownMenu.Label>{action.label}</DropdownMenu.Label>
      {:else if action.type === 'separator'}
        <DropdownMenu.Separator />
      {:else if action.type === 'footer'}
        <DropdownMenu.Separator />
        <div class="px-2 py-1.5 text-xs text-muted-foreground flex flex-row items-baseline"><span class="inline-flex w-2 h-2 rounded-full mr-1.5" style="background: hsl(212, 92%, 45%)"></span>Only available in dev environment</div>
      {:else if action._feature}
        <DropdownMenu.Item onclick={() => showOverlay(action)}>
          {action.label || action._feature.label}
        </DropdownMenu.Item>
      {/if}
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>

{#if activeAction?._feature}
  <Panel.Root open={true} onOpenChange={(open) => { if (!open) closeOverlay() }}>
    <Panel.Content>
      <activeAction._feature.overlay onClose={closeOverlay} {...(activeAction.overlayProps || {})} />
    </Panel.Content>
  </Panel.Root>
{/if}
