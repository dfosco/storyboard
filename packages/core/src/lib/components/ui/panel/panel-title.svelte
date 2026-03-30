<script>
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { cn } from "../../../utils/index.js";

  let { class: className, children, ...restProps } = $props();
</script>

<DialogPrimitive.Title
  data-slot="panel-title"
  class={cn("text-sm font-semibold", className)}
  {...restProps}
>
  {@render children?.()}
</DialogPrimitive.Title>
