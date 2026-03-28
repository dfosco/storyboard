<!--
  CoreUIBar — unified floating button bar for the storyboard devtools.

  Fixed bottom-right. Always shows the ⌘ command button (rightmost).
  Mode-specific buttons appear to its left at a smaller size.
  Hue follows the active mode's collar color via --trigger-* CSS custom
  properties set in modes.css.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import CommandMenu from './CommandMenu.svelte'
  import { modeState } from './svelte-plugin-ui/stores/modeStore.js'

  interface Props { basePath?: string }
  let { basePath = '/' }: Props = $props()

  let visible = $state(true)
  let WorkshopButton: any = $state(null)
  let workshopFeatures: any[] = $state([])

  const showWorkshop = $derived(
    $modeState.mode === 'inspect' && WorkshopButton && workshopFeatures.length > 0
  )

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      visible = !visible
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleKeydown)

    // Detect workshop features from server plugin injection
    try {
      const script = document.querySelector('script[data-workshop-features]') as HTMLElement | null
      if (script) {
        const enabledConfig = JSON.parse(script.dataset.workshopFeatures!)
        const { features } = await import('./workshop/features/registry.js')

        workshopFeatures = Object.entries(features)
          .filter(([name]) => enabledConfig[name] !== false)
          .filter(([, f]: any) => f.label && f.overlayId && f.overlay)
          .map(([, f]: any) => ({
            name: f.name,
            label: f.label,
            overlayId: f.overlayId,
            overlay: f.overlay,
          }))

        if (workshopFeatures.length > 0) {
          const mod = await import('./WorkshopButton.svelte')
          WorkshopButton = mod.default
        }
      }
    } catch {}
  })

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
</script>

{#if visible}
  <div class="fixed bottom-6 right-6 z-[9999] font-sans flex items-end gap-3" data-core-ui-bar>
    {#if showWorkshop}
      <WorkshopButton features={workshopFeatures} />
    {/if}
    <CommandMenu {basePath} />
  </div>
{/if}
