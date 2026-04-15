# Storyboard Desktop App — Plan

> A native macOS/Windows app that runs any storyboard instance as a "sketch file", wrapping all CLI operations in UI, with autosync git, and virtualized terminal sessions for AI agent interaction.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Storyboard Desktop App                  │
│                    (Rust / Tauri v2)                      │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  App Shell   │  │  PTY Manager │  │  Git Engine    │  │
│  │  (Webview)   │  │  (portable-  │  │  (gitoxide /   │  │
│  │              │  │   pty / tokio)│  │   git2-rs)     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
│  ┌──────┴─────────────────┴───────────────────┴────────┐ │
│  │              Tauri IPC Command Layer                  │ │
│  │  (Rust ↔ JS bridge: projects, git, pty, agent)      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │          Node Sidecar (bundled with app)              │ │
│  │  storyboard CLI • Vite dev server • autosync server  │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Why Tauri v2

- Rust core for performance, small binary, native OS integration
- Uses the system webview (WebKit on macOS, WebView2 on Windows) — no Chromium bundled, ~5-10 MB binary
- v2 supports multi-window, system tray, deep links, auto-updater, and mobile (future)
- First-class IPC between Rust backend and JS frontend
- The storyboard frontend (React + Vite) becomes the webview content directly — zero porting work

### Why Node Sidecar (not rewrite)

Storyboard's entire dev pipeline is Node.js: the Vite data plugin, the server plugin middleware (`/_storyboard/*`), the CLI (`storyboard dev`, `setup`, `proxy`, `create`), autosync, canvas server, workshop features, rename watcher, and all the Svelte UI build. Rewriting this in Rust would be a multi-year effort with zero user benefit.

Instead, the app bundles a Node.js runtime as a **sidecar process** that Tauri manages. The Rust layer handles:
- Native windowing and webview management
- PTY allocation for terminal virtualization
- Git operations via `gitoxide` or `git2-rs` for fast autosync
- File watching (via `notify` crate) for project-level events
- OS integration: file associations, deep links, menu bar, system tray

The Node sidecar handles:
- Everything the existing `storyboard` CLI does today
- Vite dev server lifecycle
- All `/_storyboard/*` API middleware (canvas, autosync, workshop, docs)
- Data plugin discovery and virtual module generation

This means **every existing storyboard client repo works unchanged** — the app just manages the Node process lifecycle instead of the user running `npx storyboard dev` manually.

---

## 2. Project Model: "Sketch Files"

Each storyboard client repo is a **project**. The app maintains a project registry:

```
~/.storyboard-app/
  projects.json          # registry: path, name, last opened, git remote
  settings.json          # global app settings
  node/                  # bundled Node.js runtime
  cache/                 # thumbnails, index cache
```

### Opening a project

1. User opens a folder (or drags it onto the app, or uses "Open Recent")
2. App detects `storyboard.config.json` → valid storyboard project
3. App reads `package.json` to check `@dfosco/storyboard-core` version
4. If deps are missing, runs `npm install` via Node sidecar (with progress UI)
5. Starts the Vite dev server via sidecar (`storyboard dev`)
6. Points the main webview at the dev server URL
7. Registers the project in `projects.json`

### Project switcher / launcher

The app's **home screen** (when no project is open) shows:
- Recent projects with thumbnails
- "Open Folder" button
- "Clone from GitHub" (runs `git clone` via the git engine)
- Template gallery (starter repos)

---

## 3. CLI Operations → App UI

Every CLI operation today maps to an app UI action. The Rust layer manages the Node sidecar and exposes Tauri commands that the React frontend calls.

| CLI Command | App UI Equivalent |
|---|---|
| `storyboard setup` | First-launch wizard; also runs automatically on project open |
| `storyboard dev` | Automatic on project open; status indicator in title bar |
| `storyboard dev [branch]` | Branch picker in sidebar → starts sidecar for that branch |
| `storyboard create prototype` | Existing workshop UI (already in browser) — no change needed |
| `storyboard create canvas` | Same — workshop UI |
| `storyboard create flow` | Same — workshop UI |
| `storyboard proxy` | Eliminated — app manages routing directly |
| `storyboard exit` | Close project / quit app |
| `storyboard update:version` | "Check for updates" in app settings → runs npm update in sidecar |
| `storyboard snapshots` | "Generate snapshots" in canvas toolbar → runs sidecar command |

