<script>
	import { cn } from "../../../utils/index.js";
	import DropdownMenuPortal from "./dropdown-menu-portal.svelte";
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	let {
		ref = $bindable(null),
		sideOffset = 8,
		align = "start",
		portalProps,
		class: className,
		...restProps
	} = $props();
</script>

<DropdownMenuPortal {...portalProps}>
	<DropdownMenuPrimitive.Content
		bind:ref
		data-slot="dropdown-menu-content"
		{sideOffset}
		{align}
		class={cn(
			"font-sans data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 w-(--bits-dropdown-menu-anchor-width) data-closed:overflow-hidden z-[10000] bg-popover border-3 border-slate-400 text-slate-800 fill-slate-600 min-w-40 rounded-xl p-2 shadow-xl duration-100 overflow-x-hidden overflow-y-auto",
			className
		)}
		{...restProps}
	/>
</DropdownMenuPortal>