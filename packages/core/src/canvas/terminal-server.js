/**
 * Terminal Server — WebSocket PTY backend for terminal canvas widgets.
 *
 * Uses tmux for session persistence across page refreshes. Each terminal
 * widget gets a tmux session with an opaque name (hash of branch + canvas +
 * widget). On disconnect the pty process is killed (detaching from tmux)
 * but the tmux session stays alive. On reconnect the existing tmux session
 * is reattached.
 *
 * Session lifecycle is managed by terminal-registry.js which persists
 * session metadata to `.storyboard/terminal-sessions.json`.
 *
 * Falls back to direct shell spawn when tmux is not available.
 *
 * Dev-only — this runs inside the Vite dev server, same trust model.
 *
 * Protocol:
 *   Client → Server:  text (stdin to PTY)
 *   Client → Server:  JSON { type: "resize", cols, rows }
 *   Server → Client:  text (stdout from PTY)
 *   Server → Client:  JSON { type: "conflict", ... }
 *   Server → Client:  JSON { type: "session-info", ... }
 */

import { execSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'

let WebSocketServer
try {
  WebSocketServer = (await import('ws')).WebSocketServer
} catch {
  WebSocketServer = null
}
import {
  initRegistry,
  registerSession,
  disconnectSession,
  orphanSession,
  generateTmuxName,
  findTmuxNameForWidget,
  killSession,
} from './terminal-registry.js'
import {
  writeTerminalConfig as writeTermConfig,
  initTerminalConfig,
  readTerminalConfigById,
  updatePendingMessages,
} from './terminal-config.js'
import { findByWorktree } from '../worktree/serverRegistry.js'
import { detectWorktreeName } from '../worktree/port.js'

let pty
try {
  pty = await import('node-pty')
} catch {
  pty = null
}

/** Check if tmux is available on the system */
let hasTmux = false
try {
  execSync('which tmux', { stdio: 'ignore' })
  hasTmux = true
} catch {
  hasTmux = false
}

const TERMINAL_PATH_PREFIX = '/_storyboard/terminal/'

/**
 * Env var prefixes/names from external terminal emulators and shell configs
 * that must be stripped before spawning tmux or shell processes — they leak
 * custom theming, prompts, and shell integrations into the storyboard terminal.
 */
const SHELL_CONFIG_STRIP_RE = /^(ZDOTDIR|STARSHIP(_.*)?|GHOSTTY(_.*)?|POWERLEVEL.*|P9K_.*|P10K_.*|ZSH_THEME|BASH_ENV|ITERM(_.*)?|KITTY(_.*)?|ALACRITTY(_.*)?|WEZTERM(_.*)?|PROMPT_COMMAND|RPROMPT|RPS1)$/

function isShellConfigVar(key) {
  return SHELL_CONFIG_STRIP_RE.test(key) || key === 'ENV'
}

/**
 * Overrides injected into tmux global env to neutralize external shell themes.
 * Applied after the tmux server is guaranteed to exist.
 */
const TMUX_SHELL_OVERRIDES = {
  STARSHIP_CONFIG: '/dev/null',
  POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD: 'true',
  ZSH_THEME: '',
  TERM_PROGRAM: 'storyboard',
}

/** Apply shell-config overrides to the tmux server's global environment */
function applyTmuxShellOverrides() {
  for (const [key, val] of Object.entries(TMUX_SHELL_OVERRIDES)) {
    try { execSync(`tmux set-environment -g ${key} "${val}" 2>/dev/null`, { stdio: 'ignore' }) } catch {}
  }
  // Unset vars that should not exist at all inside storyboard terminals
  for (const key of Object.keys(process.env)) {
    if (isShellConfigVar(key) && !(key in TMUX_SHELL_OVERRIDES)) {
      try { execSync(`tmux set-environment -g -u ${key} 2>/dev/null`, { stdio: 'ignore' }) } catch {}
    }
  }
}

/** Filter process.env, removing shell-config vars that would leak into PTY */
function cleanEnv() {
  const filtered = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (!isShellConfigVar(k)) filtered[k] = v
  }
  return filtered
}

