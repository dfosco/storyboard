/**
 * Hot Pool — pre-warms copilot CLI sessions for instant agent execution.
 *
 * Maintains a queue of ready-to-use copilot processes with automatic
 * scaling based on demand pressure.
 *
 * ## Load Balancer
 *
 * The pool has two operating levels:
 *   - **pool_size** — baseline warm sessions at rest (default: 1)
 *   - **max_pool_size** — surge capacity when under pressure (default: 3)
 *
 * Scale-up:  When an acquire() drains the queue to 0, the pool enters
 *            "pressure" mode and backfills to max_pool_size.
 * Scale-down: After 10 minutes with no acquisitions, the pool scales
 *             back to pool_size by killing excess warm sessions.
 *
 * Configuration (storyboard.config.json → hotPool):
 *   hotPool.pool_size       — baseline warm sessions (default: 1)
 *   hotPool.max_pool_size   — surge cap (default: 3)
 *   hotPool.cooldown_mins   — minutes idle before scale-down (default: 10)
 *   hotPool.enabled         — enable/disable the pool (default: true)
 *   hotPool.verbose         — log to Vite terminal (default: false)
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
const DEFAULT_MAX_POOL_SIZE = 3
const DEFAULT_COOLDOWN_MINS = 10
const WARM_TIMEOUT_MS = 10_000
const HEALTH_CHECK_INTERVAL_MS = 30_000

export class HotPool {
  /** @type {WarmSession[]} */
  #queue = []
  /** @type {Map<string, WarmSession>} */
  #acquired = new Map()
  #root = ''
  #poolSize = DEFAULT_POOL_SIZE
  #maxPoolSize = DEFAULT_MAX_POOL_SIZE
  #cooldownMs = DEFAULT_COOLDOWN_MINS * 60_000
  #enabled = true
  #verbose = false
  #filling = false
  #healthTimer = null
  #copilotAvailable = null
  #wsSend = null

  // Load balancer state
  #pressured = false
  #lastAcquireAt = 0
  #cooldownTimer = null

  /**
   * @param {Object} opts
   * @param {string} opts.root — project root directory
   * @param {Object} [opts.config] — hotPool config from storyboard.config.json
   * @param {Function} [opts.wsSend] — Vite server.ws.send for browser devlog events
   */
  constructor({ root, config = {}, wsSend = null }) {
    this.#root = root
    this.#poolSize = Math.max(1, config.pool_size ?? DEFAULT_POOL_SIZE)
    this.#maxPoolSize = Math.max(this.#poolSize, config.max_pool_size ?? DEFAULT_MAX_POOL_SIZE)
    this.#cooldownMs = (config.cooldown_mins ?? DEFAULT_COOLDOWN_MINS) * 60_000
    this.#enabled = config.enabled !== false
    this.#verbose = !!config.verbose
    this.#wsSend = wsSend
  }

  #termLog(...args) {
    if (this.#verbose) console.log('[hot-pool]', ...args)
  }

  #browserLog(message) {
    if (this.#wsSend) {
      this.#wsSend({
        type: 'custom',
        event: 'storyboard:hot-pool-log',
        data: { message, timestamp: Date.now() },
      })
    }
  }

  #log(message) {
    this.#termLog(message)
    this.#browserLog(message)
  }

  /** Current fill target — pool_size normally, max_pool_size under pressure. */
  get #fillTarget() {
    return this.#pressured ? this.#maxPoolSize : this.#poolSize
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

    this.#log(`✦ STARTING (pool_size=${this.#poolSize}, max_pool_size=${this.#maxPoolSize}, cooldown=${this.#cooldownMs / 60_000}min)`)
    await this.#fill()
    this.#log(`✦ READY — ${this.#queue.filter(s => s.state === 'ready').length} warm sessions`)

    this.#healthTimer = setInterval(() => this.#healthCheck(), HEALTH_CHECK_INTERVAL_MS)
  }

  stop() {
    if (this.#healthTimer) { clearInterval(this.#healthTimer); this.#healthTimer = null }
    if (this.#cooldownTimer) { clearTimeout(this.#cooldownTimer); this.#cooldownTimer = null }
    for (const session of this.#queue) this.#killSession(session)
    this.#queue = []
    this.#pressured = false
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
    this.#lastAcquireAt = Date.now()

    const age = ((Date.now() - session.createdAt) / 1000).toFixed(1)
    const readyCount = this.#queue.filter(s => s.state === 'ready').length

    // Scale-up: queue drained to 0 ready → enter pressure mode
    if (readyCount === 0 && !this.#pressured) {
      this.#pressured = true
      this.#log(`→ ACQUIRED ${session.id} (age: ${age}s) — ⚡ PRESSURE ON (scaling to max_pool_size=${this.#maxPoolSize})`)
      this.#resetCooldown()
    } else {
      this.#log(`→ ACQUIRED ${session.id} (age: ${age}s, queue: ${readyCount}/${this.#fillTarget})`)
      this.#resetCooldown()
    }

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
      pressured: this.#pressured,
      config: {
        pool_size: this.#poolSize,
        max_pool_size: this.#maxPoolSize,
        cooldown_mins: this.#cooldownMs / 60_000,
        verbose: this.#verbose,
      },
      queue: this.#queue.map(s => ({
        id: s.id,
        state: s.state,
        age: Date.now() - s.createdAt,
      })),
      acquired: this.#acquired.size,
      ready: this.#queue.filter(s => s.state === 'ready').length,
      fillTarget: this.#fillTarget,
    }
  }

  reconfigure(config) {
    if (config.max_pool_size !== undefined) this.#maxPoolSize = Math.max(1, config.max_pool_size)
    if (config.cooldown_mins !== undefined) this.#cooldownMs = config.cooldown_mins * 60_000
    const newSize = Math.min(Math.max(1, config.pool_size ?? this.#poolSize), this.#maxPoolSize)
    const newEnabled = config.enabled !== false
    if (config.verbose !== undefined) this.#verbose = !!config.verbose

    this.#log(`⚙ RECONFIG pool_size=${newSize} max=${this.#maxPoolSize} cooldown=${this.#cooldownMs / 60_000}min enabled=${newEnabled}`)

    const sizeChanged = newSize !== this.#poolSize
    this.#poolSize = newSize

    if (!newEnabled && this.#enabled) { this.stop(); this.#enabled = false; return }
    this.#enabled = newEnabled

    if (sizeChanged && this.#enabled) {
      // Trim if over new target
      while (this.#queue.length > this.#fillTarget) {
        const excess = this.#queue.pop()
        if (excess) this.#killSession(excess)
      }
      this.#fill().catch(() => {})
    }
  }

  // ── Load balancer ───────────────────────────────────────────────

  /** Reset the cooldown timer — called on every acquire. */
  #resetCooldown() {
    if (this.#cooldownTimer) clearTimeout(this.#cooldownTimer)
    this.#cooldownTimer = setTimeout(() => this.#scaleDown(), this.#cooldownMs)
  }

  /** Scale down from pressure mode back to pool_size. */
  #scaleDown() {
    if (!this.#pressured) return
    this.#pressured = false
    this.#cooldownTimer = null

    const excess = this.#queue.length - this.#poolSize
    if (excess > 0) {
      let killed = 0
      while (this.#queue.length > this.#poolSize) {
        const session = this.#queue.pop()
        if (session) { this.#killSession(session); killed++ }
      }
      this.#log(`↓ SCALE DOWN — pressure off, killed ${killed} excess (queue: ${this.#queue.length}/${this.#poolSize})`)
    } else {
      this.#log(`↓ SCALE DOWN — pressure off (queue already at ${this.#queue.length}/${this.#poolSize})`)
    }
  }

  // ── Internal ────────────────────────────────────────────────────

  async #fill() {
    if (this.#filling || !this.#enabled) return
    this.#filling = true
    const target = this.#fillTarget
    this.#log(`⟳ BACKFILL starting (queue: ${this.#queue.length}/${target}${this.#pressured ? ' ⚡' : ''})`)

    try {
      let spawned = 0
      while (this.#queue.length < target) {
        const total = this.#queue.length + this.#acquired.size
        if (total >= this.#maxPoolSize) {
          this.#log(`⟳ BACKFILL hit max_pool_size cap (${total}/${this.#maxPoolSize})`)
          break
        }
        const session = await this.#spawnWarmSession()
        if (session) {
          this.#queue.push(session)
          spawned++
          this.#log(`⟳ BACKFILL warmed ${session.id} (queue: ${this.#queue.length}/${target})`)
        } else {
          this.#log('⟳ BACKFILL spawn failed, stopping')
          break
        }
      }
      this.#log(`⟳ BACKFILL done — spawned ${spawned}, queue: ${this.#queue.length}/${target}`)
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
        const timer = setTimeout(() => { session.state = 'ready'; resolve(true) }, WARM_TIMEOUT_MS)
        child.on('error', () => { clearTimeout(timer); session.state = 'dead'; resolve(false) })
        child.on('close', () => {
          clearTimeout(timer)
          if (session.state === 'warming') { session.state = 'dead'; resolve(false) }
        })
        child.stderr?.once('data', () => {})
        child.stdout?.once('data', () => { clearTimeout(timer); session.state = 'ready'; resolve(true) })
      })

      if (!ready) { this.#log(`⊕ SPAWN ${id} failed (died during warmup)`); return null }
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
      this.#log(`♥ HEALTH removed ${removed} dead (queue: ${this.#queue.length}/${this.#fillTarget})`)
    } else {
      this.#log(`♥ HEALTH ok (queue: ${this.#queue.length}/${this.#fillTarget}, active: ${this.#acquired.size}${this.#pressured ? ' ⚡' : ''})`)
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
