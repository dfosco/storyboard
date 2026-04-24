/**
 * Hot Pool — pre-warms tmux sessions for instant agent execution.
 *
 * Maintains typed pools of ready-to-use sessions: bare tmux shells for
 * terminal/prompt widgets, and fully-booted agent sessions (Copilot,
 * Claude, Codex) with the agent CLI running and ready.
 *
 * ## Pool Types
 *
 * The HotPoolManager creates one HotPool per type:
 *   - **terminal** — bare tmux shell (terminal widgets without an agent)
 *   - **prompt**   — bare tmux shell (prompt widgets)
 *   - **copilot**  — tmux + `copilot --agent terminal-agent` running & ready
 *   - **claude**   — tmux + `claude --agent terminal-agent ...` running & ready
 *   - **codex**    — tmux + `codex --full-auto` running & ready
 *
 * ## Load Balancer (per-pool)
 *
 * Each pool has two operating levels:
 *   - **pool_size** — baseline warm sessions at rest (default: 1)
 *   - **max_pool_size** — surge capacity when under pressure (default: 3)
 *
 * Scale-up:  When an acquire() drains the queue to 0, the pool enters
 *            "pressure" mode and backfills to max_pool_size.
 * Scale-down: After cooldown minutes with no acquisitions, the pool scales
 *             back to pool_size by killing excess warm sessions.
 *
 * ## Configuration (storyboard.config.json → hotPool)
 *
 *   hotPool.enabled         — enable/disable all pools (default: true)
 *   hotPool.verbose         — log to Vite terminal (default: false)
 *   hotPool.pool_size       — default baseline per pool (default: 1)
 *   hotPool.max_pool_size   — default surge cap per pool (default: 3)
 *   hotPool.load_balancer   — enable auto-scaling (default: true)
 *   hotPool.load_balancer_cooldown_mins — minutes idle before scale-down (default: 10)
 *   hotPool.pools.terminal  — per-pool overrides for terminal { pool_size, max_pool_size }
 *   hotPool.pools.prompt    — per-pool overrides for prompt
 *   hotPool.pools.copilot   — per-pool overrides for copilot agent
 *   hotPool.pools.claude    — per-pool overrides for claude agent
 *   hotPool.pools.codex     — per-pool overrides for codex agent
 *
 * Browser devlogs are sent via the Vite HMR channel and only appear
 * when the "Dev logs" toggle is on in Storyboard DevTools.
 */

import { execSync } from 'node:child_process'

/**
 * @typedef {Object} WarmSession
 * @property {string} id
 * @property {string} poolId — which pool this session belongs to
 * @property {string} tmuxName — the tmux session name (pool-prefixed)
 * @property {number} createdAt
 * @property {'warming'|'ready'|'acquired'|'consumed'|'dead'} state
 */

const DEFAULT_POOL_SIZE = 1
const DEFAULT_MAX_POOL_SIZE = 3
const DEFAULT_COOLDOWN_MINS = 10
const HEALTH_CHECK_INTERVAL_MS = 30_000
const AGENT_READINESS_TIMEOUT_MS = 60_000
const AGENT_READINESS_POLL_MS = 2_000

export class HotPool {
  /** @type {WarmSession[]} */
  #queue = []
  /** @type {Map<string, WarmSession>} */
  #acquired = new Map()
  #root = ''
  #poolId = 'terminal'
  #poolSize = DEFAULT_POOL_SIZE
  #maxPoolSize = DEFAULT_MAX_POOL_SIZE
  #cooldownMs = DEFAULT_COOLDOWN_MINS * 60_000
  #enabled = true
  #verbose = false
  #loadBalancer = true
  #filling = false
  #healthTimer = null
  #prereqsAvailable = null
  #wsSend = null

  // Agent config (null for bare shell pools)
  #agentConfig = null

  // Load balancer state
  #pressured = false
  #cooldownTimer = null

