/**
 * Prompt Server — executes AI prompts via the copilot CLI.
 *
 * Endpoints (mounted at /_storyboard/prompt/):
 *   POST /execute  — spawn a copilot agent with the given prompt
 *   GET  /status   — check execution status for a session
 *   GET  /pool     — inspect pool status
 *   PUT  /pool     — reconfigure pool at runtime
 *
 * Uses a pre-warmed session pool (prompt-pool.js) for near-instant
 * prompt execution. When no warm session is available, falls back
 * to cold-starting a new copilot process.
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { materializeFromText } from './materializer.js'
import { PromptPool } from './prompt-pool.js'

const SESSIONS_DIR_NAME = '.prompt-sessions'
const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

/** In-memory session tracking */
const sessions = new Map()

function getSessionsDir(root) {
  const dir = path.join(root, '.storyboard', SESSIONS_DIR_NAME)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function generateSessionId() {
  return `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Find all .canvas.jsonl files and locate the one matching `canvasName`.
 */
function findCanvasPath(root, canvasName) {
  const srcDir = path.join(root, 'src')
  if (!fs.existsSync(srcDir)) return null

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        const result = walk(fullPath)
        if (result) return result
      } else if (entry.name.endsWith('.canvas.jsonl')) {
        const name = entry.name.replace('.canvas.jsonl', '')
        if (name === canvasName) return fullPath
      }
    }
    return null
  }
  return walk(srcDir)
}

/**
 * Read materialized canvas state to extract widget data for connected widgets.
 */
function readCanvasWidgets(root, canvasName) {
  const filePath = findCanvasPath(root, canvasName)
  if (!filePath) return []
  try {
    const text = fs.readFileSync(filePath, 'utf-8')
    const state = materializeFromText(text)
    return state?.widgets || []
  } catch {
    return []
  }
}

/**
 * Serialize connected widget data into structured context for the agent.
 */
function buildConnectedContext(widgets, connectionIds) {
  if (!connectionIds?.length) return ''
  const connected = widgets.filter(w => connectionIds.includes(w.id))
  if (connected.length === 0) return ''

  const parts = connected.map(w => {
    const content = JSON.stringify(w.props, null, 2)
    return `--- Connected widget: ${w.type} (id: ${w.id}) ---\n${content}`
  })
  return '\n\n## Connected Widget Context\n\n' + parts.join('\n\n')
}

/**
 * Build the system prompt that instructs the agent how to produce output.
 */
function buildSystemPrompt({ canvasName, promptPosition, baseUrl, signalFile, connectedContext }) {
  return `You are a canvas prompt agent. The user has submitted a prompt from a canvas widget. Your job is to process their request and create a visible output on the canvas.

## CRITICAL RULES

1. You MUST create at least one output widget on the canvas. No visual output is an error.
2. Interpret the user's request and choose the most appropriate output:
   - Text/summary/analysis → create a **markdown** widget
   - Code/component → create a **markdown** widget with a code block
   - If the request references a connected image and asks to "build" something → create a component or prototype
   - Default: create a **markdown** widget with your response

3. To create an output widget, run this curl command:
   \`\`\`bash
   curl -s -X POST "${baseUrl}/_storyboard/canvas/widget" \\
     -H "Content-Type: application/json" \\
     -d '{"name":"${canvasName}","type":"markdown","props":{"content":"YOUR_MARKDOWN_CONTENT_HERE","width":530},"position":{"x":${(promptPosition?.x ?? 0) + 350},"y":${promptPosition?.y ?? 0}}}'
   \`\`\`

4. After creating the output widget, write a completion signal:
   \`\`\`bash
   echo '{"status":"done"}' > "${signalFile}"
   \`\`\`

5. If you encounter an error you cannot recover from, write an error signal instead:
   \`\`\`bash
   echo '{"status":"error","error":"DESCRIPTION OF ERROR"}' > "${signalFile}"
   \`\`\`

## CONTEXT
${connectedContext || '\nNo connected widgets.'}

## OUTPUT GUIDELINES
- Keep responses concise and well-formatted
- Use markdown formatting (headers, lists, code blocks) for readability
- If creating code, include the full working snippet
- Always tailor the output type to what makes most sense for the request`
}

/**
 * Attach a prompt to a warm session from the pool.
 * Writes the prompt to the process's stdin and wires up output/completion handling.
 */
function attachToWarmSession(warmSession, { sessionId, fullPrompt, signalFile, canvasName, widgetId }) {
  const child = warmSession.process

  sessions.set(sessionId, {
    status: 'pending',
    startedAt: Date.now(),
    widgetId,
    canvasName,
    pid: child.pid,
    poolSessionId: warmSession.id,
    warm: true,
  })

  let stdout = ''
  let stderr = ''

  child.stdout?.on('data', (data) => { stdout += data.toString() })
  child.stderr?.on('data', (data) => { stderr += data.toString() })

  child.on('close', (code) => {
    const session = sessions.get(sessionId)
    if (!session) return

    if (fs.existsSync(signalFile)) {
      try {
        const signal = JSON.parse(fs.readFileSync(signalFile, 'utf-8'))
        session.status = signal.status || 'done'
        session.error = signal.error
        session.resultWidgetId = signal.resultWidgetId
      } catch {
        session.status = 'done'
      }
    } else if (code !== 0) {
      session.status = 'error'
      session.error = stderr || `Process exited with code ${code}`
    } else {
      session.status = 'done'
    }
    session.stdout = stdout
    session.completedAt = Date.now()
  })

  child.on('error', (err) => {
    const session = sessions.get(sessionId)
    if (session) {
      session.status = 'error'
      session.error = err.message
      session.completedAt = Date.now()
    }
  })

  // Set timeout
  setTimeout(() => {
    const session = sessions.get(sessionId)
    if (session && session.status === 'pending') {
      session.status = 'error'
      session.error = 'Prompt execution timed out after 5 minutes'
      session.completedAt = Date.now()
      try { child.kill() } catch { /* ignore */ }
    }
  }, TIMEOUT_MS)

  // Write prompt to stdin and close it — this kicks the process into action
  child.stdin?.write(fullPrompt + '\n')
  child.stdin?.end()
}

/**
 * Cold-start a new copilot process for a prompt (fallback when pool is empty).
 */
function coldStartSession({ sessionId, fullPrompt, signalFile, root, canvasName, widgetId }) {
  const child = spawn('copilot', ['-p', fullPrompt], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      STORYBOARD_CANVAS_NAME: canvasName,
      STORYBOARD_PROMPT_SESSION_ID: sessionId,
      STORYBOARD_SIGNAL_FILE: signalFile,
    },
  })

  sessions.set(sessionId, {
    status: 'pending',
    startedAt: Date.now(),
    widgetId,
    canvasName,
    pid: child.pid,
    warm: false,
  })

  let stdout = ''
  let stderr = ''

  child.stdout?.on('data', (data) => { stdout += data.toString() })
  child.stderr?.on('data', (data) => { stderr += data.toString() })

  child.on('close', (code) => {
    const session = sessions.get(sessionId)
    if (!session) return

    if (fs.existsSync(signalFile)) {
      try {
        const signal = JSON.parse(fs.readFileSync(signalFile, 'utf-8'))
        session.status = signal.status || 'done'
        session.error = signal.error
        session.resultWidgetId = signal.resultWidgetId
      } catch {
        session.status = 'done'
      }
    } else if (code !== 0) {
      session.status = 'error'
      session.error = stderr || `Process exited with code ${code}`
    } else {
      session.status = 'done'
    }
    session.stdout = stdout
    session.completedAt = Date.now()
  })

  child.on('error', (err) => {
    const session = sessions.get(sessionId)
    if (session) {
      session.status = 'error'
      session.error = err.message
      session.completedAt = Date.now()
    }
  })

  setTimeout(() => {
    const session = sessions.get(sessionId)
    if (session && session.status === 'pending') {
      session.status = 'error'
      session.error = 'Prompt execution timed out after 5 minutes'
      session.completedAt = Date.now()
      try { child.kill() } catch { /* ignore */ }
    }
  }, TIMEOUT_MS)

  return child
}