/** Read terminal config from storyboard.config.json */
function readTerminalConfig() {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'storyboard.config.json'), 'utf8')
    const config = JSON.parse(raw)
    return config?.canvas?.terminal ?? {}
  } catch {
    return {}
  }
}

/** Active PTY processes keyed by tmuxName (not tmux sessions — those persist independently) */
const ptyProcesses = new Map()

/** WebSocket connections keyed by tmuxName, for conflict notification */
const wsConnections = new Map()

/** Branch name for this worktree, set during setup */
let currentBranch = 'unknown'

/** Actual server port, resolved from httpServer at setup time */
let actualServerPort = null

/** Active snapshot intervals keyed by tmuxName */
const snapshotIntervals = new Map()

/** Rolling raw PTY output buffers keyed by tmuxName */
const rawTailBuffers = new Map()

const RAW_TAIL_MAX = 2000

/** Safe directory name from canvasId (replace `/` with `--`) */
function safeCanvasDir(canvasId) {
  return canvasId.replace(/\//g, '--')
}

/** Snapshot directory for a canvas */
function snapshotDir(canvasId) {
  return join(process.cwd(), '.storyboard', 'terminal-snapshots', safeCanvasDir(canvasId))
}

/**
 * Capture terminal pane content and write snapshot JSON.
 * Falls back to rawTail if tmux capture-pane fails.
 */
function captureSnapshot({ tmuxName, widgetId, canvasId, prettyName, cols, rows }) {
  let content = ''
  try {
    content = execSync(`tmux capture-pane -t "${tmuxName}" -p -e`, {
      encoding: 'utf8',
      timeout: 3000,
    })
  } catch {
    // tmux capture failed — use rawTail as fallback
  }

  const rawTail = rawTailBuffers.get(tmuxName) || ''
  const dir = snapshotDir(canvasId)
  const filePath = join(dir, `${widgetId}.json`)
  const tmpPath = filePath + '.tmp'

  const snapshot = {
    content,
    rawTail,
    widgetId,
    canvasId,
    prettyName: prettyName || null,
    timestamp: new Date().toISOString(),
    cols: cols || 80,
    rows: rows || 24,
  }

  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(tmpPath, JSON.stringify(snapshot), 'utf8')
    renameSync(tmpPath, filePath)
  } catch (err) {
    // Clean up tmp file on failure
    try { if (existsSync(tmpPath)) writeFileSync(tmpPath, ''); } catch {}
  }
}

/** Start periodic snapshot capture for a session */
function startSnapshotCapture(opts) {
  const { tmuxName } = opts
  if (snapshotIntervals.has(tmuxName)) return

  const termCfg = readTerminalConfig()
  const interval = termCfg.snapshotInterval ?? 5000

  const id = setInterval(() => captureSnapshot(opts), interval)
  snapshotIntervals.set(tmuxName, id)
}

/** Stop periodic snapshot capture and do a final capture */
function stopSnapshotCapture(tmuxName, finalOpts) {
  const id = snapshotIntervals.get(tmuxName)
  if (id) {
    clearInterval(id)
    snapshotIntervals.delete(tmuxName)
  }
  if (finalOpts) {
    captureSnapshot(finalOpts)
  }
  rawTailBuffers.delete(tmuxName)
}

