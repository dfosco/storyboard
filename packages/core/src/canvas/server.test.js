import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createCanvasHandler } from './server.js'
import { serializeEvent } from './materializer.js'

/**
 * Helper: create a minimal canvas handler wired to a temp directory.
 * Returns { handler, root, canvasDir, lastResponse }.
 */
function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-canvas-test-'))
  const canvasDir = path.join(root, 'src', 'canvas')
  fs.mkdirSync(canvasDir, { recursive: true })

  const lastResponse = { status: null, body: null }

  const ctx = {
    root,
    sendJson: (_res, status, body) => {
      lastResponse.status = status
      lastResponse.body = body
    },
  }

  const handler = createCanvasHandler(ctx)

  const invoke = (routePath, method, body = {}) =>
    handler(null, null, { path: routePath, method, body })

  return { invoke, root, canvasDir, lastResponse }
}

/**
 * Helper: write a single-page canvas file at src/canvas/{name}.canvas.jsonl
 */
function writeCanvas(canvasDir, name, { title, author, description, jsx } = {}) {
  const event = {
    event: 'canvas_created',
    timestamp: new Date().toISOString(),
    title: title || name,
    grid: true,
    gridSize: 24,
    colorMode: 'auto',
    widgets: [],
  }
  if (author) event.author = author
  if (description) event.description = description
  if (jsx) event.jsx = jsx
  const filePath = path.join(canvasDir, `${name}.canvas.jsonl`)
  fs.writeFileSync(filePath, serializeEvent(event) + '\n', 'utf-8')
  return filePath
}

describe('POST /create with convertFrom', () => {
  let root, canvasDir, invoke, lastResponse

  beforeEach(() => {
    ({ invoke, root, canvasDir, lastResponse } = setup())
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('converts a single-page canvas to a multi-page folder', async () => {
    writeCanvas(canvasDir, 'my-canvas', { title: 'My Canvas', author: 'test' })

    await invoke('/create', 'POST', { name: 'new-page', convertFrom: 'my-canvas' })

    expect(lastResponse.status).toBe(201)
    expect(lastResponse.body.converted).toBe(true)
    expect(lastResponse.body.name).toBe('my-canvas/new-page')
    expect(lastResponse.body.route).toBe('/canvas/my-canvas/new-page')

    // Original file should be moved into the folder
    expect(fs.existsSync(path.join(canvasDir, 'my-canvas.canvas.jsonl'))).toBe(false)
    expect(fs.existsSync(path.join(canvasDir, 'my-canvas', 'my-canvas.canvas.jsonl'))).toBe(true)

    // New page should exist
    expect(fs.existsSync(path.join(canvasDir, 'my-canvas', 'new-page.canvas.jsonl'))).toBe(true)

    // Meta file should exist with correct content
    const metaPath = path.join(canvasDir, 'my-canvas', 'my-canvas.meta.json')
    expect(fs.existsSync(metaPath)).toBe(true)
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    expect(meta.title).toBe('My Canvas')
    expect(meta.author).toBe('test')
  })

  it('preserves description in meta.json', async () => {
    writeCanvas(canvasDir, 'noted', { title: 'Noted', description: 'A described canvas' })

    await invoke('/create', 'POST', { name: 'page-two', convertFrom: 'noted' })

    expect(lastResponse.status).toBe(201)
    const meta = JSON.parse(fs.readFileSync(path.join(canvasDir, 'noted', 'noted.meta.json'), 'utf-8'))
    expect(meta.description).toBe('A described canvas')
  })

  it('rejects convertFrom with path segments', async () => {
    await invoke('/create', 'POST', { name: 'page', convertFrom: 'folder/canvas' })

    expect(lastResponse.status).toBe(400)
    expect(lastResponse.body.error).toContain('flat root canvases')
  })

  it('rejects convertFrom with proto: prefix', async () => {
    await invoke('/create', 'POST', { name: 'page', convertFrom: 'proto:MyApp/board' })

    expect(lastResponse.status).toBe(400)
    expect(lastResponse.body.error).toContain('flat root canvases')
  })

  it('returns 404 when convertFrom canvas does not exist', async () => {
    await invoke('/create', 'POST', { name: 'page', convertFrom: 'nonexistent' })

    expect(lastResponse.status).toBe(404)
  })

  it('rejects when target directory already exists', async () => {
    writeCanvas(canvasDir, 'taken')
    fs.mkdirSync(path.join(canvasDir, 'taken'))

    await invoke('/create', 'POST', { name: 'page', convertFrom: 'taken' })

    expect(lastResponse.status).toBe(409)
    expect(lastResponse.body.error).toContain('already exists')
  })

  it('rejects when new page name collides with existing canvas filename', async () => {
    writeCanvas(canvasDir, 'solo')

    await invoke('/create', 'POST', { name: 'solo', convertFrom: 'solo' })

    expect(lastResponse.status).toBe(409)
    expect(lastResponse.body.error).toContain('collides')
  })
})
