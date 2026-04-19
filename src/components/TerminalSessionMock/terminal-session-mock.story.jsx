/**
 * Terminal Session Management — visual storyboard of the TMUX session
 * management experience: session picker, conflict resolution, warm-start,
 * orphan recovery, and the full lifecycle flow.
 */
import styles from './TerminalSessionMock.module.css'
import { Chrome, Line, Btn } from './TerminalSessionMock'

/* ═══════════════════════════════════════════════
   Scene 1 — Session Picker (This Canvas)
   ═══════════════════════════════════════════════ */

export function SessionPickerThisCanvas() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 1 — Session Picker (Default: This Canvas)</div>
      <p className={styles.storyCaption}>
        User clicks the session button in the terminal toolbar (or hits a keyboard shortcut).
        Default view shows only sessions from the current canvas, scoped to the current branch.
      </p>
      <Chrome
        title="Terminal"
        status="Live"
        actions={<>
          <Btn icon="⊞" label="Sessions" active />
          <Btn icon="✦" label="Copilot" />
        </>}
      >
        <div className={styles.sessionPicker}>
          <div className={styles.pickerTitle}>Select a session:</div>
          <div className={styles.pickerTabs}>
            Sessions: <span className={styles.pickerTabActive}>This canvas</span>
            {'   '}All canvases{'   '}All branches{'   '}
            <span style={{ color: '#484f58' }}>(tab to cycle)</span>
          </div>

          <div className={styles.pickerHeader}>
            {'     #   Status       Modified    Created     Summary'}
          </div>

          <div className={styles.pickerSeparator}>── terminal-widget-plan-v6 ──</div>

          <div className={`${styles.pickerRow} ${styles.selected}`}>
            <span className={styles.pickerCursor}>❯</span>
            <span className={styles.pickerNum}>1.</span>
            <span className={`${styles.pickerStatus} ${styles.statusLive}`}>Live</span>
            <span className={styles.pickerModified}>2m ago</span>
            <span className={styles.pickerCreated}>30m ago</span>
            <span className={styles.pickerSummary}>
              Copilot: migrate Button to CSS Modules
              <span className={`${styles.badge} ${styles.badgeLive}`}>! Live</span>
            </span>
          </div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>2.</span>
            <span className={`${styles.pickerStatus} ${styles.statusBackground}`}>Background</span>
            <span className={styles.pickerModified}>15m ago</span>
            <span className={styles.pickerCreated}>1h ago</span>
            <span className={styles.pickerSummary}>Shell: npm run build → tests</span>
          </div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>3.</span>
            <span className={`${styles.pickerStatus} ${styles.statusArchived}`}>Archived</span>
            <span className={styles.pickerModified}>1h ago</span>
            <span className={styles.pickerCreated}>3h ago</span>
            <span className={styles.pickerSummary}>Shell: debugging canvas perf</span>
          </div>

          <div className={styles.pickerFooter}>
            <span><span className={styles.pickerFooterKey}>↑↓</span> navigate</span>
            <span><span className={styles.pickerFooterKey}>Enter</span> select</span>
            <span><span className={styles.pickerFooterKey}>Esc</span> cancel</span>
            <span><span className={styles.pickerFooterKey}>/</span> search</span>
            <span className={styles.pickerFooterTmux}>
              <span className={styles.pickerFooterKey}>t</span> open tmux (advanced)
            </span>
          </div>
        </div>
      </Chrome>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 2 — Session Picker (All Canvases)
   ═══════════════════════════════════════════════ */