### Caddy proxy elimination

The Caddy proxy exists because each worktree dev server runs on a different port and users need clean URLs. Inside the app, the Rust layer can:
- Route webview requests directly to the correct Vite dev server port
- Use Tauri's custom protocol handler to map `storyboard://project/branch/path` to the right server
- Or simply manage a single webview per branch tab

This eliminates the Caddy dependency entirely for desktop users. The CLI + Caddy path remains for terminal-only users.

---

## 4. Git Engine: Autosync as Default

Git operations are the heart of the "just works" experience. The current autosync server (`packages/core/src/autosync/server.js`) does commit + push via `child_process.execFileSync('git', ...)`. The desktop app improves this:

### Architecture

```
┌─────────────────────────────────┐
│        Git Engine (Rust)         │
│  ┌───────────┐  ┌─────────────┐ │
│  │ gitoxide   │  │ File Watcher│ │
│  │ (pure Rust │  │ (notify)    │ │
│  │  git impl) │  │             │ │
│  └─────┬──────┘  └──────┬──────┘ │
│        │                │        │
│  ┌─────┴────────────────┴──────┐ │
│  │     Autosync Scheduler      │ │
│  │  • debounced file changes   │ │
│  │  • scope-aware (canvas/     │ │
│  │    prototype)               │ │
│  │  • conflict resolution      │ │
│  │  • push retry with rebase   │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Behavior

- **Always on by default** — no "enable autosync" step. The app watches the project directory and auto-commits + pushes changes on a debounced interval (30s, matching current behavior).
- **Scope-aware** — canvas changes and prototype changes are committed separately, same as current `SCOPE_ORDER = ['canvas', 'prototype']`.
- **Repo-busy guards** — same guards as current autosync (`index.lock`, `rebase`, `merge`, `cherry-pick`, branch drift), but checked via `gitoxide` instead of shell-out.
- **Conflict resolution UI** — when push fails due to divergence, the app shows a UI prompt instead of silently retrying. Options: "Pull & rebase", "Force push", "Open in terminal".
- **Branch management** — the app shows a branch sidebar. Creating a branch = creating a worktree. Switching branches = switching the webview to that worktree's dev server.
- **Commit history** — a timeline view showing autosync commits + manual commits. Users can squash autosync commits before merging.

### Why gitoxide over shelling out to git

- No dependency on system `git` installation
- Faster for status checks, staging, and diffing (no process spawn overhead)
- Better error handling (Rust types vs parsing stderr)
- Can run git operations concurrently without index.lock contention (using separate worktree indexes)

### Fallback

If `gitoxide` doesn't support an operation (it's still maturing), fall back to `git2-rs` (libgit2 bindings) or `Command::new("git")` — same as current approach but managed by Rust instead of Node.

---

## 5. Virtualized Terminal Sessions

This is the most novel feature. The app needs to:

1. Allocate PTY (pseudo-terminal) sessions
2. Run arbitrary commands in those PTYs
3. Capture and relay stdout/stderr to the app UI
4. Send stdin (keystrokes, text, control sequences) from the app UI to the PTY
5. Specifically support Copilot CLI and Claude Code agent sessions

### PTY Architecture

```
┌──────────────────────────────────────────────┐
│              App UI (Webview)                  │
│  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Terminal Panel│  │  Agent Chat Panel     │ │
│  │ (xterm.js)   │  │  (structured I/O)     │ │
│  └──────┬───────┘  └──────────┬────────────┘ │
│         │                     │               │
│         │    Tauri IPC        │               │
│  ═══════╪═════════════════════╪═══════════════│
│         │                     │               │
│  ┌──────┴─────────────────────┴────────────┐  │
│  │          PTY Manager (Rust)              │  │
│  │                                          │  │
│  │  Session 1: /bin/zsh (general terminal)  │  │
│  │  Session 2: claude (Claude Code agent)   │  │
│  │  Session 3: gh copilot (Copilot CLI)     │  │
│  │                                          │  │
│  │  Each session:                           │  │
│  │  • portable-pty for OS-level PTY         │  │
│  │  • tokio for async I/O multiplexing      │  │
│  │  • Ring buffer for scrollback history    │  │
│  │  • ANSI parser for structured output     │  │
│  └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Rust PTY Implementation