  /**
   * @param {Object} opts
   * @param {string} opts.root — project root directory
   * @param {string} opts.poolId — pool identifier (e.g. 'terminal', 'copilot', 'prompt')
   * @param {Object} [opts.config] — pool-specific config (pool_size, max_pool_size, etc.)
   * @param {Object} [opts.agentConfig] — agent config from canvas.agents (startupCommand, readinessSignal, postStartup)
   * @param {Function} [opts.wsSend] — Vite server.ws.send for browser devlog events
   */
  constructor({ root, poolId = 'terminal', config = {}, agentConfig = null, wsSend = null }) {
    this.#root = root
    this.#poolId = poolId
    this.#poolSize = Math.max(1, config.pool_size ?? DEFAULT_POOL_SIZE)
    this.#maxPoolSize = Math.max(this.#poolSize, config.max_pool_size ?? DEFAULT_MAX_POOL_SIZE)
    this.#cooldownMs = (config.load_balancer_cooldown_mins ?? DEFAULT_COOLDOWN_MINS) * 60_000
    this.#enabled = config.enabled !== false
    this.#verbose = !!config.verbose
    this.#loadBalancer = config.load_balancer !== false
    this.#wsSend = wsSend
    this.#agentConfig = agentConfig
  }

  get poolId() { return this.#poolId }
  get isAgentPool() { return !!this.#agentConfig }

  #termLog(...args) {
    if (this.#verbose) console.log(`[hot-pool:${this.#poolId}]`, ...args)
  }

  #browserLog(message) {
    if (this.#wsSend) {
      this.#wsSend({
        type: 'custom',
        event: 'storyboard:hot-pool-log',
        data: { poolId: this.#poolId, message, timestamp: Date.now() },
      })
    }
  }