export function SessionPickerAllCanvases() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 2 — Session Picker (All Canvases, This Branch)</div>
      <p className={styles.storyCaption}>
        User tabs to "All canvases" — shows every session on the current branch,
        grouped by canvas name. Still no cross-branch sessions visible.
      </p>
      <Chrome
        title="Terminal"
        status="Live"
        actions={<>
          <Btn icon="⊞" label="Sessions" active />
          <Btn icon="✦" label="Copilot" />
        </>}
      >
        <div className={styles.sessionPicker}>
          <div className={styles.pickerTitle}>Select a session:</div>
          <div className={styles.pickerTabs}>
            Sessions: This canvas{'   '}
            <span className={styles.pickerTabActive}>All canvases</span>
            {'   '}All branches{'   '}
            <span style={{ color: '#484f58' }}>(tab to cycle)</span>
          </div>

          <div className={styles.pickerHeader}>
            {'     #   Status       Modified    Created     Summary'}
          </div>

          <div className={styles.pickerSeparator}>── terminal-widget-plan-v6 ──</div>

          <div className={`${styles.pickerRow} ${styles.selected}`}>
            <span className={styles.pickerCursor}>❯</span>
            <span className={styles.pickerNum}>1.</span>
            <span className={`${styles.pickerStatus} ${styles.statusLive}`}>Live</span>
            <span className={styles.pickerModified}>2m ago</span>
            <span className={styles.pickerCreated}>30m ago</span>
            <span className={styles.pickerSummary}>
              Copilot: migrate Button to CSS Modules
              <span className={`${styles.badge} ${styles.badgeLive}`}>! Live</span>
            </span>
          </div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>2.</span>
            <span className={`${styles.pickerStatus} ${styles.statusBackground}`}>Background</span>
            <span className={styles.pickerModified}>15m ago</span>
            <span className={styles.pickerCreated}>1h ago</span>
            <span className={styles.pickerSummary}>Shell: npm run build → tests</span>
          </div>

          <div className={styles.pickerSeparator}>── design-system ──</div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>3.</span>
            <span className={`${styles.pickerStatus} ${styles.statusBackground}`}>Background</span>
            <span className={styles.pickerModified}>20m ago</span>
            <span className={styles.pickerCreated}>2h ago</span>
            <span className={styles.pickerSummary}>Copilot: refactor Dialog component</span>
          </div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>4.</span>
            <span className={`${styles.pickerStatus} ${styles.statusArchived}`}>Archived</span>
            <span className={styles.pickerModified}>1h ago</span>
            <span className={styles.pickerCreated}>3h ago</span>
            <span className={styles.pickerSummary}>Shell: debugging canvas perf</span>
          </div>

          <div className={styles.pickerSeparator}>── button-patterns ──</div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>5.</span>
            <span className={`${styles.pickerStatus} ${styles.statusBackground}`}>Background</span>
            <span className={styles.pickerModified}>45m ago</span>
            <span className={styles.pickerCreated}>4h ago</span>
            <span className={styles.pickerSummary}>Shell: npm run lint → fixes</span>
          </div>

          <div className={styles.pickerFooter}>
            <span><span className={styles.pickerFooterKey}>↑↓</span> navigate</span>
            <span><span className={styles.pickerFooterKey}>Enter</span> select</span>
            <span><span className={styles.pickerFooterKey}>Esc</span> cancel</span>
            <span><span className={styles.pickerFooterKey}>/</span> search</span>
            <span className={styles.pickerFooterTmux}>
              <span className={styles.pickerFooterKey}>t</span> open tmux (advanced)
            </span>
          </div>
        </div>
      </Chrome>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 3 — Session Picker (All Branches)
   ═══════════════════════════════════════════════ */

