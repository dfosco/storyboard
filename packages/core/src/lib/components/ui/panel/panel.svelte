<!--
  Panel — bottom-right anchored floating panel.
  Opens above the CoreUIBar trigger area. Not a centered modal.
  Uses bits-ui Dialog primitive for accessibility (focus trap, escape to close)
  but positions content as a fixed bottom-right panel instead of centered.
-->

<script>
  import { Dialog as DialogPrimitive } from "bits-ui";

  let { open = $bindable(false), ...restProps } = $props();
</script>

<DialogPrimitive.Root bind:open {...restProps} />