  #log(message) {
    this.#termLog(message)
    this.#browserLog(message)
  }

  /** Current fill target — pool_size normally, max_pool_size under pressure (if load balancer on). */
  get #fillTarget() {
    return (this.#loadBalancer && this.#pressured) ? this.#maxPoolSize : this.#poolSize
  }

  async start() {
    if (!this.#enabled || this.#poolSize === 0) {
      this.#log('pool disabled or pool_size=0, skipping start')
      return
    }

    this.#prereqsAvailable = await this.#checkPrereqs()
    if (!this.#prereqsAvailable) {
      this.#log('prerequisites not met — pool disabled')
      return
    }

    this.#log(`✦ STARTING (pool_size=${this.#poolSize}, max_pool_size=${this.#maxPoolSize}, cooldown=${this.#cooldownMs / 60_000}min${this.#agentConfig ? ', agent=' + this.#agentConfig.startupCommand : ''})`)
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
    const age = ((Date.now() - session.createdAt) / 1000).toFixed(1)
    const readyCount = this.#queue.filter(s => s.state === 'ready').length

    // Scale-up: queue drained to 0 ready → enter pressure mode
    if (readyCount === 0 && !this.#pressured) {
      this.#pressured = true
      this.#log(`→ ACQUIRED ${session.id} tmux=${session.tmuxName} (age: ${age}s) — ⚡ PRESSURE ON (scaling to max_pool_size=${this.#maxPoolSize})`)
      this.#resetCooldown()
    } else {
      this.#log(`→ ACQUIRED ${session.id} tmux=${session.tmuxName} (age: ${age}s, queue: ${readyCount}/${this.#fillTarget})`)
      this.#resetCooldown()
    }

    this.#fill().catch(() => {})
    return session
  }

  /**
   * Consume a previously acquired session — transfers ownership out of the pool permanently.
   * Use this when the session becomes a widget-owned canonical tmux session.
   */
  consume(sessionId) {
    const session = this.#acquired.get(sessionId)
    if (!session) return
    session.state = 'consumed'
    this.#acquired.delete(sessionId)
    this.#log(`⊘ CONSUMED ${sessionId} (active: ${this.#acquired.size})`)
  }

  release(sessionId) {
    const session = this.#acquired.get(sessionId)
    if (!session) return
    this.#acquired.delete(sessionId)
    // Return to pool if still alive, otherwise kill
    if (this.#tmuxSessionExists(session.tmuxName)) {
      session.state = 'ready'
      this.#queue.push(session)
      this.#log(`← RELEASED ${sessionId} back to queue (queue: ${this.#queue.length}/${this.#fillTarget})`)
    } else {
      session.state = 'dead'
      this.#log(`← RELEASED ${sessionId} but tmux gone, discarded`)
    }
  }

  status() {
    return {
      poolId: this.#poolId,
      enabled: this.#enabled,
      prereqsAvailable: this.#prereqsAvailable,
      isAgentPool: this.isAgentPool,
      pressured: this.#pressured,
      config: {
        pool_size: this.#poolSize,
        max_pool_size: this.#maxPoolSize,
        load_balancer: this.#loadBalancer,
        load_balancer_cooldown_mins: this.#cooldownMs / 60_000,
        verbose: this.#verbose,
      },
      agentConfig: this.#agentConfig ? {
        startupCommand: this.#agentConfig.startupCommand,
        readinessSignal: this.#agentConfig.readinessSignal,
      } : null,
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
    if (config.load_balancer_cooldown_mins !== undefined) this.#cooldownMs = config.load_balancer_cooldown_mins * 60_000
    if (config.load_balancer !== undefined) this.#loadBalancer = !!config.load_balancer
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
    const id = `${this.#poolId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const tmuxName = `sb-pool-${id}`
    this.#log(`⊕ SPAWN starting ${id} (tmux: ${tmuxName})…`)

    try {
      // Create headless tmux session with a warm shell — matches terminal-server bootstrap
      execSync(`tmux -f /dev/null new-session -d -s "${tmuxName}" -c "${this.#root}"`, { stdio: 'ignore' })
      execSync(`tmux set-option -t "${tmuxName}" status off 2>/dev/null`, { stdio: 'ignore' })
      execSync(`tmux set-option -t "${tmuxName}" set-clipboard off 2>/dev/null`, { stdio: 'ignore' })

      /** @type {WarmSession} */
      const session = { id, poolId: this.#poolId, tmuxName, createdAt: Date.now(), state: 'warming' }

      // Wait for shell to be responsive
      const shellReady = await this.#waitForShell(tmuxName)
      if (!shellReady) {
        this.#log(`⊕ SPAWN ${id} failed (shell not responsive)`)
        try { execSync(`tmux kill-session -t "${tmuxName}" 2>/dev/null`, { stdio: 'ignore' }) } catch {}
        return null
      }

      // For agent pools, launch the agent and wait for readiness
      if (this.#agentConfig?.startupCommand) {
        const agentReady = await this.#warmAgent(tmuxName, id)
        if (!agentReady) {
          this.#log(`⊕ SPAWN ${id} failed (agent not ready)`)
          try { execSync(`tmux kill-session -t "${tmuxName}" 2>/dev/null`, { stdio: 'ignore' }) } catch {}
          return null
        }
      }

      session.state = 'ready'
      this.#log(`⊕ SPAWN ${id} ready (tmux: ${tmuxName})`)
      return session
    } catch (err) {
      this.#log(`⊕ SPAWN ${id} error: ${err.message}`)
      try { execSync(`tmux kill-session -t "${tmuxName}" 2>/dev/null`, { stdio: 'ignore' }) } catch {}
      return null
    }
  }

  /** Wait for the tmux shell to be responsive (capture-pane has output). */
  async #waitForShell(tmuxName) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        clearInterval(check)
        resolve(this.#tmuxSessionExists(tmuxName))
      }, 2000)

      const check = setInterval(() => {
        try {
          const output = execSync(`tmux capture-pane -t "${tmuxName}" -p 2>/dev/null`, { encoding: 'utf8', timeout: 1000 })
          if (output.trim().length > 0) {
            clearInterval(check)
            clearTimeout(timer)
            resolve(true)
          }
        } catch { /* not ready yet */ }
      }, 300)
    })
  }

  /**
   * Launch the agent command and wait for the readiness signal.
   * Returns true if the agent is ready, false on timeout or failure.
   */
  async #warmAgent(tmuxName, sessionId) {
    const { startupCommand, readinessSignal, postStartup } = this.#agentConfig
    this.#log(`⊕ AGENT ${sessionId} launching: ${startupCommand}`)

    try {
      // Send the agent command into the warm shell
      execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(startupCommand)}`, { stdio: 'ignore' })
      execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
    } catch (err) {
      this.#log(`⊕ AGENT ${sessionId} send-keys failed: ${err.message}`)
      return false
    }

    // If no readiness signal defined, wait a fixed delay and hope for the best
    if (!readinessSignal) {
      await new Promise(r => setTimeout(r, 5000))
      this.#log(`⊕ AGENT ${sessionId} no readinessSignal — assuming ready after 5s`)
      return this.#tmuxSessionExists(tmuxName)
    }

    // Poll for readiness signal in the tmux pane content
    const ready = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        clearInterval(poll)
        this.#log(`⊕ AGENT ${sessionId} readiness timeout (${AGENT_READINESS_TIMEOUT_MS / 1000}s)`)
        resolve(false)
      }, AGENT_READINESS_TIMEOUT_MS)

      const poll = setInterval(() => {
        try {
          const paneContent = execSync(
            `tmux capture-pane -t "${tmuxName}" -p`,
            { encoding: 'utf8', timeout: 1000 }
          )
          if (paneContent.includes(readinessSignal)) {
            clearInterval(poll)
            clearTimeout(timeout)
            resolve(true)
          }
        } catch { /* not ready yet */ }
      }, AGENT_READINESS_POLL_MS)
    })

    if (!ready) return false

    // Send postStartup command (e.g. "/allow-all on")
    if (postStartup) {
      try {
        await new Promise(r => setTimeout(r, 500))
        execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(postStartup)}`, { stdio: 'ignore' })
        execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
        this.#log(`⊕ AGENT ${sessionId} postStartup sent: ${postStartup}`)
      } catch {}
    }

    this.#log(`⊕ AGENT ${sessionId} ready (signal: "${readinessSignal}")`)
    return true
  }

  #tmuxSessionExists(name) {
    try {
      execSync(`tmux has-session -t "${name}" 2>/dev/null`, { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  /**
   * For agent pools, verify the agent process is still running in the pane.
   * Returns false if the tmux session is gone or the agent has exited.
   */
  #isSessionHealthy(session) {
    if (!this.#tmuxSessionExists(session.tmuxName)) return false

    // For agent pools, also check that the agent is still the foreground process
    if (this.#agentConfig?.startupCommand) {
      try {
        const cmd = execSync(
          `tmux display-message -t "${session.tmuxName}" -p "#{pane_current_command}"`,
          { encoding: 'utf8', timeout: 1000 }
        ).trim()
        // The agent binary is the first word of the startup command
        const expectedBin = this.#agentConfig.startupCommand.trim().split(/\s+/)[0]
        if (cmd !== expectedBin) {
          this.#log(`♥ HEALTH ${session.id} agent exited (pane_current_command="${cmd}", expected="${expectedBin}")`)
          return false
        }
      } catch {
        return false
      }
    }

    return true
  }

  #killSession(session) {
    try {
      if (session.tmuxName) {
        execSync(`tmux kill-session -t "${session.tmuxName}" 2>/dev/null`, { stdio: 'ignore' })
      }
    } catch { /* ignore */ }
    session.state = 'dead'
  }

  #healthCheck() {
    const before = this.#queue.length
    this.#queue = this.#queue.filter(s => {
      if (!this.#isSessionHealthy(s)) { s.state = 'dead'; this.#killSession(s); return false }
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

  async #checkPrereqs() {
    try {
      execSync('which tmux', { stdio: 'pipe' })

      // Agent pools also need their CLI binary to be available
      if (this.#agentConfig?.startupCommand) {
        const bin = this.#agentConfig.startupCommand.trim().split(/\s+/)[0]
        execSync(`which ${bin}`, { stdio: 'pipe' })
      }

      return true
    } catch {
      return false
    }
  }
}

// ── Hot Pool Manager ────────────────────────────────────────────────

const STAGGER_DELAY_MS = 5_000

/**
 * Manages multiple typed HotPool instances (terminal, prompt, + per-agent).
 * Provides a unified API for acquiring/consuming/releasing sessions by pool ID.
 */
export class HotPoolManager {
  /** @type {Map<string, HotPool>} */
  #pools = new Map()
  #enabled = true
  #config = {}

  /**
   * @param {Object} opts
   * @param {string} opts.root — project root directory
   * @param {Object} opts.config — hotPool config from storyboard.config.json
   * @param {Object} [opts.agentsConfig] — canvas.agents config
   * @param {Function} [opts.wsSend] — Vite server.ws.send for browser devlog events
   */
  constructor({ root, config = {}, agentsConfig = {}, wsSend = null }) {
    this.#enabled = config.enabled !== false
    this.#config = config
    const poolsConfig = config.pools || {}

    // Merge per-pool config with top-level defaults
    const mergeConfig = (poolId) => ({
      pool_size: poolsConfig[poolId]?.pool_size ?? config.pool_size ?? DEFAULT_POOL_SIZE,
      max_pool_size: poolsConfig[poolId]?.max_pool_size ?? config.max_pool_size ?? DEFAULT_MAX_POOL_SIZE,
      load_balancer_cooldown_mins: config.load_balancer_cooldown_mins ?? DEFAULT_COOLDOWN_MINS,
      load_balancer: config.load_balancer !== false,
      enabled: this.#enabled,
      verbose: !!config.verbose,
    })

    // Terminal pool (bare shells)
    this.#pools.set('terminal', new HotPool({
      root, poolId: 'terminal', config: mergeConfig('terminal'), wsSend,
    }))

    // Prompt pool (bare shells, separate from terminal)
    this.#pools.set('prompt', new HotPool({
      root, poolId: 'prompt', config: mergeConfig('prompt'), wsSend,
    }))

    // Agent pools (one per configured agent)
    if (agentsConfig && typeof agentsConfig === 'object') {
      for (const [id, agentCfg] of Object.entries(agentsConfig)) {
        if (!agentCfg.startupCommand) continue
        this.#pools.set(id, new HotPool({
          root, poolId: id, config: mergeConfig(id), agentConfig: agentCfg, wsSend,
        }))
      }
    }
  }

  /** Start all pools with staggered delays to avoid resource spikes. */
  async start() {
    if (!this.#enabled) return

    const poolEntries = [...this.#pools.entries()]

    // Start bare-shell pools first (fast), then agent pools (slow) with stagger
    const shellPools = poolEntries.filter(([, p]) => !p.isAgentPool)
    const agentPools = poolEntries.filter(([, p]) => p.isAgentPool)

    // Shell pools start immediately in parallel
    await Promise.all(shellPools.map(([, pool]) =>
      pool.start().catch(err => console.error(`[hot-pool:${pool.poolId}] Failed to start:`, err.message))
    ))

    // Agent pools start with stagger
    for (let i = 0; i < agentPools.length; i++) {
      const [, pool] = agentPools[i]
      if (i > 0) await new Promise(r => setTimeout(r, STAGGER_DELAY_MS))
      pool.start().catch(err => console.error(`[hot-pool:${pool.poolId}] Failed to start:`, err.message))
    }
  }

  stop() {
    for (const pool of this.#pools.values()) pool.stop()
  }

  /**
   * Acquire a warm session from the specified pool.
   * @param {string} poolId — pool to acquire from (e.g. 'terminal', 'copilot', 'prompt')
   */
  acquire(poolId) {
    const pool = this.#pools.get(poolId)
    if (!pool) return null
    return pool.acquire()
  }

  /** Consume a session (transfer ownership out of pool permanently). */
  consume(poolId, sessionId) {
    this.#pools.get(poolId)?.consume(sessionId)
  }

  /** Release a session back to the pool. */
  release(poolId, sessionId) {
    this.#pools.get(poolId)?.release(sessionId)
  }

  /** Get status of all pools. */
  status() {
    const pools = {}
    for (const [id, pool] of this.#pools) {
      pools[id] = pool.status()
    }
    return { enabled: this.#enabled, pools }
  }

  /** Reconfigure pools from updated config. */
  reconfigure(config) {
    const poolsConfig = config.pools || {}
    for (const [id, pool] of this.#pools) {
      const poolConfig = {
        pool_size: poolsConfig[id]?.pool_size ?? config.pool_size,
        max_pool_size: poolsConfig[id]?.max_pool_size ?? config.max_pool_size,
        load_balancer_cooldown_mins: config.load_balancer_cooldown_mins,
        load_balancer: config.load_balancer,
        enabled: config.enabled,
        verbose: config.verbose,
      }
      pool.reconfigure(poolConfig)
    }
    this.#enabled = config.enabled !== false
  }

  /** Check if a pool exists for the given ID. */
  has(poolId) {
    return this.#pools.has(poolId)
  }

  /** Get the list of pool IDs. */
  get poolIds() {
    return [...this.#pools.keys()]
  }
}