export function SessionPickerAllBranches() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 3 — Session Picker (All Branches)</div>
      <p className={styles.storyCaption}>
        User tabs to "All branches" — shows sessions across all worktrees,
        grouped by branch. Current branch appears first.
      </p>
      <Chrome
        title="Terminal"
        status="Live"
        actions={<>
          <Btn icon="⊞" label="Sessions" active />
          <Btn icon="✦" label="Copilot" />
        </>}
      >
        <div className={styles.sessionPicker}>
          <div className={styles.pickerTitle}>Select a session:</div>
          <div className={styles.pickerTabs}>
            Sessions: This canvas{'   '}All canvases{'   '}
            <span className={styles.pickerTabActive}>All branches</span>
            {'   '}
            <span style={{ color: '#484f58' }}>(tab to cycle)</span>
          </div>

          <div className={styles.pickerHeader}>
            {'     #   Status       Modified    Created     Summary'}
          </div>

          <div className={styles.pickerSeparator}>── 4.2.0 (current) ──</div>

          <div className={`${styles.pickerRow} ${styles.selected}`}>
            <span className={styles.pickerCursor}>❯</span>
            <span className={styles.pickerNum}>1.</span>
            <span className={`${styles.pickerStatus} ${styles.statusLive}`}>Live</span>
            <span className={styles.pickerModified}>2m ago</span>
            <span className={styles.pickerCreated}>30m ago</span>
            <span className={styles.pickerSummary}>
              plan-v6 › Copilot: migrate Button
              <span className={`${styles.badge} ${styles.badgeLive}`}>! Live</span>
            </span>
          </div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>2.</span>
            <span className={`${styles.pickerStatus} ${styles.statusBackground}`}>Background</span>
            <span className={styles.pickerModified}>20m ago</span>
            <span className={styles.pickerCreated}>2h ago</span>
            <span className={styles.pickerSummary}>design-system › Copilot: refactor Dialog</span>
          </div>

          <div className={styles.pickerSeparator}>── 4.1.0 ──</div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>3.</span>
            <span className={`${styles.pickerStatus} ${styles.statusArchived}`}>Archived</span>
            <span className={styles.pickerModified}>2h ago</span>
            <span className={styles.pickerCreated}>1d ago</span>
            <span className={styles.pickerSummary}>
              design-system › Copilot: fix viewfinder routing
              <span className={`${styles.badge} ${styles.badgeActive}`}>! Active processes</span>
            </span>
          </div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>4.</span>
            <span className={`${styles.pickerStatus} ${styles.statusArchived}`}>Archived</span>
            <span className={styles.pickerModified}>3h ago</span>
            <span className={styles.pickerCreated}>2d ago</span>
            <span className={styles.pickerSummary}>test › Shell: npm audit</span>
          </div>

          <div className={styles.pickerSeparator}>── main ──</div>

          <div className={styles.pickerRow}>
            <span className={styles.pickerCursor}> </span>
            <span className={styles.pickerNum}>5.</span>
            <span className={`${styles.pickerStatus} ${styles.statusArchived}`}>Archived</span>
            <span className={styles.pickerModified}>1d ago</span>
            <span className={styles.pickerCreated}>3d ago</span>
            <span className={styles.pickerSummary}>examples › Shell: setup demo data</span>
          </div>

          <div className={styles.pickerFooter}>
            <span><span className={styles.pickerFooterKey}>↑↓</span> navigate</span>
            <span><span className={styles.pickerFooterKey}>Enter</span> select</span>
            <span><span className={styles.pickerFooterKey}>Esc</span> cancel</span>
            <span><span className={styles.pickerFooterKey}>/</span> search</span>
            <span className={styles.pickerFooterTmux}>
              <span className={styles.pickerFooterKey}>t</span> open tmux (advanced)
            </span>
          </div>
        </div>
      </Chrome>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 4 — Cross-Worktree Conflict
   ═══════════════════════════════════════════════ */

export function ConflictDialog() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 4 — Cross-Worktree Conflict</div>
      <p className={styles.storyCaption}>
        User opens a canvas on branch <code>4.2.0--tmux-management</code> that has a terminal widget
        whose TMUX session is currently live on branch <code>4.2.0</code>. The widget detects the
        conflict and presents a choice.
      </p>
      <Chrome
        title="Terminal"
        status="conflict"
        actions={<Btn icon="⊞" label="Sessions" />}
      >
        <div className={styles.conflictDialog}>
          <div style={{ marginBottom: 8 }}>
            <span className={styles.conflictIcon}>⚠ </span>
            <strong>Session conflict</strong>
          </div>
          <div style={{ color: '#8b949e', lineHeight: 1.6 }}>
            This terminal's session is currently <span className={styles.statusLive}>Live</span> on
            another worktree:
            <br /><br />
            <span style={{ color: '#e6edf3' }}>
              {'  '}Branch: <span style={{ color: '#58a6ff' }}>4.2.0</span>
              <br />
              {'  '}Canvas: <span style={{ color: '#58a6ff' }}>design-system</span>
              <br />
              {'  '}Running: <span style={{ color: '#3fb950' }}>copilot</span> (Copilot CLI — active conversation)
            </span>
            <br /><br />
            Detaching will disconnect it from the other worktree.
            The session content will be preserved.
          </div>
          <div className={styles.conflictActions}>
            <button className={`${styles.conflictBtn} ${styles.primary}`}>
              Detach and use here
            </button>
            <button className={styles.conflictBtn}>
              Start new session
            </button>
            <button className={styles.conflictBtn}>
              Cancel
            </button>
          </div>
        </div>
      </Chrome>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 5 — Warm-Start Banner
   ═══════════════════════════════════════════════ */

