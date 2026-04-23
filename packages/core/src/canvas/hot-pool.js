/**
 * Hot Pool — pre-warms copilot CLI sessions for instant agent execution.
 *
 * Maintains a configurable queue of ready-to-use copilot processes.
 * When a prompt or agent widget needs a session, it grabs a warm one
 * from the pool (near-instant) instead of cold-starting. The pool
 * immediately backfills to keep the queue full.
 *
 * Configuration (storyboard.config.json → prompt.hotPool):
 *   hotPool.size     — number of warm sessions to maintain (default: 1)
 *   hotPool.maxSize  — max concurrent warm sessions (default: 3)
 *   hotPool.enabled  — enable/disable the pool (default: true)
 *
 * Each warm session is a copilot CLI process spawned with stdin open,
 * waiting for input to be piped in.
 */

import { spawn } from 'node:child_process'
import process from 'node:process'

/**
 * @typedef {Object} WarmSession
 * @property {string} id — unique session identifier
 * @property {import('node:child_process').ChildProcess} process — the copilot process
 * @property {number} createdAt — timestamp when the session was spawned
 * @property {'warming'|'ready'|'acquired'|'dead'} state
 */

const DEFAULT_POOL_SIZE = 1
const DEFAULT_MAX_SIZE = 3
const WARM_TIMEOUT_MS = 10_000 // time to wait for process to become ready
const HEALTH_CHECK_INTERVAL_MS = 30_000

export class HotPool {
  /** @type {WarmSession[]} */
  #queue = []
  /** @type {Map<string, WarmSession>} */
  #acquired = new Map()
  #root = ''
  #size = DEFAULT_POOL_SIZE
  #maxSize = DEFAULT_MAX_SIZE
  #enabled = true
  #filling = false
  #healthTimer = null
  #copilotAvailable = null // null = unknown, true/false = checked

  /**
   * @param {Object} opts
   * @param {string} opts.root — project root directory
   * @param {Object} [opts.config] — prompt.hotPool config from storyboard.config.json
   */
  constructor({ root, config = {} }) {
    this.#root = root
    this.#size = Math.max(0, config.size ?? DEFAULT_POOL_SIZE)
    this.#maxSize = Math.max(this.#size, config.maxSize ?? DEFAULT_MAX_SIZE)
    this.#enabled = config.enabled !== false
  }

