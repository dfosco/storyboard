/**
 * Icon — renders icons from multiple sources using namespaced names.
 *
 * Sources (by namespace prefix):
 *   primer/    → Primer Octicons (fill-based)
 *   feather/   → Feather Icons (stroke-based)
 *   iconoir/   → Iconoir (stroke-based, manually registered)
 *   (no prefix) → Custom overrides (folder, folder-open)
 *
 * Usage:
 *   <Icon name="primer/repo" />
 *   <Icon name="folder" color="#54aeff" />
 *   <Icon name="feather/fast-forward" size={16} />
 *   <Icon name="iconoir/square-dashed" size={16} strokeWeight={2} scale={1.05} />
 *   <Icon name="primer/gear" size={16} label="Settings" />
 *   <Icon name="feather/tablet" rotate={90} />
 *   <Icon name="primer/lock" offsetX={1} offsetY={-1} />
 *   <Icon name="feather/arrow-right" flipX />
 */

import React, { useMemo, useRef, useEffect } from 'react'
import octicons from '@primer/octicons'
import feather from 'feather-icons'

// Custom SVG paths (fill-based, no namespace prefix).
const customIcons = {
  'folder': {
    viewBox: '0 0 24 24',
    path: 'M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20z',
  },
  'folder-open': {
    viewBox: '0 0 24 24',
    path: 'M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h9q.425 0 .713.288T22 7t-.288.713T21 8H7.85q-1.55 0-2.7.975T4 11.45V18l1.975-6.575q.2-.65.738-1.037T7.9 10h12.9q1.025 0 1.613.813t.312 1.762l-1.8 6q-.2.65-.737 1.038T19 20z',
  },
}

