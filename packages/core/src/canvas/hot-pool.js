/**
 * Hot Pool — pre-warms copilot CLI sessions for instant agent execution.
 *
 * Maintains a queue of ready-to-use copilot processes. When a prompt or
 * agent widget needs a session, it grabs a warm one from the pool
 * (near-instant) instead of cold-starting. The pool immediately
 * backfills to keep the queue full.
 *
 * Configuration (storyboard.config.json → hotPool):
 *   hotPool.pool_size  — number of warm sessions to maintain (default: 1)
 *   hotPool.enabled    — enable/disable the pool (default: true)
 *   hotPool.verbose    — log pool lifecycle to Vite terminal (default: false)
 *
 * Browser devlogs are sent via the Vite HMR channel and only appear
 * when the "Dev logs" toggle is on in Storyboard DevTools.
 */

import { spawn } from 'node:child_process'
import process from 'node:process'

/**
 * @typedef {Object} WarmSession
 * @property {string} id
 * @property {import('node:child_process').ChildProcess} process
 * @property {number} createdAt
 * @property {'warming'|'ready'|'acquired'|'dead'} state
 */

const DEFAULT_POOL_SIZE = 1
const WARM_TIMEOUT_MS = 10_000
const HEALTH_CHECK_INTERVAL_MS = 30_000

export class HotPool {
  /** @type {WarmSession[]} */
  #queue = []
  /** @type {Map<string, WarmSession>} */
  #acquired = new Map()
  #root = ''
  #poolSize = DEFAULT_POOL_SIZE
  #enabled = true
  #verbose = false
  #filling = false
  #healthTimer = null
  #copilotAvailable = null
  #wsSend = null

  /**
   * @param {Object} opts
   * @param {string} opts.root — project root directory
   * @param {Object} [opts.config] — hotPool config from storyboard.config.json
   * @param {Function} [opts.wsSend] — Vite server.ws.send for browser devlog events
   */
  constructor({ root, config = {}, wsSend = null }) {
    this.#root = root
    this.#poolSize = Math.max(0, config.pool_size ?? DEFAULT_POOL_SIZE)
    this.#enabled = config.enabled !== false
    this.#verbose = !!config.verbose
    this.#wsSend = wsSend
  }

  /** Terminal log — only when verbose is true in config. */
  #termLog(...args) {
    if (this.#verbose) console.log('[hot-pool]', ...args)
  }

