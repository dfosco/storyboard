/**
 * Terminal Widget Mockup stories — a visual storyboard of the
 * terminal-on-canvas experience, from idle shell to Copilot integration.
 */
import styles from './TerminalWidgetMock.module.css'

/* ── Shared primitives (inline for story self-containment) ── */

function Chrome({ title, status, actions, children }) {
  return (
    <div className={styles.chrome}>
      <div className={styles.titleBar}>
        <span className={styles.titleIcon}>⬛</span>
        <span className={styles.titleText}>{title}</span>
        {status && <span className={styles.status}>{status}</span>}
        <span className={styles.spacer} />
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.terminal}>{children}</div>
    </div>
  )
}

function Line({ prompt, command, output, muted }) {
  return (
    <div className={`${styles.line} ${muted ? styles.muted : ''}`}>
      {prompt && <span className={styles.prompt}>{prompt}</span>}
      {command && <span className={styles.command}>{command}</span>}
      {output && <div className={styles.output}>{output}</div>}
    </div>
  )
}

function Btn({ icon, label, active }) {
  return (
    <button className={`${styles.actionBtn} ${active ? styles.active : ''}`}>
      {icon} <span>{label}</span>
    </button>
  )
}

function CopilotBadge() {
  return <span className={styles.copilotBadge}>✦ Copilot</span>
}

function ContextTag({ label }) {
  return <span className={styles.contextTag}>{label}</span>
}

