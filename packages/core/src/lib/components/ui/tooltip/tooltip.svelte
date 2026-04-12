<script>
	import { Tooltip as TooltipPrimitive } from "bits-ui";

	let { ...restProps } = $props();
</script>

<TooltipPrimitive.Provider delayDuration={50}>
	<TooltipPrimitive.Root {...restProps} />
</TooltipPrimitive.Provider>
