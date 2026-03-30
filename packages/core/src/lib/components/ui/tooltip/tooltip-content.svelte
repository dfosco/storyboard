<script>
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { cn } from "../../../utils/index.js";

	let {
		ref = $bindable(null),
		sideOffset = 8,
		class: className,
		...restProps
	} = $props();
</script>

<TooltipPrimitive.Portal>
	<TooltipPrimitive.Content
		bind:ref
		data-slot="tooltip-content"
		{sideOffset}
		class={cn(
			"font-sans bg-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg z-[10001] animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
			className
		)}
		{...restProps}
	/>
</TooltipPrimitive.Portal>
