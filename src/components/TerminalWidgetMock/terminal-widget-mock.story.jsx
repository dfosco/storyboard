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
        The toolbar has a &quot;✦ Copilot&quot; button that sends <code>copilot</code> to the PTY.
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
   Scene 4 — Connected widgets as context
   ═══════════════════════════════════════════════ */

export function CanvasContext() {
  return (
    <div className={styles.storyFrame} style={{ maxWidth: 960 }}>
      <div className={styles.storyLabel}>Scene 4 — Widget Connectors</div>
      <p className={styles.storyCaption}>
        Widgets are connected to the terminal via connector lines drawn on the canvas.
        Connected widgets are automatically injected as context for the Copilot session.
        Connections can be added or removed by dragging from a widget&apos;s connector port to the terminal.
      </p>

      <div className={styles.storyRow} style={{ alignItems: 'center' }}>
        {/* Connected widgets on the left */}
        <div className={styles.connectedWidgets}>
          <div className={styles.connectorRow}>
            <div className={`${styles.miniWidget} ${styles.connected}`}>
              <span className={styles.miniWidgetIcon}>📝</span>
              <span className={styles.miniWidgetLabel}>Fix the login redirect bug</span>
            </div>
            <div className={styles.connectorLine} />
          </div>
          <div className={styles.connectorRow}>
            <div className={`${styles.miniWidget} ${styles.connected}`}>
              <span className={styles.miniWidgetIcon}>📄</span>
              <span className={styles.miniWidgetLabel}>Architecture notes</span>
            </div>
            <div className={styles.connectorLine} />
          </div>
          <div className={styles.connectorRow}>
            <div className={`${styles.miniWidget} ${styles.connected}`}>
              <span className={styles.miniWidgetIcon}>🖼️</span>
              <span className={styles.miniWidgetLabel}>error-screenshot.png</span>
            </div>
            <div className={styles.connectorLine} />
          </div>
          <div className={styles.connectorRow}>
            <div className={`${styles.miniWidget} ${styles.disconnected}`}>
              <span className={styles.miniWidgetIcon}>🖥️</span>
              <span className={styles.miniWidgetLabel}>Login prototype</span>
            </div>
            <div className={`${styles.connectorLine} ${styles.dashed}`} />
          </div>
        </div>

        {/* Terminal in the center */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Chrome
            title="Terminal"
            status="copilot"
            actions={<CopilotBadge />}
          >
            <Line output={`3 connected widgets → context injected`} />
            <Line output="" />
            <Line output={`> Implement the fix described in the sticky note,`} />
            <Line output={`  following the architecture in the markdown block.`} />
            <Line output={`  The error screenshot shows the current behavior. ▋`} />
          </Chrome>
        </div>
      </div>

      <p className={styles.storyCaption} style={{ marginTop: 8 }}>
        <strong>Server-side:</strong> each terminal stores its connections in{' '}
        <code>.storyboard/terminal-{'<id>'}.connectedWidgets.json</code>,
        similar to <code>selectedWidgets.json</code>. Widget content is serialized
        and passed to Copilot as context on every prompt.
      </p>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 5 — Full flow: connected widgets ↔ copilot
   ═══════════════════════════════════════════════ */

export function FullFlow() {
  return (
    <div className={styles.storyFrame} style={{ maxWidth: 960 }}>
      <div className={styles.storyLabel}>Scene 5 — Bidirectional Flow</div>
      <p className={styles.storyCaption}>
        Copilot reads from connected widgets and writes back to them.
        Changes requested in the terminal are automatically applied to
        the connected widgets — a sticky note gets updated text, a markdown
        block gets new content, new widgets get created and auto-connected.
      </p>

      <div className={styles.storyRow} style={{ alignItems: 'center' }}>
        {/* Connected widgets — showing before/after state */}
        <div className={styles.connectedWidgets}>
          <div className={styles.connectorRow}>
            <div className={`${styles.miniWidget} ${styles.connected}`}>
              <span className={styles.miniWidgetIcon}>📝</span>
              <span className={styles.miniWidgetLabel} style={{ textDecoration: 'line-through', opacity: 0.5 }}>Fix the login redirect bug</span>
            </div>
            <div className={styles.connectorLine} />
          </div>
          <div className={styles.connectorRow}>
            <div className={`${styles.miniWidget} ${styles.connected}`} style={{ borderColor: '#1a7f37' }}>
              <span className={styles.miniWidgetIcon}>📝</span>
              <span className={styles.miniWidgetLabel}>✓ Login redirect fixed</span>
            </div>
            <div className={styles.connectorLine} style={{ background: '#1a7f37' }} />
          </div>
          <div className={styles.connectorRow}>
            <div className={`${styles.miniWidget} ${styles.connected}`}>
              <span className={styles.miniWidgetIcon}>📄</span>
              <span className={styles.miniWidgetLabel}>Architecture notes</span>
            </div>
            <div className={styles.connectorLine} />
          </div>
          <div className={styles.connectorRow}>
            <div className={`${styles.miniWidget} ${styles.connected}`} style={{ borderColor: '#1a7f37', borderStyle: 'dashed' }}>
              <span className={styles.miniWidgetIcon}>📄</span>
              <span className={styles.miniWidgetLabel} style={{ color: '#1a7f37' }}>+ Diff: redirect.js (new)</span>
            </div>
            <div className={styles.connectorLine} style={{ background: '#1a7f37' }} />
          </div>
        </div>

        {/* Terminal showing the completed operation */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Chrome
            title="Terminal"
            status="copilot"
            actions={<CopilotBadge />}
          >
            <Line output="✓ Applied fix to src/auth/redirect.js" />
            <Line output="✓ Updated sticky: 'Fix the login redirect bug' → '✓ Login redirect fixed'" />
            <Line output="✓ Created widget: Diff: redirect.js" />
            <Line output="  → auto-connected to this terminal" />
            <Line output="" />
            <Line output={`4 widgets connected · 2 modified · 1 created`} />
            <Line prompt="~/storyboard $" command="" />
          </Chrome>
        </div>
      </div>

      <div className={styles.arrow}>↕ connected widgets are both input and output</div>

      <p className={styles.storyCaption}>
        The terminal acts as a command center. Connected widgets flow in as
        context and get mutated by Copilot&apos;s actions. New widgets (diffs,
        summaries) are created on the canvas and auto-connected back to
        the terminal session.
      </p>
    </div>
  )
}
