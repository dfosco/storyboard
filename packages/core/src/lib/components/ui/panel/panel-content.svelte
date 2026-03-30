<script>
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { cn } from "../../../utils/index.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  } = $props();
</script>

<DialogPrimitive.Portal>
  <DialogPrimitive.Content
    bind:ref
    data-slot="panel-content"
    trapFocus={false}
    onInteractOutside={(e) => e.preventDefault()}
    onFocusOutside={(e) => e.preventDefault()}
    class={cn(
      "font-sans fixed z-[10000] bottom-28 right-6 w-[400px] max-h-[70vh] flex flex-col",
      "bg-popover text-popover-foreground border-3 border-slate-400",
      "rounded-xl shadow-xl overflow-hidden",
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
