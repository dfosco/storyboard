<script>
  import { cn } from "../../../utils/index.js";

  let { class: className, children, ...restProps } = $props();
</script>

<div
  data-slot="panel-footer"
  class={cn("flex items-center justify-end gap-2 px-4 pt-2 pb-4", className)}
  {...restProps}
>
  {@render children?.()}
</div>
