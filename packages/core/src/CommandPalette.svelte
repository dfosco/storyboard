<!--
  CommandPaletteTrigger — toolbar trigger button for the command palette.
  Dispatches a custom event to open the React-based command palette.
  The actual palette UI is rendered in React (src/components/CommandPalette).
-->

<script lang="ts">
  import { TriggerButton } from './lib/components/ui/trigger-button/index.js'
  import Icon from './svelte-plugin-ui/components/Icon.svelte'

  interface Props {
    tabindex?: number
    icon?: string
    iconMeta?: Record<string, unknown>
  }

  let {
    tabindex,
    icon = 'iconoir/key-command',
    iconMeta = {},
  }: Props = $props()

  function openPalette() {
    document.dispatchEvent(new CustomEvent('storyboard:toggle-palette'))
  }
</script>

<TriggerButton
  class="text-2xl"
  aria-label="Command Menu"
  {tabindex}
  onclick={openPalette}
><Icon name={icon} size={16} {...iconMeta} /></TriggerButton>
