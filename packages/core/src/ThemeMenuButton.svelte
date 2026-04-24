<!--
  ThemeMenuButton — toolbar dropdown for switching the app color scheme.

  Renders a radio group of theme options (System, Light, Dark, etc.),
  followed by a separator and "Theme settings" submenu with sync toggles.
-->

<script lang="ts">
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import * as DropdownMenu from './lib/components/ui/dropdown-menu/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'
  import { themeState, setTheme, THEMES, type ThemeValue, themeSyncState, setThemeSyncTarget, type ThemeSyncTargets } from './stores/themeStore.js'

  interface Props {
    config?: {
      ariaLabel?: string
      icon?: string
      meta?: Record<string, any>
      label?: string
      menuWidth?: string
    }
    data?: any
    localOnly?: boolean
    tabindex?: number
  }

  let { config = {}, data, localOnly, tabindex = -1 }: Props = $props()

  let menuOpen = $state(false)
  let canvasActive = $state(false)

  function handleSelect(value: ThemeValue) {
    setTheme(value)
    menuOpen = false
  }

  function handleSyncToggle(e: Event, target: keyof ThemeSyncTargets) {
    e.preventDefault()
    setThemeSyncTarget(target, !$themeSyncState[target])
  }

  $effect(() => {
    function handleCanvasMounted() {
      canvasActive = true
    }
    function handleCanvasUnmounted() {
      canvasActive = false
    }
    document.addEventListener('storyboard:canvas:mounted', handleCanvasMounted)
    document.addEventListener('storyboard:canvas:unmounted', handleCanvasUnmounted)

    const state = (window as any).__storyboardCanvasBridgeState
    canvasActive = state?.active === true
    if (!canvasActive) {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:status-request'))
    }

    return () => {
      document.removeEventListener('storyboard:canvas:mounted', handleCanvasMounted)
      document.removeEventListener('storyboard:canvas:unmounted', handleCanvasUnmounted)
    }
  })
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

    <DropdownMenu.Separator />

    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>Theme settings</DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent class="min-w-[180px]">
        <DropdownMenu.Label>Apply theme to</DropdownMenu.Label>
        {#if canvasActive}
          <DropdownMenu.CheckboxItem
            checked={$themeSyncState.canvas}
            onSelect={(e) => handleSyncToggle(e, 'canvas')}
          >
            Canvas
          </DropdownMenu.CheckboxItem>
        {:else}
          <DropdownMenu.CheckboxItem
            checked={$themeSyncState.prototype}
            onSelect={(e) => handleSyncToggle(e, 'prototype')}
          >
            Prototype
          </DropdownMenu.CheckboxItem>
        {/if}
        <DropdownMenu.CheckboxItem
          checked={$themeSyncState.toolbar}
          onSelect={(e) => handleSyncToggle(e, 'toolbar')}
        >
          Tools
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.CheckboxItem
          checked={$themeSyncState.codeBoxes}
          onSelect={(e) => handleSyncToggle(e, 'codeBoxes')}
        >
          Code boxes
        </DropdownMenu.CheckboxItem>
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
  </DropdownMenu.Content>
</DropdownMenu.Root>
