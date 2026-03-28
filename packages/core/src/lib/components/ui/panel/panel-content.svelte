<script>
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { cn } from "$lib/utils/index.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  } = $props();
</script>

<DialogPrimitive.Portal>
  <!-- Subtle overlay — no heavy backdrop like Dialog -->
  <DialogPrimitive.Overlay
    data-slot="panel-overlay"
    class="fixed inset-0 z-[9998] bg-black/20 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-150"
  />

  <DialogPrimitive.Content
    bind:ref
    data-slot="panel-content"
    interactOutsideBehavior="ignore"
    class={cn(
      "font-sans fixed z-[9999] bottom-20 right-6 w-[400px] max-h-[70vh] flex flex-col",
      "bg-popover text-popover-foreground border border-border",
      "rounded-xl shadow-2xl overflow-hidden",
      "data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-4",
      "data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-4",
      "duration-150",
      className
    )}
    {...restProps}
  >
    {@render children?.()}
  </DialogPrimitive.Content>
</DialogPrimitive.Portal>
