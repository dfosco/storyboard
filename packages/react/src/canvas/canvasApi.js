/**
 * Client-side API for canvas CRUD operations.
 * Calls the /_storyboard/canvas/ server endpoints.
 */

const BASE = '/_storyboard/canvas'

function getApiBase() {
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
  return base + BASE
}

async function request(path, method, body) {
  const url = getApiBase() + path
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export function listCanvases() {
  return request('/list', 'GET')
}

export function createCanvas(data) {
  return request('/create', 'POST', data)
}

export function updateCanvas(name, { widgets, sources, settings }) {
  return request('/update', 'PUT', { name, widgets, sources, settings })
}

export function addWidget(name, { type, props, position }) {
  return request('/widget', 'POST', { name, type, props, position })
}

export function removeWidget(name, widgetId) {
  return request('/widget', 'DELETE', { name, widgetId })
}

export function uploadImage(dataUrl, canvasName) {
  return request('/image', 'POST', { dataUrl, canvasName })
}

export function toggleImagePrivacy(filename) {
  return request('/image/toggle-private', 'POST', { filename })
}

export function getCanvas(name) {
  return request(`/read?name=${encodeURIComponent(name)}`, 'GET')
}
