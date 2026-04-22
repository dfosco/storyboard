<!--
  HideChromeTrigger — toolbar button that toggles toolbar/branch bar visibility.
  Always visible (even in hide mode). Uses the ⌘ icon.
  In hide mode: shrinks to regular size and goes 50% opacity.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
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

  let hidden = $state(document.documentElement.classList.contains('storyboard-chrome-hidden'))
  let observer: MutationObserver | null = null

  onMount(() => {
    observer = new MutationObserver(() => {
      hidden = document.documentElement.classList.contains('storyboard-chrome-hidden')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  })

  onDestroy(() => observer?.disconnect())

  function toggle() {
    document.documentElement.classList.toggle('storyboard-chrome-hidden')
  }
</script>

<span style:opacity={hidden ? 0.5 : 1} style:transition="opacity 0.15s">
  <TriggerButton
    aria-label={config.ariaLabel || 'Toggle toolbars'}
    size={hidden ? 'icon-xl' : (config.size || 'icon-2xl')}
    {tabindex}
    onclick={toggle}
  ><Icon name={config.icon || 'iconoir/key-command'} size={16} {...(config.meta || {})} /></TriggerButton>
</span>
