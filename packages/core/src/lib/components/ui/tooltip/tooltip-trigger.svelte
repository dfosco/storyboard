<script>
	import { Tooltip as TooltipPrimitive } from "bits-ui";

	let { child, children, ...restProps } = $props();
</script>

{#if child}
	<TooltipPrimitive.Trigger {...restProps} {child} />
{:else}
	<TooltipPrimitive.Trigger {...restProps}>
		{#snippet child({ props })}
			<!-- Non-tabbable wrapper: tabindex=-1 keeps it out of tab order.
			     onfocusin/onfocusout relay child focus events to the tooltip's
			     onfocus/onblur handlers so tooltips still appear on keyboard focus. -->
			<span
				{...props}
				tabindex={-1}
				onfocusin={props.onfocus}
				onfocusout={props.onblur}
				style:display="contents"
			>
				{@render children?.()}
			</span>
		{/snippet}
	</TooltipPrimitive.Trigger>
{/if}
