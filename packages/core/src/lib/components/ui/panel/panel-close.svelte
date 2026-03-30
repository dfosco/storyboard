<script>
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { Button } from "../../../components/ui/button/index.js";
  import XIcon from '@lucide/svelte/icons/x';

  let { class: className, ...restProps } = $props();
</script>

<DialogPrimitive.Close data-slot="panel-close">
  {#snippet child({ props })}
    <Button variant="ghost" size="icon-sm" class={className} {...props} {...restProps}>
      <XIcon />
      <span class="sr-only">Close</span>
    </Button>
  {/snippet}
</DialogPrimitive.Close>
