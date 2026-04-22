<!--
  HideChromeTrigger — toolbar button that toggles toolbar/branch bar visibility.
  Always visible (even in hide mode). Uses the ⌘ icon.
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

  function toggle() {
    const el = document.documentElement
    el.classList.toggle('storyboard-chrome-hidden')
  }
</script>

<TriggerButton
  aria-label={config.ariaLabel || 'Toggle toolbars'}
  size={config.size || 'icon-2xl'}
  {tabindex}
  onclick={toggle}
><Icon name={config.icon || 'iconoir/key-command'} size={16} {...(config.meta || {})} /></TriggerButton>
