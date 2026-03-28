<!--
  TriggerButton — floating action trigger with smooth superellipse corners.
  First component of the core UI kit for floating menus.

  Themable via CSS custom properties (set on any ancestor):
    --trigger-bg         Background color        (default: slate-100)
    --trigger-bg-hover   Background on hover/active (default: slate-200)
    --trigger-text       Text / icon color        (default: slate-600)
    --trigger-border     Border color             (default: slate-400)
-->

<script module>
  import { cn } from "$lib/utils/index.js";

  // Register CSS Houdini paint worklet for superellipse masks
  if (typeof CSS !== 'undefined' && 'paintWorklet' in CSS) {
    import('smooth-corners/paint.js?url').then(mod => {
      CSS.paintWorklet.addModule(mod.default)
    }).catch(() => {})
  }
</script>

<script>
  import { Button } from '$lib/components/ui/button/index.js'

  let {
    class: className,
    wrapperClass = "",
    active = false,
    size = "icon-2xl",
    children,
    ...restProps
  } = $props();
</script>

<span data-trigger-button data-active={active || undefined}>
  <Button
    variant="outline"
    {size}
    wrapperClass={cn(
      "smooth-corners [--smooth-corners:4] hover:rotate-2 focus-visible:rotate-2 transition-transform",
      active && "rotate-2",
      wrapperClass
    )}
    class={cn(
      "smooth-corners leading-none font-semibold",
      className
    )}
    {...restProps}
  >
    {@render children?.()}
  </Button>
</span>

<style>
  [data-trigger-button] {
    display: contents;
  }
  [data-trigger-button] :global([data-slot="button-wrapper"]) {
    --sc-border-color: var(--trigger-border, var(--color-slate-400));
    --sc-border-width: 3px;
  }
  [data-trigger-button] :global([data-slot="button"]) {
    background-color: var(--trigger-bg, var(--color-slate-100));
    color: var(--trigger-text, var(--color-slate-600));
  }
  [data-trigger-button] :global([data-slot="button"]:hover),
  [data-trigger-button] :global([data-slot="button"]:focus-visible),
  [data-trigger-button] :global([data-slot="button"][aria-expanded="true"]),
  [data-trigger-button][data-active] :global([data-slot="button"]) {
    background-color: var(--trigger-bg-hover, var(--color-slate-200));
  }
</style>