export function WarmStartBanner() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 5 — Warm-Start (Session Context)</div>
      <p className={styles.storyCaption}>
        A colleague opens a canvas with a terminal widget. No local TMUX session exists,
        but a <code>.session.md</code> context file was committed by the previous author.
        The widget shows a warm-start banner instead of a blank shell.
      </p>
      <Chrome
        title="Terminal"
        status="no session"
        actions={<Btn icon="⊞" label="Sessions" />}
      >
        <div className={styles.warmStart}>
          <div>
            <strong>Previous session by @dfosco</strong>
          </div>
          <div className={styles.warmStartMeta}>
            Last commit: <span style={{ color: '#e6edf3' }}>a1b2c3d</span> — "refactor: migrate Button to CSS modules"
            <br />
            Branch: <span style={{ color: '#58a6ff' }}>4.2.0</span> · Canvas: <span style={{ color: '#58a6ff' }}>design-system</span> · 12 widgets
          </div>

          <div className={styles.warmStartContext}>
{`## What Was Implemented
- Button component fully migrated to CSS Modules
- Button.story.jsx updated and passing

## What Was Interrupted
- Dialog migration incomplete — 3 of 7 style blocks converted
- Header migration not started

## Shell History (last 5)
  npm run build
  copilot "refactor Button component to use CSS modules"
  git diff --stat
  npm test -- --run src/components/Button/Button.test.js
  copilot "now migrate Dialog component"`}
          </div>

          <div className={styles.warmStartActions}>
            <button className={`${styles.conflictBtn} ${styles.primary}`}>
              Continue with Copilot
            </button>
            <button className={styles.conflictBtn}>
              Start fresh
            </button>
            <button className={styles.conflictBtn}>
              View full context
            </button>
          </div>
        </div>
      </Chrome>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 6 — Orphan Recovery
   ═══════════════════════════════════════════════ */

export function OrphanRecovery() {
  return (
    <div className={styles.storyFrame}>
      <div className={styles.storyLabel}>Scene 6 — Widget Deleted → Archived → Recovered</div>
      <p className={styles.storyCaption}>
        User accidentally deletes a terminal widget that had an active Copilot session.
        The session is archived (not killed). User undoes the deletion — the widget
        reconnects automatically to the preserved session.
      </p>

      {/* Step 1: Before delete */}
      <div className={styles.storyLabel} style={{ fontSize: 10, color: '#8b949e', marginBottom: 4 }}>
        Step 1: Widget active with Copilot session
      </div>
      <Chrome title="Terminal" status="Live" actions={<Btn icon="✦" label="Copilot" active />}>
        <Line output="I've identified 3 components that need CSS Module migration:" />
        <Line output="  1. Dialog (7 style blocks)" />
        <Line output="  2. Header (4 style blocks)" />
        <Line output="  3. Sidebar (2 style blocks)" />
        <Line output="" />
        <Line output="Starting with Dialog... ▋" />
      </Chrome>

      <div className={styles.arrow}>↓ user accidentally deletes widget</div>

      {/* Step 2: Archived notification */}
      <div className={styles.storyLabel} style={{ fontSize: 10, color: '#8b949e', marginBottom: 4 }}>
        Step 2: Session archived, not killed
      </div>
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 6,
        padding: '12px 16px',
        fontFamily: "'SF Mono', monospace",
        fontSize: 13,
        color: '#8b949e',
        textAlign: 'center'
      }}>
        <span style={{ color: '#d29922' }}>⚠</span> Widget removed.
        Session <span style={{ color: '#e6edf3' }}>archived</span> for 5 minutes.
        <br />
        <span style={{ fontSize: 11 }}>
          Undo to reconnect, or find it in{' '}
          <span style={{ color: '#58a6ff' }}>Sessions → This canvas</span>
        </span>
      </div>

      <div className={styles.arrow}>↓ user hits ⌘Z (undo)</div>

      {/* Step 3: Reconnected */}
      <div className={styles.storyLabel} style={{ fontSize: 10, color: '#8b949e', marginBottom: 4 }}>
        Step 3: Widget restored, session reconnected seamlessly
      </div>
      <Chrome title="Terminal" status="Live · reconnected" actions={<Btn icon="✦" label="Copilot" active />}>
        <Line output="I've identified 3 components that need CSS Module migration:" />
        <Line output="  1. Dialog (7 style blocks)" />
        <Line output="  2. Header (4 style blocks)" />
        <Line output="  3. Sidebar (2 style blocks)" />
        <Line output="" />
        <Line output="Starting with Dialog..." />
        <Line output="✓ Converted overlay backdrop styles" />
        <Line output="✓ Converted close button styles" />
        <Line output="Working on footer actions... ▋" />
      </Chrome>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   Scene 7 — Full Lifecycle Flow
   ═══════════════════════════════════════════════ */