/** Check if a tmux session with the given name exists */
function tmuxSessionExists(name) {
  try {
    execSync(`tmux has-session -t "${name}" 2>/dev/null`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Orphan a terminal session by widget ID. Called when a terminal widget is
 * deleted. The tmux session is preserved with a grace timer.
 */
export function orphanTerminalSession(widgetId) {
  const tmuxName = findTmuxNameForWidget(widgetId)
  if (!tmuxName) {
    console.warn(`[storyboard] orphanTerminalSession: no registry entry for widget ${widgetId}`)
    legacyKillSession(widgetId)
    return
  }

  console.log(`[storyboard] orphanTerminalSession: archiving ${tmuxName} (widget: ${widgetId})`)

  // Set archived status FIRST (bumps generation so WS onclose won't override)
  orphanSession(tmuxName)

  // Close the WS connection if any (notifies client)
  const ws = wsConnections.get(tmuxName)
  if (ws && ws.readyState <= 1) {
    try { ws.close() } catch {}
  }
  wsConnections.delete(tmuxName)

  // Kill the PTY process (detaches from tmux)
  const proc = ptyProcesses.get(tmuxName)
  if (proc) {
    try { proc.kill() } catch {}
    ptyProcesses.delete(tmuxName)
  }
}

/** Kill legacy sb-{widgetId} sessions for backwards compat */
function legacyKillSession(widgetId) {
  const legacyName = `sb-${widgetId}`
  try {
    execSync(`tmux kill-session -t "${legacyName}" 2>/dev/null`, { stdio: 'ignore' })
  } catch {}
}

/**
 * Attach the terminal WebSocket server to a Vite HTTP server.
 * @param {object} httpServer
 * @param {string} base — Vite base path
 * @param {string} branch — current git branch name
 */
export function setupTerminalServer(httpServer, base = '/', branch = 'unknown') {
  if (!pty || !WebSocketServer) {
    if (!pty) console.warn('[storyboard] node-pty not available — terminal widgets disabled')
    if (!WebSocketServer) console.warn('[storyboard] ws not available — terminal widgets disabled')
    return
  }

  currentBranch = branch

  // Capture the actual port from the running HTTP server
  try {
    const addr = httpServer.address()
    if (addr && addr.port) actualServerPort = addr.port
  } catch {}

  // Ensure node-pty spawn-helper has execute permission (npm install can strip it)
  try {
    const nodePtyDir = resolve(process.cwd(), 'node_modules/node-pty/prebuilds')
    execSync(`chmod +x "${nodePtyDir}"/darwin-*/spawn-helper 2>/dev/null || true`, { stdio: 'ignore' })
  } catch {}

  // Initialize registry and terminal config
  const root = process.cwd()
  const termCfg = readTerminalConfig()
  initRegistry(root, { gracePeriod: termCfg.orphanGracePeriod })
  initTerminalConfig(root)

  // Best-effort: apply shell-config overrides if a tmux server already exists
  // from a previous dev server run. If no server exists, this fails silently —
  // overrides are applied again in createTerminal() after the first new-session.
  if (hasTmux) {
    applyTmuxShellOverrides()
  }

  const mode = hasTmux ? 'tmux (persistent sessions)' : 'node-pty (no persistence)'
  console.log(`[storyboard] terminal server ready (${mode}) [branch: ${branch}]`)

  const wss = new WebSocketServer({ noServer: true })
  const baseNoTrail = (base || '/').replace(/\/$/, '')

  httpServer.on('upgrade', (req, socket, head) => {
    let pathname = req.url || ''
    if (baseNoTrail && pathname.startsWith(baseNoTrail)) {
      pathname = pathname.slice(baseNoTrail.length) || '/'
    }

    if (!pathname.startsWith(TERMINAL_PATH_PREFIX)) return

    // Parse sessionId and query params
    const pathAndQuery = pathname.slice(TERMINAL_PATH_PREFIX.length)
    const [sessionId, queryStr] = pathAndQuery.split('?')
    if (!sessionId) {
      socket.destroy()
      return
    }

    const params = new URLSearchParams(queryStr || '')
    const canvasId = params.get('canvas') || 'unknown'
    const prettyName = params.get('name') || null
    const widgetStartupCommand = params.get('startupCommand') || null

    wss.handleUpgrade(req, socket, head, (ws) => {
      handleConnection(ws, sessionId, canvasId, prettyName, widgetStartupCommand)
    })
  })
}

function handleConnection(ws, widgetId, canvasId, prettyName, widgetStartupCommand = null) {
  const branch = currentBranch
  const tmuxName = generateTmuxName(branch, canvasId, widgetId)

  // Register in registry, check for conflicts
  const { entry, conflict } = registerSession({ branch, canvasId, widgetId, prettyName })

  // Resolve server URL deterministically:
  // 1. Use the actual port from httpServer (set at setup time)
  // 2. Fall back to server registry (tracks running dev servers)
  // 3. Last resort: default port 1234
  let serverPort = actualServerPort
  if (!serverPort) {
    try {
      const name = detectWorktreeName()
      const servers = findByWorktree(name)
      if (servers.length > 0) serverPort = servers[0].port
    } catch {}
  }
  if (!serverPort) serverPort = 1234
  const serverUrl = `http://localhost:${serverPort}`

  // Write terminal config for agent context
  writeTermConfig({ branch, canvasId, widgetId, serverUrl, tmuxName, displayName: prettyName || null, widgetProps: prettyName ? { prettyName } : null })

  // Close any existing WS for this session (one viewer at a time)
  const existingWs = wsConnections.get(tmuxName)
  if (existingWs && existingWs !== ws && existingWs.readyState <= 1) {
    try { existingWs.close() } catch {}
  }
  wsConnections.set(tmuxName, ws)

  // Kill any existing pty process for this session (stale connection)
  const existing = ptyProcesses.get(tmuxName)
  if (existing) {
    try { existing.kill() } catch {}
    ptyProcesses.delete(tmuxName)
  }

  const cwd = process.cwd()
  const shell = process.env.SHELL || '/bin/zsh'
  const termCfg = readTerminalConfig()
  const prompt = termCfg.prompt || '$ '

  // Shared identity env vars for both tmux and direct paths
  const identityEnv = {
    STORYBOARD_WIDGET_ID: widgetId,
    STORYBOARD_CANVAS_ID: canvasId,
    STORYBOARD_BRANCH: branch,
    STORYBOARD_SERVER_URL: serverUrl,
  }

  // Env for the tmux path — cleaned of external shell config + neutralizing overrides.
  // These env vars are inherited by the shell spawned inside new-session (NOT by the
  // tmux server global env). Verified: tmux new-session passes the spawning process's
  // env to the session shell. This does NOT contaminate other tmux sessions.
  const zdotdir = join(tmpdir(), 'storyboard-terminal')
  try {
    mkdirSync(zdotdir, { recursive: true })
    writeFileSync(join(zdotdir, '.zshenv'), '')
    writeFileSync(join(zdotdir, '.zshrc'), `export PS1='${prompt.replace(/'/g, "'\\''")}'\nunset RPS1\n`)
  } catch { /* best effort */ }

  const tmuxEnv = {
    ...cleanEnv(),
    TERM: 'xterm-256color',
    TERM_PROGRAM: 'storyboard',
    ZDOTDIR: zdotdir,
    STARSHIP_CONFIG: '/dev/null',
    POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD: 'true',
    ZSH_THEME: '',
    BASH_ENV: '',
    ENV: '',
    ...identityEnv,
  }

  // Full env for the direct-shell fallback (no tmux).
  const directEnv = {
    ...cleanEnv(),
    TERM: 'xterm-256color',
    TERM_PROGRAM: 'storyboard',
    ZDOTDIR: zdotdir,
    STARSHIP_CONFIG: '/dev/null',
    POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD: 'true',
    ZSH_THEME: '',
    BASH_ENV: '',
    ENV: '',
    PS1: prompt,
    ...identityEnv,
  }
  let ptyProcess
  let isNewSession = false

  try {
  if (hasTmux) {
    const reattach = tmuxSessionExists(tmuxName)

    // Also check for legacy sb-{widgetId} sessions and migrate
    const legacyName = `sb-${widgetId}`
    const hasLegacy = !reattach && tmuxSessionExists(legacyName)
    const actualName = hasLegacy ? legacyName : tmuxName

    // -f /dev/null skips user tmux.conf; 'set status off' hides the status bar
    const args = (reattach || hasLegacy)
      ? ['-f', '/dev/null', 'attach-session', '-t', actualName]
      : ['-f', '/dev/null', 'new-session', '-s', tmuxName, '-c', cwd]

    // If migrating from legacy, rename the tmux session
    if (hasLegacy) {
      try {
        execSync(`tmux rename-session -t "${legacyName}" "${tmuxName}" 2>/dev/null`, { stdio: 'ignore' })
      } catch {}
    }

    ptyProcess = pty.spawn('tmux', args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: tmuxEnv,
    })

    // Hide status bar + apply shell-config overrides
    const targetName = (reattach || hasLegacy) ? actualName : tmuxName
    isNewSession = !(reattach || hasLegacy)
    const hideStatus = () => {
      try {
        execSync(`tmux set-option -t "${targetName}" status off 2>/dev/null`, { stdio: 'ignore' })
        execSync(`tmux set-option -t "${targetName}" set-clipboard off 2>/dev/null`, { stdio: 'ignore' })
        // Only enable mouse for reattach sessions. For new sessions, mouse on
        // is deferred — tmux mouse events crash Clack prompts in the welcome script.
        if (!isNewSession) {
          execSync(`tmux set-option -t "${targetName}" mouse on 2>/dev/null`, { stdio: 'ignore' })
        }

        // Apply shell-config overrides to the tmux server's global env.
        // This is the reliable call — the tmux server is guaranteed to exist
        // after pty.spawn('tmux', ...) above.
        applyTmuxShellOverrides()

        // Update tmux session env vars so new shells (and agents reading $STORYBOARD_WIDGET_ID)
        // always reflect the current widget identity — even after reassignment.
        const tmuxEnvVars = {
          STORYBOARD_WIDGET_ID: widgetId,
          STORYBOARD_CANVAS_ID: canvasId,
          STORYBOARD_BRANCH: branch,
          STORYBOARD_SERVER_URL: serverUrl,
        }
        for (const [key, val] of Object.entries(tmuxEnvVars)) {
          execSync(`tmux set-environment -t "${targetName}" ${key} "${val}" 2>/dev/null`, { stdio: 'ignore' })
        }
        // Write a sourceable env file keyed by tmux session name.
        // Running shells can source this to get fresh identity without restarting.
        const envDir = join(cwd, '.storyboard', 'terminals')
        try {
          const envContent = Object.entries(tmuxEnvVars)
            .map(([k, v]) => `export ${k}="${v}"`)
            .join('\n') + '\n'
          writeFileSync(join(envDir, `${targetName}.env`), envContent)
        } catch { /* best effort */ }
      } catch {}
    }
    setTimeout(hideStatus, 200)

    // For new sessions, either run startupCommand (skip welcome) or show the welcome screen
    if (isNewSession) {
      const startupCommand = widgetStartupCommand ?? termCfg.startupCommand ?? null

      // Export identity env vars + shell-config overrides into the shell via send-keys.
      // pty.spawn sets env on the tmux client process, but the session's
      // shell doesn't inherit those — it starts from the tmux server env.
      // send-keys is the only reliable way to set vars in the running shell.
      // Shell-config overrides (STARSHIP_CONFIG, etc.) must also be sent here
      // because the shell's .zshrc has already run by the time tmux global env
      // overrides are applied.
      const envExports = [
        `export STORYBOARD_WIDGET_ID="${widgetId}"`,
        `export STORYBOARD_CANVAS_ID="${canvasId}"`,
        `export STORYBOARD_BRANCH="${branch}"`,
        `export STORYBOARD_SERVER_URL="${serverUrl}"`,
        ...Object.entries(TMUX_SHELL_OVERRIDES).map(([k, v]) => `export ${k}="${v}"`),
      ].join(' && ')

      setTimeout(() => {
        try {
          execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(envExports)}`, { stdio: 'ignore' })
          execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
        } catch {}
      }, 300)

      if (startupCommand) {
        // Clear terminal before launching agent to hide env setup
        setTimeout(() => {
          try {
            execSync(`tmux send-keys -t "${tmuxName}" -l "clear"`, { stdio: 'ignore' })
            execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
          } catch {}
        }, 600)

        const isCopilot = startupCommand === 'copilot' || startupCommand.startsWith('copilot ')
        const isClaude = startupCommand === 'claude' || startupCommand.startsWith('claude ')

        if (isCopilot) {
          // Launch copilot, then send /allow-all on after ready
          setTimeout(() => {
            ptyProcess.write(startupCommand + '\r')
            // Start polling AFTER copilot has been launched (give it time to start)
            let allowSent = false
            const pollInterval = setInterval(() => {
              if (allowSent) { clearInterval(pollInterval); return }
              try {
                const paneContent = execSync(
                  `tmux capture-pane -t "${tmuxName}" -p`,
                  { encoding: 'utf8', timeout: 1000 }
                )
                // Only match copilot-specific readiness signals, not bare shell prompts
                if (paneContent.includes('Environment loaded:') || paneContent.includes('custom instruction')) {
                  allowSent = true
                  clearInterval(pollInterval)
                  setTimeout(() => {
                    try {
                      execSync(`tmux send-keys -t "${tmuxName}" -l "/allow-all on"`, { stdio: 'ignore' })
                      execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
                    } catch {}
                    setTimeout(() => deliverPendingMessages(tmuxName, widgetId), 2000)
                  }, 500)
                }
              } catch {}
            }, 2000)
            setTimeout(() => { if (!allowSent) { allowSent = true; clearInterval(pollInterval) } }, 30000)
          }, 900)
        } else if (isClaude) {
          // Launch claude, then enable auto mode after ready
          setTimeout(() => {
            ptyProcess.write(startupCommand + '\r')
            // Start polling AFTER claude has been launched
            let autoSent = false
            const pollInterval = setInterval(() => {
              if (autoSent) { clearInterval(pollInterval); return }
              try {
                const paneContent = execSync(
                  `tmux capture-pane -t "${tmuxName}" -p`,
                  { encoding: 'utf8', timeout: 1000 }
                )
                // Match claude-specific readiness: "Welcome to" or "? for shortcuts"
                if (paneContent.includes('Welcome to') || paneContent.includes('? for shortcuts')) {
                  autoSent = true
                  clearInterval(pollInterval)
                  setTimeout(() => {
                    try {
                      execSync(`tmux send-keys -t "${tmuxName}" -l "/allowed-tools bash edit read"`, { stdio: 'ignore' })
                      execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
                    } catch {}
                    setTimeout(() => deliverPendingMessages(tmuxName, widgetId), 2000)
                  }, 500)
                }
              } catch {}
            }, 2000)
            setTimeout(() => { if (!autoSent) { autoSent = true; clearInterval(pollInterval) } }, 30000)
          }, 900) else if (startupCommand === 'shell') {
          // Plain shell — nothing to do, the pty already has a shell running
        } else {
          // Custom command — send it directly
          setTimeout(() => {
            ptyProcess.write(startupCommand + '\r')
          }, 800)
        }
      } else {
        // No startupCommand — show the welcome screen as before
        const canvasArg = canvasId !== 'unknown' ? canvasId : ''
        setTimeout(() => {
          const nameArg = prettyName ? ` --name "${prettyName}"` : ''
          const cmd = `storyboard terminal-welcome --branch "${branch}" --canvas "${canvasArg}"${nameArg}\r`
          ptyProcess.write(cmd)
        }, 800)
      }

      // Execute startup sequence if configured (after welcome or startupCommand)
      const startupSeq = termCfg.defaultStartupSequence
      if (startupSeq?.steps?.length) {
        setTimeout(() => {
          executeStartupSequence(tmuxName, ws, startupSeq)
        }, startupCommand ? 1500 : 1500)
      }
    }

    // Write conflict warning if session was live elsewhere
    if (conflict) {
      setTimeout(() => {
        const warning = [
          '',
          `\x1b[33m⚠ Session conflict\x1b[0m`,
          `\x1b[2mThis session was\x1b[0m \x1b[34mLive\x1b[0m \x1b[2mon branch\x1b[0m \x1b[34m${conflict.currentBranch}\x1b[0m \x1b[2m(canvas: ${conflict.currentCanvas})\x1b[0m`,
          `\x1b[2mDetached from there and attached here.\x1b[0m`,
          '',
        ].join('\r\n')
        if (ws.readyState === ws.OPEN) {
          ws.send(warning)
        }
      }, 300)
    }
  } else {
    const noRcFlag = shell.endsWith('/zsh') ? '--no-rcs' : shell.endsWith('/bash') ? '--norc' : ''
    const shellArgs = noRcFlag ? [noRcFlag] : []
    ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: directEnv,
    })
  }
  } catch (spawnErr) {
    console.error(`[storyboard] terminal spawn failed: ${spawnErr.message}`)
    if (ws.readyState === ws.OPEN) {
      ws.send(`\r\n\x1b[31m✖ Terminal failed to start: ${spawnErr.message}\x1b[0m\r\n`)
      ws.send(`\x1b[2mTry: chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper\x1b[0m\r\n`)
      ws.close()
    }
    return
  }

  const generation = entry.generation
  ptyProcesses.set(tmuxName, ptyProcess)

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data)
    }
    // Maintain rolling raw tail buffer
    const prev = rawTailBuffers.get(tmuxName) || ''
    const updated = (prev + data).slice(-RAW_TAIL_MAX)
    rawTailBuffers.set(tmuxName, updated)
  })

  // Start periodic snapshot capture for tmux sessions
  const snapshotOpts = { tmuxName, widgetId, canvasId, prettyName, cols: 80, rows: 24 }
  if (hasTmux) {
    startSnapshotCapture(snapshotOpts)
  }

  ptyProcess.onExit(() => {
    ptyProcesses.delete(tmuxName)
    if (ws.readyState === ws.OPEN) {
      ws.close()
    }
  })

  ws.on('message', (msg) => {
    const str = typeof msg === 'string' ? msg : msg.toString('utf-8')
    try {
      const parsed = JSON.parse(str)
      if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
        ptyProcess.resize(parsed.cols, parsed.rows)
        // Update snapshot dimensions
        snapshotOpts.cols = parsed.cols
        snapshotOpts.rows = parsed.rows
        return
      }
    } catch {
      // Not JSON — raw stdin
    }

    ptyProcess.write(str)
  })

  // On disconnect: final snapshot, kill the pty (detaches from tmux) but leave the tmux session alive
  ws.on('close', () => {
    if (hasTmux) {
      stopSnapshotCapture(tmuxName, snapshotOpts)
    }
    if (wsConnections.get(tmuxName) === ws) {
      wsConnections.delete(tmuxName)
    }
    const proc = ptyProcesses.get(tmuxName)
    if (proc === ptyProcess) {
      try { ptyProcess.kill() } catch {}
      ptyProcesses.delete(tmuxName)
    }
    disconnectSession(tmuxName, generation)
  })

  ws.on('error', () => {
    if (hasTmux) {
      stopSnapshotCapture(tmuxName, snapshotOpts)
    }
    if (wsConnections.get(tmuxName) === ws) {
      wsConnections.delete(tmuxName)
    }
    try { ptyProcess.kill() } catch {}
    ptyProcesses.delete(tmuxName)
    disconnectSession(tmuxName, generation)
  })
}

/** Send a JSON message over WebSocket */
function sendJson(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

/**
 * Deliver any pending messages queued for this terminal.
 * Called after agent startup is complete.
 */
function deliverPendingMessages(tmuxName, widgetId) {
  if (!hasTmux) return
  try {
    const config = readTerminalConfigById(widgetId)
    if (!config?.pendingMessages?.length) return

    const messages = config.pendingMessages
    // Clear pending messages from config
    config.pendingMessages = []
    config.updatedAt = new Date().toISOString()

    // Write back via symlink path
    const symPath = join(process.cwd(), '.storyboard', 'terminals', `${widgetId}.json`)
    try { writeFileSync(symPath, JSON.stringify(config, null, 2)) } catch {}

    // Deliver each message with a small delay between them
    messages.forEach((msg, i) => {
      setTimeout(() => {
        try {
          const excerpt = msg.message.length > 200 ? msg.message.slice(0, 200) + '…' : msg.message
          const formatted = `📩 [${msg.fromName || msg.from || 'unknown'} → you]\n\`\`\`\n${excerpt}\n\`\`\`${msg.from ? `\nFull context: cat .storyboard/terminals/${msg.from}.json | jq '.latestOutput.content'` : ''}`
          execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(formatted)}`, { stdio: 'ignore' })
          execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
        } catch {}
      }, i * 1500)
    })
  } catch {}
}

/**
 * Execute a startup sequence for a new terminal session.
 * Runs server-side via tmux send-keys. Only called for new sessions.
 *
 * Step types:
 *   command   — send text + \n to the shell
 *   keystroke — send raw keys (e.g. {enter}, {tab})
 *   wait      — pause for ms or until output matches a pattern
 *   tmux      — run a tmux command against the session
 *   env       — set env var (must be before shell starts, so this is a pre-step)
 *
 * @param {string} tmuxName — tmux session name
 * @param {object} ws — WebSocket connection
 * @param {object} sequence — { steps: [], renderAfterStep?: number }
 */
async function executeStartupSequence(tmuxName, ws, sequence) {
  if (!sequence?.steps?.length) return
  if (!hasTmux) return

  const { steps, renderAfterStep } = sequence
  const shouldGateRender = typeof renderAfterStep === 'number' && renderAfterStep >= 0

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]

    try {
      switch (step.type) {
        case 'command':
          // Use -l for literal text to avoid shell interpretation issues
          execSync(
            `tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(step.value)}`,
            { stdio: 'ignore' }
          )
          execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
          break

        case 'keystroke': {
          const keyMap = { '{enter}': 'Enter', '{tab}': 'Tab', '{escape}': 'Escape', '{space}': 'Space' }
          const key = keyMap[step.value] || step.value
          execSync(`tmux send-keys -t "${tmuxName}" ${key}`, { stdio: 'ignore' })
          break
        }

        case 'wait':
          if (step.until === 'ready' || step.until === 'output') {
            const timeout = step.timeout || 10000
            const start = Date.now()
            const match = step.match || null
            while (Date.now() - start < timeout) {
              await new Promise(r => setTimeout(r, 500))
              if (match) {
                try {
                  const capture = execSync(
                    `tmux capture-pane -t "${tmuxName}" -p`,
                    { encoding: 'utf8', timeout: 2000 }
                  )
                  if (capture.includes(match)) break
                } catch { /* continue waiting */ }
              }
            }
          } else {
            await new Promise(r => setTimeout(r, step.ms || 1000))
          }
          break

        case 'tmux':
          execSync(`tmux ${step.value}`, { stdio: 'ignore' })
          break

        default:
          console.warn(`[storyboard] Unknown startup step type: ${step.type}`)
      }
    } catch (err) {
      console.warn(`[storyboard] Startup sequence step ${i} (${step.type}) failed:`, err.message)
      // Non-fatal — continue to next step
    }

    // Send render signal after the specified step
    if (shouldGateRender && i === renderAfterStep) {
      sendJson(ws, { type: 'render' })
    }
  }

  // If renderAfterStep was beyond all steps, send it now
  if (shouldGateRender && renderAfterStep >= steps.length) {
    sendJson(ws, { type: 'render' })
  }
}

// Re-export for backwards compat (canvas server uses this name)
export { killSession as killTerminalSession }

// Export for REST endpoint in canvas server
export { snapshotDir as terminalSnapshotDir }

