<!--
  CommandPaletteTrigger — toolbar button that opens the ⌘K command palette.
  Used as a tool component on the command-toolbar surface.
-->

<script lang="ts">
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    config?: any
    data?: any
    tabindex?: number
    localOnly?: boolean
    basePath?: string
  }

  let {
    config = {},
    tabindex,
  }: Props = $props()

  function openPalette() {
    document.dispatchEvent(new CustomEvent('storyboard:toggle-palette'))
  }
</script>

<TriggerButton
  class="text-2xl"
  aria-label="Command palette"
  {tabindex}
  onclick={openPalette}
><Icon name={config.icon || 'iconoir/select-point3d'} size={16} {...(config.meta || {})} /></TriggerButton>