Use the `portable-pty` crate (by Wez Furlong, creator of WezTerm) for cross-platform PTY allocation:

```
portable-pty          # PTY allocation (macOS + Windows)
tokio                 # Async runtime for I/O multiplexing
vt100                 # VT100/ANSI terminal state parser
```

Each PTY session is a Rust struct managing:
- The PTY master/slave pair
- An async reader task (tokio) that reads output and sends it to the webview via Tauri events
- A write handle that accepts input from the webview via Tauri commands
- A `vt100::Parser` for understanding terminal state (cursor position, screen contents, colors)

### Terminal UI in the Webview

Use **xterm.js** in the webview for full terminal rendering:
- Receives raw bytes from the PTY via Tauri events
- Sends keystrokes back to the PTY via Tauri commands
- Supports copy/paste, selection, search, font customization
- Can run in a panel, tab, or split view

### Agent Mode: Structured I/O

For AI agent sessions (Copilot, Claude Code), the app adds a **structured layer** on top of the raw PTY:

1. **Prompt submission** — The app can programmatically send text to the PTY stdin, simulating the user typing a prompt and pressing Enter.
2. **Output parsing** — The `vt100` parser tracks terminal state. The app can detect when the agent is "thinking" vs "done" by monitoring cursor position and output patterns.
3. **Chat-like UI** — In addition to the raw terminal view, the app can render a chat-like panel that shows:
   - User prompts (sent by the app)
   - Agent responses (captured from stdout)
   - Tool calls and their results (parsed from ANSI output)
4. **Keyboard shortcuts** — The app can send control sequences (Ctrl+C to cancel, Ctrl+D to exit, Tab for completion, arrow keys for navigation).

### Agent Session Lifecycle

```
User clicks "Start Claude Code session"
  → App spawns PTY: `claude --project /path/to/storyboard-client`
  → PTY output streams to both:
      a) xterm.js terminal panel (raw view)
      b) Chat panel (parsed/structured view)
  → User types in chat panel → app sends to PTY stdin
  → User can also type directly in terminal panel
  → App can inject prompts programmatically:
      "Create a new prototype called Dashboard"
  → Agent runs, output streams in real-time
  → App detects completion, shows result in chat panel
```

### Multi-Session Management