function ContextPanel({ widgets }) {
  return (
    <div className={styles.contextPanel}>
      <div className={styles.contextHeader}><span>📋 Canvas Context</span></div>
      <div className={styles.contextList}>
        {widgets.map((w, i) => (
          <div key={i} className={styles.contextItem}>
            <span className={styles.contextIcon}>{w.icon}</span>
            <span className={styles.contextLabel}>{w.label}</span>
            {w.attached && <span className={styles.contextAttached}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 1 — Empty terminal widget on canvas
   ═══════════════════════════════════════════════ */

export function EmptyTerminal() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 1 — Idle Terminal</div>
      <p className={styles.storyCaption}>
        A terminal widget on the canvas, connected to a local shell via WebSocket + node-pty.
        Behaves like any other canvas widget — drag, resize, toolbar actions.
      </p>
      <Chrome
        title="Terminal"
        status="connected"
        actions={<>
          <Btn icon="⟳" label="Restart" />
          <Btn icon="✕" label="Clear" />
        </>}
      >
        <Line prompt="~/storyboard $" command="" />
        <Line output="▋" />
      </Chrome>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 2 — Running a command
   ═══════════════════════════════════════════════ */

export function RunningCommand() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 2 — Shell in use</div>
      <p className={styles.storyCaption}>
        Full interactive shell — run builds, tests, git commands.
        Keyboard input goes to the terminal when focused; Escape returns focus to canvas.
      </p>
      <Chrome
        title="Terminal"
        status="running"
        actions={<>
          <Btn icon="⟳" label="Restart" />
          <Btn icon="✕" label="Clear" />
        </>}
      >
        <Line prompt="~/storyboard $" command="npm run build" />
        <Line output={`vite v6.3.1 building for production...
✓ 847 modules transformed.
dist/index.html          1.2 kB
dist/assets/index.js     342.1 kB │ gzip: 98.7 kB
dist/assets/style.css     28.4 kB │ gzip:  5.1 kB
✓ built in 3.42s`} />
        <Line prompt="~/storyboard $" command="" />
      </Chrome>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 3 — Copilot launcher
   ═══════════════════════════════════════════════ */

export function CopilotLauncher() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 3 — Launch Copilot</div>
      <p className={styles.storyCaption}>
        The toolbar has a "✦ Copilot" button that sends <code>copilot</code> to the PTY.
        Canvas context (selected widgets, sticky notes) is auto-attached as initial context.
      </p>
      <Chrome
        title="Terminal"
        status="connected"
        actions={<>
          <Btn icon="✦" label="Copilot" active />
          <Btn icon="⟳" label="Restart" />
          <Btn icon="✕" label="Clear" />
        </>}
      >
        <Line prompt="~/storyboard $" command="copilot" />
        <Line output={`Welcome to GitHub Copilot CLI v1.0.32
Powered by Claude Sonnet 4

Canvas context attached:
  📝 "TODO: Add terminal widget"
  📄 Plan: terminal-widget-copilot-integration.md
  🖼️ architecture-diagram.png

> `} />
      </Chrome>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 4 — Canvas context injection
   ═══════════════════════════════════════════════ */

export function CanvasContext() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 4 — Canvas Context</div>
      <p className={styles.storyCaption}>
        When Copilot launches, widgets on the same canvas are serialized and
        injected as context. Users can toggle which widgets to include.
      </p>
      <div className={styles.storyRow}>
        <Chrome
          title="Terminal"
          status="copilot"
          actions={<CopilotBadge />}
        >
          <Line output={`Canvas context (3 widgets attached):`} />
          <Line output={`  📝 sticky: "Fix the login redirect bug"`} />
          <Line output={`  📄 markdown: Architecture notes (248 words)`} />
          <Line output={`  🖼️ image: error-screenshot.png`} />
          <Line output="" />
          <Line output={`> Implement the fix described in the sticky note,`} />
          <Line output={`  following the architecture in the markdown block.`} />
          <Line output={`  The error screenshot shows the current behavior. ▋`} />
        </Chrome>
        <ContextPanel widgets={[
          { icon: '📝', label: 'Fix the login redirect...', attached: true },
          { icon: '📄', label: 'Architecture notes', attached: true },
          { icon: '🖼️', label: 'error-screenshot.png', attached: true },
          { icon: '🖥️', label: 'Login prototype', attached: false },
          { icon: '📝', label: 'Nice-to-have ideas', attached: false },
        ]} />
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 5 — Full flow: canvas → copilot → canvas
   ═══════════════════════════════════════════════ */

export function FullFlow() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 5 — Full Loop</div>
      <p className={styles.storyCaption}>
        Copilot output can be captured back to the canvas — code blocks
        become markdown widgets, summaries become sticky notes. The canvas
        becomes a persistent workspace for AI-assisted development.
      </p>
      <Chrome
        title="Terminal"
        status="copilot"
        actions={<CopilotBadge />}
      >
        <Line output="✓ Changes applied to src/auth/redirect.js" />
        <Line output="✓ Test added: src/auth/redirect.test.js" />
        <Line output="" />
        <Line output="Summary:" />
        <Line output={`  Fixed login redirect by checking for a stored
  returnUrl in sessionStorage before falling back
  to the default route. Added test coverage for
  the three redirect scenarios.`} />
        <Line output="" />
        <Line output={`[Add summary to canvas]  [Add diff to canvas]  [Done]`} />
        <Line output="▋" />
      </Chrome>

      <div className={styles.arrow}>↓ output captured as new widgets ↓</div>

      <div className={styles.storyRow}>
        <div className={styles.chrome} style={{ maxWidth: 260, fontSize: 12 }}>
          <div className={styles.titleBar}>
            <span className={styles.titleIcon}>📝</span>
            <span className={styles.titleText}>Copilot Summary</span>
          </div>
          <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--fgColor-default, #1f2328)', lineHeight: 1.5 }}>
            Fixed login redirect by checking for a stored returnUrl in sessionStorage before falling back to the default route.
          </div>
        </div>
        <div className={styles.chrome} style={{ maxWidth: 300, fontSize: 12 }}>
          <div className={styles.titleBar}>
            <span className={styles.titleIcon}>📄</span>
            <span className={styles.titleText}>Diff: redirect.js</span>
          </div>
          <div style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}>
            <div style={{ color: '#1a7f37' }}>+ const returnUrl = sessionStorage.getItem('returnUrl')</div>
            <div style={{ color: '#1a7f37' }}>+ if (returnUrl) {'{'}</div>
            <div style={{ color: '#1a7f37' }}>+   sessionStorage.removeItem('returnUrl')</div>
            <div style={{ color: '#1a7f37' }}>+   navigate(returnUrl)</div>
            <div style={{ color: '#cf222e' }}>- navigate('/dashboard')</div>
          </div>
        </div>
      </div>
    </div>
  )
}
