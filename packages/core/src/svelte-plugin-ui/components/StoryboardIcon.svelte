<!--
  StoryboardIcon — renders icons from multiple sources.

  Sources (checked in order):
    1. Custom overrides (folder, folder-open)
    2. Primer Octicons (primary)
    3. Feather Icons (secondary, stroke-based)

  Usage:
    <StoryboardIcon name="repo" />
    <StoryboardIcon name="folder" color="#54aeff" />
    <StoryboardIcon name="fast-forward" size={16} />
    <StoryboardIcon name="gear" size={16} label="Settings" />
    <StoryboardIcon name="tablet" rotate={90} />
    <StoryboardIcon name="lock" offsetX={1} offsetY={-1} />
    <StoryboardIcon name="arrow-right" flipX />
-->

<script lang="ts">
  import octicons from '@primer/octicons'
  import feather from 'feather-icons'

  // Custom SVG paths that override or extend the icon sets.
  // Each entry: viewBox string + path d attribute.
  const customIcons: Record<string, { viewBox: string; path: string }> = {
    'folder': {
      viewBox: '0 0 24 24',
      path: 'M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20z',
    },
    'folder-open': {
      viewBox: '0 0 24 24',
      path: 'M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h9q.425 0 .713.288T22 7t-.288.713T21 8H7.85q-1.55 0-2.7.975T4 11.45V18l1.975-6.575q.2-.65.738-1.037T7.9 10h12.9q1.025 0 1.613.813t.312 1.762l-1.8 6q-.2.65-.737 1.038T19 20z',
    },
  }

  interface Props {
    name: string
    size?: number
    label?: string
    color?: string
    offsetX?: number
    offsetY?: number
    rotate?: number
    flipX?: boolean
    flipY?: boolean
  }

  let {
    name,
    size = 16,
    label,
    color,
    offsetX = 0,
    offsetY = 0,
    rotate = 0,
    flipX = false,
    flipY = false,
  }: Props = $props()

  const ariaAttrs = $derived(
    label ? `aria-label="${label}"` : 'aria-hidden="true"'
  )

  const custom = $derived(customIcons[name])
  const octicon = $derived(!custom ? octicons[name] : null)
  const featherIcon = $derived(!custom && !octicon ? feather.icons[name] : null)
  const isStrokeIcon = $derived(!!featherIcon)

  const svg = $derived(
    custom
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${custom.viewBox}" fill="currentColor" ${ariaAttrs}><path d="${custom.path}"/></svg>`
      : octicon?.toSVG({
          width: size,
          height: size,
          ...(label ? { 'aria-label': label } : { 'aria-hidden': 'true' }),
        })
      ?? featherIcon?.toSvg({
          width: size,
          height: size,
          ...(label ? { 'aria-label': label } : { 'aria-hidden': 'true' }),
        })
      ?? ''
  )

  const style = $derived(
    [
      color ? `color: ${color}` : '',
      (offsetX || offsetY) ? `translate: ${offsetX}px ${offsetY}px` : '',
      rotate ? `rotate: ${rotate}deg` : '',
      (flipX || flipY) ? `scale: ${flipX ? -1 : 1} ${flipY ? -1 : 1}` : '',
    ].filter(Boolean).join('; ') || undefined
  )
</script>

<span class="storyboard-icon" class:stroke-icon={isStrokeIcon} {style}>
  {@html svg}
</span>

<style>
  .storyboard-icon {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }
  .storyboard-icon:not(.stroke-icon) :global(svg) {
    fill: currentColor;
  }
  .storyboard-icon.stroke-icon :global(svg) {
    fill: none;
  }
</style>
