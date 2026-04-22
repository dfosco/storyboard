/**
 * Icon — renders icons from multiple sources using namespaced names.
 *
 *   primer/    → Primer Octicons (fill-based)
 *   feather/   → Feather Icons (stroke-based)
 *   iconoir/   → Iconoir (stroke-based, manually registered)
 *   (no prefix) → Custom (folder, prototype, canvas, component, etc.)
 *
 * Usage:
 *   <Icon name="primer/repo" />
 *   <Icon name="feather/flag" size={16} />
 *   <Icon name="iconoir/key-command" size={16} strokeWeight={2} />
 *   <Icon name="prototype" size={14} />
 *   <Icon name="feather/tablet" rotate={90} />
 *   <Icon name="primer/lock" offsetX={1} offsetY={-1} />
 *   <Icon name="feather/arrow-right" flipX />
 */

/* ─── Custom SVG paths (fill-based, no namespace prefix) ─── */

const customIcons = {
  'home': {
    viewBox: '0 0 16 16',
    path: 'M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H5.5V8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v5.25h2.75a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z',
  },
  'folder': {
    viewBox: '0 0 24 24',
    path: 'M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20z',
  },
  'folder-open': {
    viewBox: '0 0 24 24',
    path: 'M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h9q.425 0 .713.288T22 7t-.288.713T21 8H7.85q-1.55 0-2.7.975T4 11.45V18l1.975-6.575q.2-.65.738-1.037T7.9 10h12.9q1.025 0 1.613.813t.312 1.762l-1.8 6q-.2.65-.737 1.038T19 20z',
  },
  // CollageFrame icon (from PrototypeEmbed widget title bar)
  'prototype': {
    viewBox: '0 0 24 24',
    strokePaths: [
      'M19.4 20H4.6C4.26863 20 4 19.7314 4 19.4V4.6C4 4.26863 4.26863 4 4.6 4H19.4C19.7314 4 20 4.26863 20 4.6V19.4C20 19.7314 19.7314 20 19.4 20Z',
      'M11 12V4',
      'M4 12H20',
    ],
  },
  // Diamond grid icon (from StoryWidget/ComponentWidget title bar)
  'component': {
    viewBox: '0 0 24 24',
    strokePaths: [
      'M5.21173 15.1113L2.52473 12.4243C2.29041 12.1899 2.29041 11.8101 2.52473 11.5757L5.21173 8.88873C5.44605 8.65442 5.82595 8.65442 6.06026 8.88873L8.74727 11.5757C8.98158 11.8101 8.98158 12.1899 8.74727 12.4243L6.06026 15.1113C5.82595 15.3456 5.44605 15.3456 5.21173 15.1113Z',
      'M11.5757 21.475L8.88874 18.788C8.65443 18.5537 8.65443 18.1738 8.88874 17.9395L11.5757 15.2525C11.8101 15.0182 12.19 15.0182 12.4243 15.2525L15.1113 17.9395C15.3456 18.1738 15.3456 18.5537 15.1113 18.788L12.4243 21.475C12.19 21.7094 11.8101 21.7094 11.5757 21.475Z',
      'M17.9395 15.1113L15.2525 12.4243C15.0182 12.1899 15.0182 11.8101 15.2525 11.5757L17.9395 8.88873C18.1738 8.65442 18.5537 8.65442 18.788 8.88873L21.475 11.5757C21.7094 11.8101 21.7094 12.1899 21.475 12.4243L18.788 15.1113C18.5537 15.3456 18.1738 15.3456 17.9395 15.1113Z',
      'M11.5757 8.74727L8.88874 6.06026C8.65443 5.82595 8.65443 5.44605 8.88874 5.21173L11.5757 2.52473C11.8101 2.29041 12.19 2.29041 12.4243 2.52473L15.1113 5.21173C15.3456 5.44605 15.3456 5.82595 15.1113 6.06026L12.4243 8.74727C12.19 8.98158 11.8101 8.98158 11.5757 8.74727Z',
    ],
  },
  // Smiley face icon (from assets/icons/canvas.svg)
  'canvas': {
    viewBox: '0 0 28 23',
    strokeRect: { x: 1, y: 1, width: 26, height: 21, rx: 7 },
    fillPaths: [
      'M17.8421 12.9776V12.9788L17.8409 12.9812C18.2386 12.451 18.9901 12.3434 19.5204 12.7409C20.0506 13.1385 20.1582 13.8901 19.7606 14.4204L18.8008 13.7008C19.7416 14.4064 19.7606 14.4209 19.7606 14.4215L19.7583 14.4239C19.7573 14.4252 19.756 14.427 19.7548 14.4286C19.7524 14.4317 19.7499 14.436 19.7466 14.4403C19.7399 14.449 19.7311 14.4601 19.7208 14.4731C19.7001 14.4992 19.6715 14.5332 19.6364 14.5751C19.566 14.6589 19.4665 14.7734 19.3387 14.9067C19.0842 15.1723 18.712 15.5216 18.2312 15.8713C17.2736 16.5677 15.831 17.3011 14.0003 17.3011C12.1695 17.3011 10.727 16.5677 9.76938 15.8713C9.28854 15.5216 8.91634 15.1723 8.66184 14.9067C8.53409 14.7734 8.43453 14.6589 8.36415 14.5751C8.32905 14.5332 8.30044 14.4992 8.27977 14.4731C8.26946 14.4601 8.26066 14.449 8.25398 14.4403C8.25066 14.436 8.24819 14.4317 8.24578 14.4286C8.24457 14.427 8.24325 14.4252 8.24226 14.4239L8.23992 14.4215C8.24001 14.4209 8.25896 14.4064 9.19979 13.7008L8.23992 14.4204C7.8424 13.8901 7.94999 13.1385 8.48018 12.7409C9.01029 12.3435 9.76077 12.4513 10.1585 12.9812L10.1597 12.98L10.1585 12.9776H10.1573C10.1583 12.9789 10.1602 12.9801 10.162 12.9823C10.1691 12.9914 10.182 13.0091 10.2018 13.0327C10.2416 13.08 10.3064 13.1534 10.394 13.2449C10.5708 13.4293 10.8366 13.6804 11.1805 13.9305C11.873 14.4341 12.8308 14.9009 14.0003 14.9009C15.1698 14.9009 16.1276 14.4341 16.8201 13.9305C17.164 13.6804 17.4298 13.4293 17.6065 13.2449C17.6942 13.1534 17.759 13.08 17.7987 13.0327C17.8186 13.0091 17.8314 12.9914 17.8386 12.9823L17.8421 12.9776Z',
      'M10.4111 6.5C11.0739 6.5 11.6112 7.03731 11.6112 7.70012C11.6112 8.36293 11.0739 8.90025 10.4111 8.90025H10.3993C9.73653 8.90025 9.19922 8.36293 9.19922 7.70012C9.19922 7.03731 9.73653 6.5 10.3993 6.5H10.4111Z',
      'M17.6103 6.5C18.2731 6.5 18.8104 7.03731 18.8104 7.70012C18.8104 8.36293 18.2731 8.90025 17.6103 8.90025H17.5986C16.9358 8.90025 16.3984 8.36293 16.3984 7.70012C16.3984 7.03731 16.9358 6.5 17.5986 6.5H17.6103Z',
    ],
  },
  'flow': {
    viewBox: '0 0 24 24',
    strokeWidth: '2.5',
    strokePaths: [
      'M13 19L22 12L13 5L13 19Z',
      'M2 19L11 12L2 5L2 19Z',
    ],
  },
}

