export function getCanvasPrimerAttrs(theme) {
  if (String(theme || 'light') === 'dark_dimmed') {
    return {
      'data-color-mode': 'dark',
      'data-dark-theme': 'dark_dimmed',
      'data-light-theme': 'light',
    }
  }
  if (String(theme || 'light').startsWith('dark')) {
    return {
      'data-color-mode': 'dark',
      'data-dark-theme': 'dark',
      'data-light-theme': 'light',
    }
  }
  return {
    'data-color-mode': 'light',
    'data-dark-theme': 'dark',
    'data-light-theme': 'light',
  }
}

export function getCanvasThemeVars(theme) {
  const value = String(theme || 'light')
  if (value === 'dark_dimmed') {
    return {
      '--sb--canvas-bg': '#22272e',
      '--bgColor-default': '#22272e',
      '--bgColor-muted': '#22272e',
      '--bgColor-neutral-muted': 'rgba(99, 110, 123, 0.3)',
      '--bgColor-accent-emphasis': '#316dca',
      '--tc-bg-muted': '#22272e',
      '--tc-dot-color': 'rgba(205, 217, 229, 0.22)',
      '--overlay-backdrop-bgColor': 'rgba(205, 217, 229, 0.22)',
      '--fgColor-muted': '#768390',
      '--fgColor-default': '#adbac7',
      '--fgColor-onEmphasis': '#ffffff',
      '--borderColor-default': '#444c56',
      '--borderColor-muted': '#545d68',
    }
  }
  if (value.startsWith('dark')) {
    return {
      '--sb--canvas-bg': '#161b22',
      '--bgColor-default': '#161b22',
      '--bgColor-muted': '#161b22',
      '--bgColor-neutral-muted': 'rgba(110, 118, 129, 0.2)',
      '--bgColor-accent-emphasis': '#2f81f7',
      '--tc-bg-muted': '#161b22',
      '--tc-dot-color': 'rgba(255, 255, 255, 0.1)',
      '--overlay-backdrop-bgColor': 'rgba(255, 255, 255, 0.1)',
      '--fgColor-muted': '#8b949e',
      '--fgColor-default': '#e6edf3',
      '--fgColor-onEmphasis': '#ffffff',
      '--borderColor-default': '#30363d',
      '--borderColor-muted': '#30363d',
    }
  }
  return {
    '--sb--canvas-bg': '#f6f8fa',
    '--bgColor-default': '#ffffff',
    '--tc-bg-muted': '#f6f8fa',
    '--tc-dot-color': 'rgba(0, 0, 0, 0.08)',
    '--overlay-backdrop-bgColor': 'rgba(0, 0, 0, 0.08)',
    '--bgColor-muted': '#f6f8fa',
    '--bgColor-neutral-muted': '#eaeef2',
    '--bgColor-accent-emphasis': '#2f81f7',
    '--fgColor-muted': '#656d76',
    '--fgColor-default': '#1f2328',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#d1d9e0',
    '--borderColor-muted': '#d8dee4',
  }
}
