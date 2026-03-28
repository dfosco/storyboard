<script>
  import { cn } from "$lib/utils/index.js";

  let { class: className, children, ...restProps } = $props();
</script>

<div
  data-slot="panel-body"
  class={cn("flex-1 overflow-auto px-4 py-2", className)}
  {...restProps}
>
  {@render children?.()}
</div>