export function FullLifecycle() {
  return (
    <div className={styles.storyFrame} style={{ maxWidth: 900 }}>
      <div className={styles.storyLabel}>Scene 7 — Full Session Lifecycle</div>
      <p className={styles.storyCaption}>
        The complete journey: create widget → session scoped to branch/canvas →
        switch sessions → cross-worktree conflict → archive on delete →
        context file committed → colleague picks up work.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        fontFamily: "'SF Mono', monospace",
        fontSize: 12,
        lineHeight: 1.6,
      }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: 12 }}>
            <div style={{ color: '#3fb950', fontWeight: 600, marginBottom: 4 }}>1. Create</div>
            <div style={{ color: '#8b949e' }}>
              Add terminal widget to canvas
              <br />→ TMUX session: <span style={{ color: '#e6edf3' }}>sb-4.2.0--plan-v6--terminal-abc</span>
              <br />→ Registry: status = <span style={{ color: '#3fb950' }}>Live</span>
            </div>
          </div>

          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: 12 }}>
            <div style={{ color: '#58a6ff', fontWeight: 600, marginBottom: 4 }}>2. Work</div>
            <div style={{ color: '#8b949e' }}>
              Run commands, launch Copilot
              <br />→ Session summary auto-updates
              <br />→ Context captured periodically
            </div>
          </div>

          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: 12 }}>
            <div style={{ color: '#58a6ff', fontWeight: 600, marginBottom: 4 }}>3. Switch</div>
            <div style={{ color: '#8b949e' }}>
              Open session picker → select #3
              <br />→ Old session: <span style={{ color: '#8b949e' }}>Background</span>
              <br />→ New session: <span style={{ color: '#3fb950' }}>Live</span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: 12 }}>
            <div style={{ color: '#d29922', fontWeight: 600, marginBottom: 4 }}>4. Delete Widget</div>
            <div style={{ color: '#8b949e' }}>
              Widget removed from canvas
              <br />→ Session NOT killed
              <br />→ Registry: status = <span style={{ color: '#d29922' }}>Archived</span>
              <br />→ Grace timer: 5 min
            </div>
          </div>

          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: 12 }}>
            <div style={{ color: '#d29922', fontWeight: 600, marginBottom: 4 }}>5. Context Saved</div>
            <div style={{ color: '#8b949e' }}>
              On archive, capture:
              <br />→ Last commit + canvas state
              <br />→ Planned / implemented / interrupted
              <br />→ Write to <span style={{ color: '#e6edf3' }}>assets/terminal-sessions/</span>
              <br />→ Committed to git
            </div>
          </div>

          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: 12 }}>
            <div style={{ color: '#bc8cff', fontWeight: 600, marginBottom: 4 }}>6. Colleague Picks Up</div>
            <div style={{ color: '#8b949e' }}>
              Opens canvas → terminal widget
              <br />→ No local session found
              <br />→ Reads <span style={{ color: '#e6edf3' }}>.session.md</span>
              <br />→ Warm-start: "Continue with Copilot"
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
