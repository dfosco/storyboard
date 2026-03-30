<script>
	import { Tooltip as TooltipPrimitive } from "bits-ui";

	let { child, children, ...restProps } = $props();
</script>

{#if child}
	<TooltipPrimitive.Trigger {...restProps} {child} />
{:else}
	<TooltipPrimitive.Trigger {...restProps}>
		{#snippet child({ props })}
			<!-- inline-flex span: has a box for pointer events (tooltips on hover)
			     but tabindex=-1 keeps it out of the tab order.
			     onfocusin relays child focus to the tooltip's onfocus handler. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<span
				{...props}
				tabindex={-1}
				onfocusin={props.onfocus}
				onfocusout={props.onblur}
				style="display: inline-flex"
			>
				{@render children?.()}
			</span>
		{/snippet}
	</TooltipPrimitive.Trigger>
{/if}
