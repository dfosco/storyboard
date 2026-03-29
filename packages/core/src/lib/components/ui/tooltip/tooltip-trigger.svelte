<script>
	import { Tooltip as TooltipPrimitive } from "bits-ui";

	let { child, children, ...restProps } = $props();
</script>

{#if child}
	<TooltipPrimitive.Trigger {...restProps} {child} />
{:else}
	<TooltipPrimitive.Trigger {...restProps}>
		{#snippet child({ props })}
			<!-- Remove tabindex so the span is not a tab stop — the inner
			     interactive element handles focus; tooltip events still fire
			     via bubbling through the display:contents wrapper. -->
			<span {...props} tabindex={-1} style:display="contents">
				{@render children?.()}
			</span>
		{/snippet}
	</TooltipPrimitive.Trigger>
{/if}