// Iconoir icons — registered manually from iconoir package.
// To add: copy inner paths from node_modules/iconoir/icons/{regular|solid}/{name}.svg
// Set fill: true for solid/fill-based icons (default: false = stroke-based)
const iconoirIcons = {
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
  'plus-circle': {
    viewBox: '0 0 24 24',
    strokeWidth: '1.5',
    content: '<path d="M8 12H12M16 12H12M12 12V8M12 12V16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'plus-circle-solid': {
    viewBox: '0 0 24 24',
    fill: true,
    content: '<path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM12.75 8C12.75 7.58579 12.4142 7.25 12 7.25C11.5858 7.25 11.25 7.58579 11.25 8V11.25H8C7.58579 11.25 7.25 11.5858 7.25 12C7.25 12.4142 7.58579 12.75 8 12.75H11.25V16C11.25 16.4142 11.5858 16.75 12 16.75C12.4142 16.75 12.75 16.4142 12.75 16V12.75H16C16.4142 12.75 16.75 12.4142 16.75 12C16.75 11.5858 16.4142 11.25 16 11.25H12.75V8Z" fill="currentColor"/>',
  },
  'grid-plus': {
    viewBox: '0 0 24 24',
    strokeWidth: '1.5',
    content: '<path d="M13.9922 17H16.9922M19.9922 17H16.9922M16.9922 17V14M16.9922 17V20" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9.4V4.6C4 4.26863 4.26863 4 4.6 4H9.4C9.73137 4 10 4.26863 10 4.6V9.4C10 9.73137 9.73137 10 9.4 10H4.6C4.26863 10 4 9.73137 4 9.4Z" stroke="currentColor" stroke-width="1.5"/><path d="M4 19.4V14.6C4 14.2686 4.26863 14 4.6 14H9.4C9.73137 14 10 14.2686 10 14.6V19.4C10 19.7314 9.73137 20 9.4 20H4.6C4.26863 20 4 19.7314 4 19.4Z" stroke="currentColor" stroke-width="1.5"/><path d="M14 9.4V4.6C14 4.26863 14.2686 4 14.6 4H19.4C19.7314 4 20 4.26863 20 4.6V9.4C20 9.73137 19.7314 10 19.4 10H14.6C14.2686 10 14 9.73137 14 9.4Z" stroke="currentColor" stroke-width="1.5"/>',
  },
  'dots-grid-3x3': {
    viewBox: '0 0 24 24',
    strokeWidth: '1.5',
    content: '<path d="M5.5 6C5.77614 6 6 5.77614 6 5.5C6 5.22386 5.77614 5 5.5 5C5.22386 5 5 5.22386 5 5.5C5 5.77614 5.22386 6 5.5 6Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 12.5C5.77614 12.5 6 12.2761 6 12C6 11.7239 5.77614 11.5 5.5 11.5C5.22386 11.5 5 11.7239 5 12C5 12.2761 5.22386 12.5 5.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 19C5.77614 19 6 18.7761 6 18.5C6 18.2239 5.77614 18 5.5 18C5.22386 18 5 18.2239 5 18.5C5 18.7761 5.22386 19 5.5 19Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6C12.2761 6 12.5 5.77614 12.5 5.5C12.5 5.22386 12.2761 5 12 5C11.7239 5 11.5 5.22386 11.5 5.5C11.5 5.77614 11.7239 6 12 6Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 12.5C12.2761 12.5 12.5 12.2761 12.5 12C12.5 11.7239 12.2761 11.5 12 11.5C11.7239 11.5 11.5 11.7239 11.5 12C11.5 12.2761 11.7239 12.5 12 12.5Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 19C12.2761 19 12.5 18.7761 12.5 18.5C12.5 18.2239 12.2761 18 12 18C11.7239 18 11.5 18.2239 11.5 18.5C11.5 18.7761 11.7239 19 12 19Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 6C18.7761 6 19 5.77614 19 5.5C19 5.22386 18.7761 5 18.5 5C18.2239 5 18 5.22386 18 5.5C18 5.77614 18.2239 6 18.5 6Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 12.5C18.7761 12.5 19 12.2761 19 12C19 11.7239 18.7761 11.5 18.5 11.5C18.2239 11.5 18 11.7239 18 12C18 12.2761 18.2239 12.5 18.5 12.5Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 19C18.7761 19 19 18.7761 19 18.5C19 18.2239 18.7761 18 18.5 18C18.2239 18 18 18.2239 18 18.5C18 18.7761 18.2239 19 18.5 19Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'view-grid': {
    viewBox: '0 0 24 24',
    strokeWidth: '1.5',
    content: '<path d="M14 20.4V14.6C14 14.2686 14.2686 14 14.6 14H20.4C20.7314 14 21 14.2686 21 14.6V20.4C21 20.7314 20.7314 21 20.4 21H14.6C14.2686 21 14 20.7314 14 20.4Z" stroke="currentColor" stroke-width="1.5"/><path d="M3 20.4V14.6C3 14.2686 3.26863 14 3.6 14H9.4C9.73137 14 10 14.2686 10 14.6V20.4C10 20.7314 9.73137 21 9.4 21H3.6C3.26863 21 3 20.7314 3 20.4Z" stroke="currentColor" stroke-width="1.5"/><path d="M14 9.4V3.6C14 3.26863 14.2686 3 14.6 3H20.4C20.7314 3 21 3.26863 21 3.6V9.4C21 9.73137 20.7314 10 20.4 10H14.6C14.2686 10 14 9.73137 14 9.4Z" stroke="currentColor" stroke-width="1.5"/><path d="M3 9.4V3.6C3 3.26863 3.26863 3 3.6 3H9.4C9.73137 3 10 3.26863 10 3.6V9.4C10 9.73137 9.73137 10 9.4 10H3.6C3.26863 10 3 9.73137 3 9.4Z" stroke="currentColor" stroke-width="1.5"/>',
  },
  'dots-grid-3x3-solid': {
    viewBox: '0 0 24 24',
    fill: true,
    content: '<rect x="2.25" y="2.25" width="19.5" height="19.5" rx="1.35" fill="currentColor"/><circle cx="5.5" cy="5.5" r="1.25" fill="var(--sb--trigger-bg, var(--color-slate-100))"/><circle cx="5.5" cy="12" r="1.25" fill="var(--sb--trigger-bg, var(--color-slate-100))"/><circle cx="5.5" cy="18.5" r="1.25" fill="var(--sb--trigger-bg, var(--color-slate-100))"/><circle cx="12" cy="5.5" r="1.25" fill="var(--sb--trigger-bg, var(--color-slate-100))"/><circle cx="12" cy="12" r="1.25" fill="var(--sb--trigger-bg, var(--color-slate-100))"/><circle cx="12" cy="18.5" r="1.25" fill="var(--sb--trigger-bg, var(--color-slate-100))"/><circle cx="18.5" cy="5.5" r="1.25" fill="var(--sb--trigger-bg, var(--color-slate-100))"/><circle cx="18.5" cy="12" r="1.25" fill="var(--sb--trigger-bg, var(--color-slate-100))"/><circle cx="18.5" cy="18.5" r="1.25" fill="var(--sb--trigger-bg, var(--color-slate-100))"/>',
  },
  'square-3d-three-points': {
    viewBox: '0 0 24 24',
    strokeWidth: '1.5',
    content: '<path d="M3 21V3.6C3 3.26863 3.26863 3 3.6 3H21" stroke="currentColor"/><path d="M17 21H20.4C20.7314 21 21 20.7314 21 20.4V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 7V9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12V14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 21H9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 21H14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 4C3.55228 4 4 3.55228 4 3C4 2.44772 3.55228 2 3 2C2.44772 2 2 2.44772 2 3C2 3.55228 2.44772 4 3 4Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 22C3.55228 22 4 21.5523 4 21C4 20.4477 3.55228 20 3 20C2.44772 20 2 20.4477 2 21C2 21.5523 2.44772 22 3 22Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 4C21.5523 4 22 3.55228 22 3C22 2.44772 21.5523 2 21 2C20.4477 2 20 2.44772 20 3C20 3.55228 20.4477 4 21 4Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'select-point-3d': {
    viewBox: '0 0 24 24',
    strokeWidth: '1.5',
    content: '<path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 7.35304L21 16.647C21 16.8649 20.8819 17.0656 20.6914 17.1715L12.2914 21.8381C12.1102 21.9388 11.8898 21.9388 11.7086 21.8381L3.30861 17.1715C3.11814 17.0656 3 16.8649 3 16.647L2.99998 7.35304C2.99998 7.13514 3.11812 6.93437 3.3086 6.82855L11.7086 2.16188C11.8898 2.06121 12.1102 2.06121 12.2914 2.16188L20.6914 6.82855C20.8818 6.93437 21 7.13514 21 7.35304Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>',
  },
}

