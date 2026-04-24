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

export function updateCanvas(canvasId, { widgets, sources, settings }) {
  return request('/update', 'PUT', { name: canvasId, widgets, sources, settings })
}

export function addWidget(canvasId, { type, props, position }) {
  return request('/widget', 'POST', { name: canvasId, type, props, position })
}

export function removeWidget(canvasId, widgetId) {
  return request('/widget', 'DELETE', { name: canvasId, widgetId })
}

export function uploadImage(dataUrl, canvasId, filename) {
  const body = { dataUrl, canvasName: canvasId }
  if (filename) body.filename = filename
  return request('/image', 'POST', body)
}

export function toggleImagePrivacy(filename) {
  return request('/image/toggle-private', 'POST', { filename })
}

export function duplicateImage(filename) {
  return request('/image/duplicate', 'POST', { filename })
}

export function getCanvas(canvasId) {
  return request(`/read?name=${encodeURIComponent(canvasId)}`, 'GET')
}

export function checkGitHubCliAvailable() {
  return request('/github/available', 'GET')
}

export function fetchGitHubEmbed(url) {
  return request('/github/embed', 'POST', { url })
}

export function renamePage(canvasId, newTitle) {
  return request('/rename-page', 'PUT', { name: canvasId, newTitle })
}

export function reorderPages(folder, order) {
  return request('/reorder-pages', 'PUT', { folder, order })
}

export function getPageOrder(folder) {
  return request(`/page-order?folder=${encodeURIComponent(folder)}`, 'GET')
}

export function updateFolderMeta(folder, title) {
  return request('/update-folder-meta', 'PUT', { folder, title })
}

export function duplicateCanvas(canvasId, newTitle) {
  return request('/duplicate', 'POST', { name: canvasId, newTitle })
}

export function addConnector(canvasId, { startWidgetId, startAnchor, endWidgetId, endAnchor, connectorType }) {
  return request('/connector', 'POST', {
    name: canvasId,
    startWidgetId,
    startAnchor,
    endWidgetId,
    endAnchor,
    connectorType,
  })
}

export function removeConnector(canvasId, connectorId) {
  return request('/connector', 'DELETE', { name: canvasId, connectorId })
}

export function updateConnector(canvasId, connectorId, meta) {
  return request('/connector', 'PATCH', { name: canvasId, connectorId, meta })
}