/* ─── Iconoir icons (stroke-based unless fill: true) ─── */

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
  'view-grid': {
    viewBox: '0 0 24 24',
    strokeWidth: '1.5',
    content: '<path d="M14 20.4V14.6C14 14.2686 14.2686 14 14.6 14H20.4C20.7314 14 21 14.2686 21 14.6V20.4C21 20.7314 20.7314 21 20.4 21H14.6C14.2686 21 14 20.7314 14 20.4Z" stroke="currentColor" stroke-width="1.5"/><path d="M3 20.4V14.6C3 14.2686 3.26863 14 3.6 14H9.4C9.73137 14 10 14.2686 10 14.6V20.4C10 20.7314 9.73137 21 9.4 21H3.6C3.26863 21 3 20.7314 3 20.4Z" stroke="currentColor" stroke-width="1.5"/><path d="M14 9.4V3.6C14 3.26863 14.2686 3 14.6 3H20.4C20.7314 3 21 3.26863 21 3.6V9.4C21 9.73137 20.7314 10 20.4 10H14.6C14.2686 10 14 9.73137 14 9.4Z" stroke="currentColor" stroke-width="1.5"/><path d="M3 9.4V3.6C3 3.26863 3.26863 3 3.6 3H9.4C9.73137 3 10 3.26863 10 3.6V9.4C10 9.73137 9.73137 10 9.4 10H3.6C3.26863 10 3 9.73137 3 9.4Z" stroke="currentColor" stroke-width="1.5"/>',
  },
  'square-3d-three-points': {
    viewBox: '0 0 24 24',
    strokeWidth: '1.5',
    content: '<path d="M3 21V3.6C3 3.26863 3.26863 3 3.6 3H21" stroke="currentColor"/><path d="M17 21H20.4C20.7314 21 21 20.7314 21 20.4V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 7V9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12V14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 21H9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 21H14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 4C3.55228 4 4 3.55228 4 3C4 2.44772 3.55228 2 3 2C2.44772 2 2 2.44772 2 3C2 3.55228 2.44772 4 3 4Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 22C3.55228 22 4 21.5523 4 21C4 20.4477 3.55228 20 3 20C2.44772 20 2 20.4477 2 21C2 21.5523 2.44772 22 3 22Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 4C21.5523 4 22 3.55228 22 3C22 2.44772 21.5523 2 21 2C20.4477 2 20 2.44772 20 3C20 3.55228 20.4477 4 21 4Z" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>',
  },
}