function buildSvgHtml({
  source, iconName, size, label, strokeWeight,
}) {
  const ariaAttrs = label ? `aria-label="${label}"` : 'aria-hidden="true"'
  const custom = !source ? customIcons[iconName] : null
  const octicon = source === 'primer' ? octicons[iconName] : null
  const featherIcon = source === 'feather' ? feather.icons[iconName] : null
  const iconoir = source === 'iconoir' ? iconoirIcons[iconName] : null

  if (custom) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${custom.viewBox}" fill="currentColor" ${ariaAttrs}><path d="${custom.path}"/></svg>`
  }
  if (octicon) {
    return octicon.toSVG({
      width: size,
      height: size,
      ...(label ? { 'aria-label': label } : { 'aria-hidden': 'true' }),
    })
  }
  if (featherIcon) {
    return featherIcon.toSvg({
      width: size,
      height: size,
      'stroke-width': strokeWeight ?? 2,
      ...(label ? { 'aria-label': label } : { 'aria-hidden': 'true' }),
    })
  }
  if (iconoir) {
    if (iconoir.fill) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${iconoir.viewBox}" fill="currentColor" ${ariaAttrs}>${iconoir.content}</svg>`
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${iconoir.viewBox}" fill="none" stroke-width="${strokeWeight ?? iconoir.strokeWidth}" ${ariaAttrs}>${iconoir.content}</svg>`
  }
  return ''
}

export function Icon({
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
}) {
  const source = name.includes('/') ? name.split('/')[0] : null
  const iconName = name.includes('/') ? name.slice(name.indexOf('/') + 1) : name
  const isStrokeIcon = source === 'feather' || (source === 'iconoir' && !iconoirIcons[iconName]?.fill)

  const svg = useMemo(
    () => buildSvgHtml({ source, iconName, size, label, strokeWeight }),
    [source, iconName, size, label, strokeWeight],
  )

  const scaleX = (flipX ? -1 : 1) * scale
  const scaleY = (flipY ? -1 : 1) * scale
  const hasScale = flipX || flipY || scale !== 1

  const cssText = useMemo(() => {
    const parts = [
      color ? `color: ${color}` : '',
      (offsetX || offsetY) ? `translate: ${offsetX}px ${offsetY}px` : '',
      rotate ? `rotate: ${rotate}deg` : '',
      hasScale ? `scale: ${scaleX} ${scaleY}` : '',
    ].filter(Boolean)
    return parts.length ? parts.join('; ') : ''
  }, [color, offsetX, offsetY, rotate, hasScale, scaleX, scaleY])

  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.cssText = cssText
    }
  }, [cssText])

  const className = [
    'storyboard-icon',
    isStrokeIcon ? 'stroke-icon' : '',
  ].filter(Boolean).join(' ')

  return (
    <span
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default Icon