The app supports multiple concurrent PTY sessions:
- **Tabs** in a bottom panel (like VS Code's terminal)
- Each tab can be: raw terminal, Claude Code, Copilot, or a custom command
- Sessions persist across webview navigations (the PTY lives in Rust, not the webview)
- Sessions can be named, pinned, and restored on project reopen

---

## 6. App UI Layout

```
┌──────────────────────────────────────────────────────┐
│  [Project Name] ▾  │  Branch: feature/dashboard ▾   │
├────────┬─────────────────────────────────────────────┤
│        │                                             │
│ Sidebar│         Main Webview                        │
│        │  (Storyboard client running in Vite)        │
│ • Home │                                             │
│ • Proto│  ┌─────────────────────────────────────┐    │
│ • Canvas│  │  Your actual storyboard prototype   │    │
│ • Branch│  │  running exactly as it does today   │    │
│        │  │  in the browser                      │    │
│        │  └─────────────────────────────────────┘    │
│        │                                             │
│        │  Storyboard toolbar (existing, in webview)  │
├────────┴─────────────────────────────────────────────┤
│  Terminal / Agent Panel                        [▲][×]│
│  ┌─────────┬──────────┬──────────┐                   │
│  │ Terminal │ Claude   │ Copilot  │ [+]               │
│  ├─────────┴──────────┴──────────┤                   │
│  │ $ claude                       │                   │
│  │ > What would you like to do?   │                   │
│  │                                │                   │
│  │ User: Create a dashboard proto │                   │
│  │ Claude: I'll create that...    │                   │
│  └────────────────────────────────┘                   │
└──────────────────────────────────────────────────────┘
```

The key insight: **the main webview IS the storyboard client**. The app chrome (sidebar, title bar, terminal panel) wraps it. The existing storyboard toolbar, workshop UI, canvas, viewfinder — all run unchanged inside the webview.

---

## 7. New Repository: `storyboard-app`

This should be a **separate repository** from the storyboard core monorepo.

```
storyboard-app/
  src-tauri/              # Rust backend
    src/
      main.rs             # Tauri app entry
      commands/
        project.rs        # Project open/close/list commands
        git.rs            # Git operations (gitoxide)
        pty.rs            # PTY session management
        sidecar.rs        # Node sidecar lifecycle
        agent.rs          # Agent session helpers
      git/
        autosync.rs       # Autosync scheduler
        watcher.rs        # File watcher (notify)
      pty/
        session.rs        # PTY session struct
        multiplexer.rs    # Async I/O multiplexer
        parser.rs         # vt100 output parser
    Cargo.toml
    tauri.conf.json       # Tauri config: window size, permissions, sidecar
    icons/

  src/                    # Frontend (app chrome, not storyboard client)
    App.jsx               # App shell layout
    components/
      Sidebar.jsx         # Project navigation sidebar
      TitleBar.jsx        # Custom title bar with branch picker
      TerminalPanel.jsx   # Terminal/agent panel (xterm.js)
      AgentChat.jsx       # Structured agent chat view
      ProjectLauncher.jsx # Home screen / project picker
      BranchPicker.jsx    # Git branch management
      ConflictResolver.jsx # Git conflict resolution UI
    hooks/
      useProject.js       # Project state management
      usePty.js           # PTY session hook (Tauri IPC)
      useGit.js           # Git state hook
      useAgent.js         # Agent session hook
    lib/
      tauri-ipc.js        # Typed Tauri command wrappers

  package.json
  vite.config.js          # Vite config for app chrome only
  README.md
```

### Key Tauri Config

```json
{
  "app": {
    "windows": [
      {
        "title": "Storyboard",
        "width": 1400,
        "height": 900,
        "decorations": false,
        "transparent": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; connect-src 'self' http://localhost:* ws://localhost:* http://*.localhost"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "nsis"],
    "externalBin": ["node"],
    "resources": ["node_modules/"]
  }
}
```

---

## 8. Rust Crate Dependencies

```toml
[dependencies]
tauri = { version = "2", features = ["shell-open", "dialog", "fs", "process"] }
tauri-plugin-shell = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-process = "2"
tauri-plugin-updater = "2"

# Git
gix = "0.68"                    # gitoxide — pure Rust git
# git2 = "0.19"                 # fallback: libgit2 bindings

# PTY
portable-pty = "0.8"            # cross-platform PTY
vt100 = "0.15"                  # terminal state parser

# Async
tokio = { version = "1", features = ["full"] }

# File watching
notify = "7"                    # cross-platform file watcher

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

---

## 9. Implementation Phases

### Phase 1: Foundation (4-6 weeks)
- [ ] Initialize Tauri v2 project with React frontend
- [ ] Node sidecar management: bundle Node, spawn `storyboard dev`, capture output
- [ ] Project open/close: detect `storyboard.config.json`, run npm install, start dev server
- [ ] Main webview pointing at Vite dev server
- [ ] Basic app chrome: title bar, window controls
- [ ] Project launcher (recent projects, open folder)

### Phase 2: Git Engine (3-4 weeks)
- [ ] Rust git layer with gitoxide: status, stage, commit, push, pull
- [ ] Port autosync logic from Node to Rust (preserving scope-aware behavior)
- [ ] File watcher → debounced autosync trigger
- [ ] Branch sidebar: list branches, create branch (= create worktree via sidecar)
- [ ] Switch branch = switch webview to different dev server port
- [ ] Conflict resolution UI (pull/rebase, force push, open terminal)

### Phase 3: Terminal Virtualization (3-4 weeks)
- [ ] PTY manager in Rust (portable-pty + tokio)
- [ ] xterm.js integration in webview
- [ ] Terminal panel with tabs (create, close, rename sessions)
- [ ] stdin/stdout relay between xterm.js and Rust PTY
- [ ] Session persistence across webview navigation
- [ ] Multi-session support (multiple tabs)

### Phase 4: Agent Integration (3-4 weeks)
- [ ] Claude Code session type: spawn `claude`, parse output
- [ ] Copilot session type: spawn `gh copilot`, parse output
- [ ] Structured chat panel alongside raw terminal
- [ ] Programmatic prompt submission (app UI → PTY stdin)
- [ ] Output detection (agent idle/thinking/responding state machine)
- [ ] Keyboard shortcut relay (Ctrl+C, Tab, arrows)

### Phase 5: Polish & Distribution (2-3 weeks)
- [ ] Auto-updater (Tauri's built-in updater plugin)
- [ ] macOS code signing + notarization
- [ ] Windows code signing
- [ ] DMG and NSIS installer builds
- [ ] CI/CD: GitHub Actions for cross-platform builds
- [ ] Onboarding flow for first-time users
- [ ] Settings: theme, font, keybindings, default agent

---

## 10. Key Design Decisions

### Decision 1: Webview content = the storyboard client, not a reimplementation

The app does NOT reimplement the storyboard UI. It loads the actual Vite dev server output in the webview. This means:
- Zero maintenance burden for keeping app UI in sync with storyboard features
- Every storyboard feature (canvas, workshop, viewfinder, toolbar) works immediately
- The app chrome (sidebar, terminal panel, title bar) is minimal — it's a wrapper

### Decision 2: Node sidecar, not full Rust rewrite

The existing Node toolchain (Vite, the data plugin, the server plugin, autosync, workshop) is ~15k+ lines of working, tested code. Rewriting it in Rust gains nothing — Vite must be Node, the plugins must be JS. The sidecar approach means:
- Existing storyboard updates just work (update the npm packages in the sidecar)
- The Rust layer only handles things Rust is genuinely better at: PTY, git, OS integration
- Contributors can work on Node code without knowing Rust and vice versa

### Decision 3: gitoxide for git, not shelling out

The current autosync shells out to `git` via `execFileSync`. This works but has downsides:
- Requires git to be installed
- Process spawn overhead on every status check (every 30 seconds × N worktrees)
- Error handling is string parsing
- Index.lock contention between concurrent operations

gitoxide (pure Rust git) eliminates all of these. Fallback to `git2-rs` or `Command::new("git")` for operations gitoxide doesn't support yet.

### Decision 4: Eliminate Caddy for desktop users

The Caddy reverse proxy exists to give worktrees clean URLs. Inside the app, routing is handled by the app itself — it knows which port each branch's dev server is on and can route the webview accordingly. Caddy remains available for CLI-only users.

### Decision 5: PTY-based agent integration, not API-based

AI agents (Claude Code, Copilot) are CLI tools that run in a terminal. Rather than integrating their APIs directly (which would require API keys, custom protocols, and constant maintenance as APIs change), the app runs them in a real PTY. This means:
- Any CLI agent works — not just Claude and Copilot
- The agent's own auth flow (browser OAuth, API key prompt) works naturally
- No API key management in the app
- Users see the real terminal output (trust, transparency)
- The structured chat view is a convenience layer on top, not a replacement

---

## 11. Risk Assessment

| Risk | Mitigation |
|---|---|
| gitoxide doesn't support all needed operations | Fallback chain: gitoxide → git2-rs → shell git |
| Node sidecar packaging is complex | Tauri has built-in sidecar support; alternatively bundle standalone Node via `pkg` or `sea` |
| Agent output parsing is fragile | Keep raw terminal as primary view; structured chat is best-effort |
| Windows PTY behavior differs from macOS | `portable-pty` abstracts this; test extensively on Windows |
| Webview performance for terminal rendering | xterm.js is battle-tested; use WebGL renderer for performance |
| Bundle size with Node runtime | Node standalone executable is ~40 MB; acceptable for desktop app |
| Keeping sidecar Node version in sync with storyboard | Pin Node version; auto-update mechanism |

---

## 12. What Changes in Storyboard Core

Minimal changes needed in the existing storyboard packages:

1. **`storyboard.config.json`** — add optional `app` section for desktop-specific settings (window size, default agent, etc.)
2. **Dev server** — add a `--headless` flag to `storyboard dev` that suppresses interactive prompts (sidecar runs non-interactively)
3. **Autosync server** — add an HTTP endpoint to report status that the Rust layer can poll (or the Rust autosync replaces it entirely)
4. **Proxy** — make proxy optional; skip Caddy setup when `STORYBOARD_APP=1` env var is set

Everything else stays the same. Client repos don't need to change at all.
