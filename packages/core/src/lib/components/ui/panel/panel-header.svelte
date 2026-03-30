<script>
  import { cn } from "$lib/utils/index.js";

  let { class: className, children, ...restProps } = $props();
</script>

<div
  data-slot="panel-header"
  class={cn(
    "flex items-center justify-between gap-2 px-4 pt-4 pb-2",
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