  /** Start the pool — call once on server init. */
  async start() {
    if (!this.#enabled || this.#size === 0) return

    // Check copilot availability before filling
    this.#copilotAvailable = await this.#checkCopilot()
    if (!this.#copilotAvailable) {
      console.log('[hot-pool] copilot CLI not found — pool disabled')
      return
    }

    console.log(`[hot-pool] starting with size=${this.#size}, maxSize=${this.#maxSize}`)
    await this.#fill()

    // Periodic health check — kill dead sessions and refill
    this.#healthTimer = setInterval(() => this.#healthCheck(), HEALTH_CHECK_INTERVAL_MS)
  }

  /** Stop the pool — kill all warm sessions. */
  stop() {
    if (this.#healthTimer) {
      clearInterval(this.#healthTimer)
      this.#healthTimer = null
    }
    for (const session of this.#queue) {
      this.#killSession(session)
    }
    this.#queue = []
    console.log('[hot-pool] stopped')
  }

  /**
   * Acquire a warm session from the pool.
   * Returns the session or null if pool is empty/disabled.
   * Immediately triggers a backfill.
   */
  acquire() {
    if (!this.#enabled || this.#queue.length === 0) return null

    // Find first ready session
    const idx = this.#queue.findIndex(s => s.state === 'ready')
    if (idx === -1) return null

    const session = this.#queue.splice(idx, 1)[0]
    session.state = 'acquired'
    this.#acquired.set(session.id, session)

    console.log(`[hot-pool] acquired session ${session.id} (${this.#queue.length} remaining)`)

    // Backfill asynchronously
    this.#fill().catch(() => {})

    return session
  }

  /**
   * Release an acquired session (mark it done, clean up).
   * @param {string} sessionId
   */
  release(sessionId) {
    const session = this.#acquired.get(sessionId)
    if (!session) return
    this.#acquired.delete(sessionId)
    // Don't return to pool — used sessions are one-shot
  }

  /** Get pool status for the /pool endpoint. */
  status() {
    return {
      enabled: this.#enabled,
      copilotAvailable: this.#copilotAvailable,
      config: { size: this.#size, maxSize: this.#maxSize },
      queue: this.#queue.map(s => ({
        id: s.id,
        state: s.state,
        age: Date.now() - s.createdAt,
      })),
      acquired: this.#acquired.size,
      ready: this.#queue.filter(s => s.state === 'ready').length,
    }
  }

  /** Update configuration at runtime. */
  reconfigure(config) {
    const newSize = Math.max(0, config.size ?? this.#size)
    const newMax = Math.max(newSize, config.maxSize ?? this.#maxSize)
    const newEnabled = config.enabled !== false

    const sizeChanged = newSize !== this.#size
    this.#size = newSize
    this.#maxSize = newMax

    if (!newEnabled && this.#enabled) {
      this.stop()
      this.#enabled = false
      return
    }

    this.#enabled = newEnabled

    if (sizeChanged && this.#enabled) {
      // Trim if pool is too large
      while (this.#queue.length > this.#size) {
        const excess = this.#queue.pop()
        if (excess) this.#killSession(excess)
      }
      // Fill if pool is too small
      this.#fill().catch(() => {})
    }
  }

  // ── Internal ────────────────────────────────────────────────────

  async #fill() {
    if (this.#filling || !this.#enabled) return
    this.#filling = true

    try {
      while (this.#queue.length < this.#size) {
        const total = this.#queue.length + this.#acquired.size
        if (total >= this.#maxSize) break

        const session = await this.#spawnWarmSession()
        if (session) {
          this.#queue.push(session)
          console.log(`[hot-pool] warmed session ${session.id} (queue: ${this.#queue.length}/${this.#size})`)
        } else {
          // Spawn failed — don't keep trying
          break
        }
      }
    } finally {
      this.#filling = false
    }
  }

  async #spawnWarmSession() {
    const id = `pool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    try {
      // Spawn copilot with stdin open — it will wait for input
      const child = spawn('copilot', [], {
        cwd: this.#root,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      })

      /** @type {WarmSession} */
      const session = {
        id,
        process: child,
        createdAt: Date.now(),
        state: 'warming',
      }

      // Wait for the process to be ready (not immediately dead)
      const ready = await new Promise((resolve) => {
        const timer = setTimeout(() => {
          // If it hasn't died in WARM_TIMEOUT_MS, consider it ready
          session.state = 'ready'
          resolve(true)
        }, WARM_TIMEOUT_MS)

        child.on('error', () => {
          clearTimeout(timer)
          session.state = 'dead'
          resolve(false)
        })

        child.on('close', () => {
          clearTimeout(timer)
          if (session.state === 'warming') {
            session.state = 'dead'
            resolve(false)
          }
        })

        // Check if process started successfully — if it emits data early,
        // that means it's up and ready (e.g., printing a prompt)
        child.stderr?.once('data', () => {
          // Some output on stderr means process is alive
        })
        child.stdout?.once('data', () => {
          clearTimeout(timer)
          session.state = 'ready'
          resolve(true)
        })
      })

      if (!ready) return null
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
    // Remove dead sessions from the queue
    const before = this.#queue.length
    this.#queue = this.#queue.filter(s => {
      if (s.process.killed || s.process.exitCode !== null) {
        s.state = 'dead'
        return false
      }
      return true
    })

    const removed = before - this.#queue.length
    if (removed > 0) {
      console.log(`[hot-pool] health check: removed ${removed} dead sessions`)
    }

    // Refill
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
