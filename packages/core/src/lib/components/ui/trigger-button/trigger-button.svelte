<!--
  TriggerButton — floating action trigger with smooth superellipse corners.
  First component of the core UI kit for floating menus.

  Themable via CSS custom properties (set on any ancestor):
    --sb--trigger-bg         Background color        (default: slate-100)
    --sb--trigger-bg-hover   Background on hover/active (default: slate-200)
    --sb--trigger-text       Text / icon color        (default: slate-600)
    --sb--trigger-border     Border color             (default: slate-400)
-->

<script module>
  import { cn } from "../../../utils/index.js";

  // Register CSS Houdini paint worklet for superellipse masks.
  import { registerSmoothCorners } from '../../../../smoothCorners.js'
  registerSmoothCorners()
</script>

<script>
  import { Button } from '../../../components/ui/button/index.js'

  let {
    class: className,
    wrapperClass = "",
    active = false,
    inactive = false,
    dimmed = false,
    localOnly = false,
    size = "icon-2xl",
    children,
    ...restProps
  } = $props();

  const borderWidth = $derived(
    ['icon-2xl', 'icon-xl', '2xl', 'xl'].includes(size) ? '3px' : '2px'
  );
</script>

<span
  data-trigger-button
  data-active={active || undefined}
  data-inactive={inactive || undefined}
  data-dimmed={dimmed || undefined}
  data-local-only={localOnly || undefined}
  style:--sb--trigger-border-width={borderWidth}
>
  <Button
    variant="trigger"
    {size}
    disabled={inactive}
    wrapperClass={cn(
      "smooth-corners [--sb--smooth-corners:4] hover:rotate-2 focus-visible:rotate-2 transition-transform",
      active && !inactive && "rotate-2",
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
    display: inline-flex;
    position: relative;
  }
  [data-trigger-button] :global([data-slot="button-wrapper"]) {
    --sb--sc-border-color: var(--sb--trigger-border, var(--color-slate-400));
    --sb--sc-border-width: var(--sb--trigger-border-width, 3px);
  }
  /* Accent-colored border/gap on focus — follows the superellipse shape */
  [data-trigger-button] :global([data-slot="button-wrapper"]:has([data-slot="button"]:focus-visible)) {
    --sb--sc-border-color: hsl(212 92% 45%);
  }
  [data-trigger-button] :global([data-slot="button"]) {
    background-color: var(--sb--trigger-bg, var(--color-slate-100));
    color: var(--sb--trigger-text, var(--color-slate-600));
  }
  [data-trigger-button] :global([data-slot="button"]:hover),
  [data-trigger-button] :global([data-slot="button"]:focus-visible),
  [data-trigger-button] :global([data-slot="button"][aria-expanded="true"]),
  [data-trigger-button][data-active] :global([data-slot="button"]) {
    background-color: var(--sb--trigger-bg-hover, var(--color-slate-300));
  }

  /* Inactive: disabled-looking, no interaction */
  [data-trigger-button][data-inactive] {
    opacity: 0.45;
    pointer-events: none;
  }

  /* Dimmed: reduced visibility, interactive on hover/focus */
  [data-trigger-button][data-dimmed] {
    opacity: 0.3;
    transition: opacity 200ms;
  }
  [data-trigger-button][data-dimmed]:hover,
  [data-trigger-button][data-dimmed]:focus-within {
    opacity: 1;
  }
</style>
