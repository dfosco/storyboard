<!--
  ThemeMenuButton — toolbar dropdown for switching the app color scheme.

  Renders a radio group of theme options (System, Light, Dark, etc.)
  and persists the selection via the themeStore.
-->

<script lang="ts">
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { themeState, setTheme, THEMES, type ThemeValue } from './stores/themeStore.js'

  interface Props {
    config?: {
      ariaLabel?: string
      icon?: string
      meta?: Record<string, any>
      label?: string
      menuWidth?: string
    }
    tabindex?: number
  }

  let { config = {}, tabindex = -1 }: Props = $props()

  let menuOpen = $state(false)

  function handleSelect(value: ThemeValue) {
    setTheme(value)
    menuOpen = false
  }
</script>

<DropdownMenu.Root bind:open={menuOpen}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <TriggerButton
        active={menuOpen}
        size="icon-xl"
        aria-label={config.ariaLabel || 'Theme'}
        {tabindex}
        {...props}
      >
        <Icon name={config.icon || 'primer/sun'} size={16} {...(config.meta || {})} />
      </TriggerButton>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content side="top" align="end" sideOffset={16} style={config.menuWidth ? `min-width: ${config.menuWidth}` : undefined} class="min-w-[200px]">
    {#if config.label}
      <DropdownMenu.Label>{config.label}</DropdownMenu.Label>
    {/if}

    <DropdownMenu.RadioGroup value={$themeState.theme}>
      {#each THEMES as option (option.value)}
        <DropdownMenu.RadioItem
          value={option.value}
          onclick={() => handleSelect(option.value)}
        >
          {option.name}
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
