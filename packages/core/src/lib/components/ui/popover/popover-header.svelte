<script>
	import { cn } from "../../../utils/index.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="popover-header"
	class={cn("flex flex-col gap-0.5 text-sm", className)}
	{...restProps}
>
	{@render children?.()}
</div>