/**
 * Create the prompt route handler.
 * @param {Object} opts
 * @param {string} opts.root — project root
 * @param {Function} opts.sendJson — response helper
 * @param {Object} [opts.config] — storyboard.config.json prompt section
 */
export function createPromptHandler({ root, sendJson, config = {} }) {
  // Ensure sessions directory exists
  getSessionsDir(root)

  // Create and start the session pool
  const pool = new PromptPool({ root, config: config.pool || {} })
  pool.start().catch((err) => {
    console.error('[prompt-server] Failed to start pool:', err.message)
  })

  return async (req, res, { method, path: routePath, body }) => {
    // POST /execute — spawn agent with prompt
    if (routePath === '/execute' && method === 'POST') {
      const { canvasName, widgetId, prompt, connections, widgetPosition } = body || {}

      if (!canvasName || !prompt) {
        sendJson(res, 400, { error: 'canvasName and prompt are required' })
        return
      }

      const sessionId = generateSessionId()
      const sessionsDir = getSessionsDir(root)
      const signalFile = path.join(sessionsDir, `${sessionId}.signal.json`)

      // Read connected widget data
      const widgets = readCanvasWidgets(root, canvasName)
      const connectedContext = buildConnectedContext(widgets, connections)

      // Determine base URL for canvas API calls from the agent
      const baseUrl = `http://localhost:${process.env.STORYBOARD_PORT || '5173'}`

      const systemPrompt = buildSystemPrompt({
        canvasName,
        promptPosition: widgetPosition,
        baseUrl,
        signalFile,
        connectedContext,
      })

      const fullPrompt = `${systemPrompt}\n\n## USER PROMPT\n\n${prompt}`

      // Try to acquire a warm session from the pool
      const warmSession = pool.acquire()

      try {
        if (warmSession) {
          console.log(`[prompt-server] using warm session ${warmSession.id} for ${sessionId}`)
          attachToWarmSession(warmSession, {
            sessionId, fullPrompt, signalFile, canvasName, widgetId,
          })
          pool.release(warmSession.id)
        } else {
          console.log(`[prompt-server] cold-starting session ${sessionId} (pool empty)`)
          coldStartSession({
            sessionId, fullPrompt, signalFile, root, canvasName, widgetId,
          })
        }

        sendJson(res, 200, { sessionId, warm: !!warmSession })
      } catch (err) {
        sessions.delete(sessionId)
        sendJson(res, 500, { error: `Failed to spawn agent: ${err.message}` })
      }
      return
    }

    // GET /status?sessionId=... — check execution status
    if (routePath.startsWith('/status') && method === 'GET') {
      const url = new URL(req.url, 'http://localhost')
      const sessionId = url.searchParams.get('sessionId')

      if (!sessionId) {
        sendJson(res, 400, { error: 'sessionId query parameter is required' })
        return
      }

      const session = sessions.get(sessionId)
      if (!session) {
        sendJson(res, 404, { error: 'Session not found' })
        return
      }

      sendJson(res, 200, {
        status: session.status,
        error: session.error || null,
        resultWidgetId: session.resultWidgetId || null,
        warm: session.warm || false,
      })
      return
    }

    // GET /pool — inspect pool status
    if (routePath === '/pool' && method === 'GET') {
      sendJson(res, 200, pool.status())
      return
    }

    // PUT /pool — reconfigure pool at runtime
    if (routePath === '/pool' && method === 'PUT') {
      const { size, maxSize, enabled } = body || {}
      pool.reconfigure({ size, maxSize, enabled })
      sendJson(res, 200, pool.status())
      return
    }

    // Fallback
    sendJson(res, 404, { error: `Unknown prompt route: ${method} ${routePath}` })
  }
}
