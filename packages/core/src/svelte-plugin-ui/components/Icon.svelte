<!--
  Icon — renders icons from multiple sources using namespaced names.

  Sources (by namespace prefix):
    primer/    → Primer Octicons (fill-based)
    feather/   → Feather Icons (stroke-based)
    iconoir/   → Iconoir (stroke-based, manually registered)
    (no prefix) → Custom overrides (folder, folder-open)

  Usage:
    <Icon name="primer/repo" />
    <Icon name="folder" color="#54aeff" />
    <Icon name="feather/fast-forward" size={16} />
    <Icon name="iconoir/square-dashed" size={16} strokeWeight={2} scale={1.05} />
    <Icon name="primer/gear" size={16} label="Settings" />
    <Icon name="feather/tablet" rotate={90} />
    <Icon name="primer/lock" offsetX={1} offsetY={-1} />
    <Icon name="feather/arrow-right" flipX />
-->

<script lang="ts">
  import octicons from '@primer/octicons'
  import feather from 'feather-icons'

  // Custom SVG paths (fill-based, no namespace prefix).
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

  // Iconoir icons — stroke-based, registered manually.
  // To add a new icon: copy inner paths from node_modules/iconoir/icons/regular/{name}.svg
  const iconoirIcons: Record<string, { viewBox: string; strokeWidth: string; content: string }> = {
    'square-dashed': {
      viewBox: '0 0 24 24',
      strokeWidth: '1.5',
      content: '<path d="M7 4H4V7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 11V13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 4H13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 20H13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 11V13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 4H20V7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 20H4V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 20H20V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>',
    },
    'key-command': {
      viewBox: '0 0 24 24',
      strokeWidth: '1.5',
      content: '<path d="M9 6V18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6V18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9H18C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15H18C19.6569 15 21 16.3431 21 18C21 19.6569 19.6569 21 18 21C16.3431 21 15 19.6569 15 18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>',
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
    strokeWeight?: number
    scale?: number
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
    strokeWeight,
    scale = 1,
  }: Props = $props()

  const ariaAttrs = $derived(
    label ? `aria-label="${label}"` : 'aria-hidden="true"'
  )

  // Parse "source/icon-name" — no slash means custom icon
  const source = $derived(name.includes('/') ? name.split('/')[0] : null)
  const iconName = $derived(name.includes('/') ? name.slice(name.indexOf('/') + 1) : name)

  const custom = $derived(!source ? customIcons[iconName] : null)
  const octicon = $derived(source === 'primer' ? octicons[iconName] : null)
  const featherIcon = $derived(source === 'feather' ? feather.icons[iconName] : null)
  const iconoir = $derived(source === 'iconoir' ? iconoirIcons[iconName] : null)
  const isStrokeIcon = $derived(source === 'feather' || source === 'iconoir')

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
          'stroke-width': strokeWeight ?? 2,
          ...(label ? { 'aria-label': label } : { 'aria-hidden': 'true' }),
        })
      ?? (iconoir
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${iconoir.viewBox}" fill="none" stroke-width="${strokeWeight ?? iconoir.strokeWidth}" ${ariaAttrs}>${iconoir.content}</svg>`
          : '')
  )

  const scaleX = $derived((flipX ? -1 : 1) * scale)
  const scaleY = $derived((flipY ? -1 : 1) * scale)
  const hasScale = $derived(flipX || flipY || scale !== 1)

  const style = $derived(
    [
      color ? `color: ${color}` : '',
      (offsetX || offsetY) ? `translate: ${offsetX}px ${offsetY}px` : '',
      rotate ? `rotate: ${rotate}deg` : '',
      hasScale ? `scale: ${scaleX} ${scaleY}` : '',
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