  /** Browser devlog — sent via HMR, shown when DevTools "Dev logs" is on. */
  #browserLog(message) {
    if (this.#wsSend) {
      this.#wsSend({
        type: 'custom',
        event: 'storyboard:hot-pool-log',
        data: { message, timestamp: Date.now() },
      })
    }
  }

  /** Log to both terminal (if verbose) and browser (always via HMR). */
  #log(message) {
    this.#termLog(message)
    this.#browserLog(message)
  }

  async start() {
    if (!this.#enabled || this.#poolSize === 0) {
      this.#log('pool disabled or pool_size=0, skipping start')
      return
    }

    this.#copilotAvailable = await this.#checkCopilot()
    if (!this.#copilotAvailable) {
      this.#log('copilot CLI not found — pool disabled')
      return
    }

    this.#log(`✦ STARTING (pool_size=${this.#poolSize})`)
    await this.#fill()
    this.#log(`✦ READY — ${this.#queue.filter(s => s.state === 'ready').length} warm sessions`)

    this.#healthTimer = setInterval(() => this.#healthCheck(), HEALTH_CHECK_INTERVAL_MS)
  }

  stop() {
    if (this.#healthTimer) {
      clearInterval(this.#healthTimer)
      this.#healthTimer = null
    }
    for (const session of this.#queue) {
      this.#killSession(session)
    }
    this.#queue = []
    this.#log('■ STOPPED — all sessions killed')
  }

  acquire() {
    if (!this.#enabled || this.#queue.length === 0) {
      this.#log(`→ ACQUIRE — pool ${!this.#enabled ? 'disabled' : 'empty'}, returning null`)
      return null
    }

    const idx = this.#queue.findIndex(s => s.state === 'ready')
    if (idx === -1) {
      this.#log(`→ ACQUIRE — ${this.#queue.length} in queue but none ready, returning null`)
      return null
    }

    const session = this.#queue.splice(idx, 1)[0]
    session.state = 'acquired'
    this.#acquired.set(session.id, session)

    const age = ((Date.now() - session.createdAt) / 1000).toFixed(1)
    this.#log(`→ ACQUIRED ${session.id} (age: ${age}s, queue: ${this.#queue.length}/${this.#poolSize})`)

    this.#fill().catch(() => {})
    return session
  }

  release(sessionId) {
    const session = this.#acquired.get(sessionId)
    if (!session) return
    this.#acquired.delete(sessionId)
    this.#log(`← RELEASED ${sessionId} (active: ${this.#acquired.size})`)
  }

  status() {
    return {
      enabled: this.#enabled,
      copilotAvailable: this.#copilotAvailable,
      config: { pool_size: this.#poolSize, verbose: this.#verbose },
      queue: this.#queue.map(s => ({
        id: s.id,
        state: s.state,
        age: Date.now() - s.createdAt,
      })),
      acquired: this.#acquired.size,
      ready: this.#queue.filter(s => s.state === 'ready').length,
    }
  }

  reconfigure(config) {
    const newSize = Math.max(0, config.pool_size ?? this.#poolSize)
    const newEnabled = config.enabled !== false
    if (config.verbose !== undefined) this.#verbose = !!config.verbose

    this.#log(`⚙ RECONFIG pool_size=${newSize} enabled=${newEnabled}`)

    const sizeChanged = newSize !== this.#poolSize
    this.#poolSize = newSize

    if (!newEnabled && this.#enabled) {
      this.stop()
      this.#enabled = false
      return
    }

    this.#enabled = newEnabled

    if (sizeChanged && this.#enabled) {
      while (this.#queue.length > this.#poolSize) {
        const excess = this.#queue.pop()
        if (excess) this.#killSession(excess)
      }
      this.#fill().catch(() => {})
    }
  }

  // ── Internal ────────────────────────────────────────────────────

  async #fill() {
    if (this.#filling || !this.#enabled) return
    this.#filling = true
    this.#log(`⟳ BACKFILL starting (queue: ${this.#queue.length}/${this.#poolSize})`)

    try {
      let spawned = 0
      while (this.#queue.length < this.#poolSize) {
        const session = await this.#spawnWarmSession()
        if (session) {
          this.#queue.push(session)
          spawned++
          this.#log(`⟳ BACKFILL warmed ${session.id} (queue: ${this.#queue.length}/${this.#poolSize})`)
        } else {
          this.#log('⟳ BACKFILL spawn failed, stopping')
          break
        }
      }
      this.#log(`⟳ BACKFILL done — spawned ${spawned}, queue: ${this.#queue.length}/${this.#poolSize}`)
    } finally {
      this.#filling = false
    }
  }

  async #spawnWarmSession() {
    const id = `pool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    this.#log(`⊕ SPAWN starting ${id}…`)

    try {
      const child = spawn('copilot', [], {
        cwd: this.#root,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      })

      /** @type {WarmSession} */
      const session = { id, process: child, createdAt: Date.now(), state: 'warming' }

      const ready = await new Promise((resolve) => {
        const timer = setTimeout(() => {
          session.state = 'ready'
          resolve(true)
        }, WARM_TIMEOUT_MS)

        child.on('error', () => { clearTimeout(timer); session.state = 'dead'; resolve(false) })
        child.on('close', () => {
          clearTimeout(timer)
          if (session.state === 'warming') { session.state = 'dead'; resolve(false) }
        })
        child.stderr?.once('data', () => {})
        child.stdout?.once('data', () => { clearTimeout(timer); session.state = 'ready'; resolve(true) })
      })

      if (!ready) {
        this.#log(`⊕ SPAWN ${id} failed (died during warmup)`)
        return null
      }
      this.#log(`⊕ SPAWN ${id} ready (pid: ${child.pid})`)
      return session
    } catch {
      return null
    }
  }

  #killSession(session) {
    try {
      if (session.process && !session.process.killed) {
        session.process.stdin?.end()
        session.process.kill()
      }
    } catch { /* ignore */ }
    session.state = 'dead'
  }

  #healthCheck() {
    const before = this.#queue.length
    this.#queue = this.#queue.filter(s => {
      if (s.process.killed || s.process.exitCode !== null) { s.state = 'dead'; return false }
      return true
    })

    const removed = before - this.#queue.length
    if (removed > 0) {
      this.#log(`♥ HEALTH removed ${removed} dead (queue: ${this.#queue.length}/${this.#poolSize})`)
    } else {
      this.#log(`♥ HEALTH ok (queue: ${this.#queue.length}/${this.#poolSize}, active: ${this.#acquired.size})`)
    }

    this.#fill().catch(() => {})
  }

  async #checkCopilot() {
    try {
      const result = spawn('which', ['copilot'], { stdio: 'pipe' })
      return new Promise((resolve) => {
        result.on('close', (code) => resolve(code === 0))
        result.on('error', () => resolve(false))
        setTimeout(() => resolve(false), 3000)
      })
    } catch {
      return false
    }
  }
}