/* ─── React Component ─── */

import octicons from '@primer/octicons'
import feather from 'feather-icons'

/**
 * @param {object} props
 * @param {string} props.name - Namespaced icon name: primer/, feather/, iconoir/, or plain custom name
 * @param {number} [props.size=16]
 * @param {string} [props.label] - Accessible label (sets aria-label instead of aria-hidden)
 * @param {string} [props.color]
 * @param {number} [props.offsetX=0]
 * @param {number} [props.offsetY=0]
 * @param {number} [props.rotate=0]
 * @param {boolean} [props.flipX=false]
 * @param {boolean} [props.flipY=false]
 * @param {number} [props.strokeWeight] - Override stroke width
 * @param {number} [props.scale=1]
 * @param {string} [props.className]
 */
export default function Icon({
  name, size = 16, label, color,
  offsetX = 0, offsetY = 0, rotate = 0,
  flipX = false, flipY = false,
  strokeWeight, scale = 1, className,
}) {
  const source = name.includes('/') ? name.split('/')[0] : null
  const iconName = name.includes('/') ? name.slice(name.indexOf('/') + 1) : name

  const ariaProps = label ? { 'aria-label': label, role: 'img' } : { 'aria-hidden': true }

  // Build wrapper style with all transform props
  const scaleX = (flipX ? -1 : 1) * scale
  const scaleY = (flipY ? -1 : 1) * scale
  const hasTransform = offsetX || offsetY || rotate || flipX || flipY || scale !== 1
  const wrapperStyle = {
    ...(color ? { color } : {}),
    display: 'inline-flex',
    ...(hasTransform ? {
      translate: (offsetX || offsetY) ? `${offsetX}px ${offsetY}px` : undefined,
      rotate: rotate ? `${rotate}deg` : undefined,
      scale: (flipX || flipY || scale !== 1) ? `${scaleX} ${scaleY}` : undefined,
    } : {}),
  }

  let svgContent = null

  // Custom icons (no source prefix)
  const custom = !source ? customIcons[iconName] : null
  if (custom) {
    if (custom.path) {
      svgContent = (
        <svg width={size} height={size} viewBox={custom.viewBox} fill="currentColor" {...ariaProps}>
          <path d={custom.path} />
        </svg>
      )
    } else if (custom.strokePaths) {
      svgContent = (
        <svg width={size} height={size} viewBox={custom.viewBox} fill="none" stroke="currentColor" strokeWidth={strokeWeight ?? custom.strokeWidth ?? '1.5'} strokeLinecap="round" strokeLinejoin="round" {...ariaProps}>
          {custom.strokePaths.map((d, i) => <path key={i} d={d} />)}
        </svg>
      )
    } else if (custom.strokeRect || custom.fillPaths) {
      svgContent = (
        <svg width={size} height={size} viewBox={custom.viewBox} fill="none" stroke="currentColor" strokeWidth={strokeWeight ?? '2'} {...ariaProps}>
          {custom.strokeRect && <rect {...custom.strokeRect} />}
          {custom.fillPaths?.map((d, i) => <path key={i} d={d} fill="currentColor" stroke="none" />)}
        </svg>
      )
    }
  }

  // Primer Octicons
  if (!svgContent && source === 'primer') {
    const octicon = octicons[iconName]
    if (octicon) {
      const html = octicon.toSVG({
        width: size, height: size,
        ...(label ? { 'aria-label': label } : { 'aria-hidden': 'true' }),
      })
      svgContent = <span dangerouslySetInnerHTML={{ __html: html }} />
    }
  }

  // Feather Icons
  if (!svgContent && source === 'feather') {
    const icon = feather.icons[iconName]
    if (icon) {
      const html = icon.toSvg({
        width: size, height: size,
        'stroke-width': strokeWeight ?? 2,
        ...(label ? { 'aria-label': label } : { 'aria-hidden': 'true' }),
      })
      svgContent = <span dangerouslySetInnerHTML={{ __html: html }} />
    }
  }

  // Iconoir icons
  if (!svgContent && source === 'iconoir') {
    const iconoir = iconoirIcons[iconName]
    if (iconoir) {
      const sw = strokeWeight ?? iconoir.strokeWidth
      svgContent = (
        <svg
          width={size} height={size} viewBox={iconoir.viewBox}
          fill={iconoir.fill ? 'currentColor' : 'none'}
          strokeWidth={iconoir.fill ? undefined : sw}
          {...ariaProps}
          dangerouslySetInnerHTML={{ __html: iconoir.content }}
        />
      )
    }
  }

  if (!svgContent) return null

  return <span className={className} style={wrapperStyle}>{svgContent}</span>
}

export { Icon }
