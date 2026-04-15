# Storyboard Desktop App — Plan

> A native macOS/Windows app that runs any storyboard instance as a "sketch file", wrapping all CLI operations in UI, with autosync git, and virtualized terminal sessions for AI agent interaction.

---

## Reference Libraries

| Library | Role | Link |
|---------|------|------|
| **Tauri v2** | Desktop app framework. Rust backend + system webview (wry). Mature IPC, sidecar management, auto-updater, bundling. | [tauri-apps/tauri](https://github.com/tauri-apps/tauri) |
| **wry** | Cross-platform webview rendering (WKWebView on macOS, WebView2 on Windows). The engine underneath Tauri. | [tauri-apps/wry](https://github.com/tauri-apps/wry) |
| **ghostty-web** | Ghostty's native VT terminal compiled to WASM. xterm.js-compatible API, ~400KB bundle, zero dependencies. Drop-in replacement for xterm.js with native Ghostty quality. | [coder/ghostty-web](https://github.com/coder/ghostty-web) |
| **gpui-ghostty** | Reference: embeds libghostty-vt in GPUI. Kept as future reference for native terminal rendering if needed. | [Xuanwo/gpui-ghostty](https://github.com/Xuanwo/gpui-ghostty) |

### Architecture Revision: ghostty-web simplifies everything

The discovery of `ghostty-web` (Ghostty's VT core compiled to WASM with xterm.js API compatibility) changes the architecture significantly:

- **Before**: GPUI native shell + wry webview overlay + libghostty-vt native terminal (Zig build required)
- **After**: **Tauri v2** + **ghostty-web** in the webview (WASM, no native build complexity)

This means:
- **Single rendering surface** — everything in the system webview (React UI + ghostty-web terminal)
- **No GPUI** — Tauri's webview handles the entire UI. Simpler, more mature, better documented.
- **No Zig toolchain** — ghostty-web ships as a pre-built WASM + JS npm package
- **Same Ghostty quality** — the WASM module IS the native Ghostty VT core, just compiled to WebAssembly instead of native code
- **PTY stays in Rust** — Tauri backend manages PTY allocation, I/O streams to/from webview via Tauri events
- **Drastically simpler build** — standard `cargo` + `npm` toolchain, no Zig, no GPUI submodules

---

## Architecture Decision: GPUI + wry vs. Tauri

The original plan proposed Tauri v2 (which uses wry internally). The reference libraries open up a more powerful option:

### Option A: Tauri v2 (wry under the hood)
- **Pros**: Mature ecosystem, built-in IPC, auto-updater, sidecar management, bundling. Well-documented. Lower effort.
- **Cons**: Terminal panel must be rendered in the webview (xterm.js) — no native GPU terminal. The webview is the *only* rendering surface; app chrome is also HTML/CSS.

### Option B: GPUI shell + wry webview + libghostty-vt terminal ← **Recommended**
- **Pros**: Native GPU-rendered app chrome and terminal (like Zed). Webview (wry) for the storyboard client. Terminal uses Ghostty's battle-tested VT core — same quality as the Ghostty terminal app. The terminal panel is a first-class native element, not a JS widget.
- **Cons**: GPUI is newer, less documented. Webview embedding in GPUI is overlay-based (floats on top of GPUI content), similar to VS Code. More integration work upfront.
- **Why it's better for Storyboard**: The terminal/agent panel is a core feature, not an afterthought. A native GPU-rendered terminal (Ghostty quality) with programmatic I/O control is fundamentally better than xterm.js in a webview. GPUI also means the sidebar, title bar, and panels are native Rust UI — fast, themeable, no HTML overhead.

### Hybrid Architecture (Option B, detailed)

```
┌──────────────────────────────────────────────────────────────┐
│                   Storyboard Desktop App                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    GPUI Shell (Rust)                     │  │
│  │  Title bar · Sidebar · Panels · Branch picker · Tabs    │  │
│  │  GPU-rendered via Metal (macOS) / Vulkan (Windows)      │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────┐                  │  │
│  │  │     wry Webview (overlay)           │                  │  │
│  │  │  Storyboard client (Vite dev server)│                  │  │
│  │  │  Loads http://localhost:<port>/      │                  │  │
│  │  │  All existing storyboard UI runs    │                  │  │
│  │  │  here unchanged                     │                  │  │
│  │  └────────────────────────────────────┘                  │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────┐                  │  │
│  │  │  Ghostty Terminal Panel (native)    │                  │  │
│  │  │  libghostty-vt + GPUI rendering     │                  │  │
│  │  │  GPU-accelerated, real PTY          │                  │  │
│  │  │  Claude Code / Copilot sessions     │                  │  │
│  │  └────────────────────────────────────┘                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Rust Backend Services                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │  │
│  │  │ Git Engine│  │ PTY Mgr  │  │ Node Sidecar Manager │ │  │
│  │  │ (gitoxide)│  │ (ghostty │  │ (storyboard CLI,     │ │  │
│  │  │           │  │  + pty)  │  │  Vite dev server)    │ │  │
│  │  └──────────┘  └──────────┘  └───────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Key insight**: The app has TWO rendering surfaces:
1. **wry webview** — for the storyboard client (React, Vite HMR, existing UI). This is the "sketch file" being viewed.
2. **GPUI native** — for everything else: app chrome, sidebar, terminal panel, agent chat. GPU-rendered, fast, native feel.

The webview floats as an overlay inside the GPUI window (same technique Zed uses for extension webviews). The terminal panel is a native GPUI element using `gpui-ghostty` for rendering and `libghostty-vt` for emulation.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Storyboard Desktop App                  │
│              (Rust: GPUI + wry + libghostty)             │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  App Shell   │  │  Terminal    │  │  Git Engine    │  │
│  │  (GPUI +     │  │  (ghostty   │  │  (gitoxide /   │  │
│  │   wry overlay│  │   VT + GPUI)│  │   git2-rs)     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                   │           │
│  ┌──────┴─────────────────┴───────────────────┴────────┐ │
│  │           App State + Command Layer (Rust)           │ │
│  │  (projects, git, pty, agent, sidecar management)     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │          Node Sidecar (bundled with app)              │ │
│  │  storyboard CLI • Vite dev server • autosync server  │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Why GPUI + wry (not Tauri alone)

- **GPUI** gives us a native GPU-rendered app shell — the sidebar, title bar, panels, and dialogs are Rust UI rendered via Metal (macOS) or Vulkan (Windows). No HTML/CSS overhead for app chrome. Same framework that powers Zed.
- **wry** provides the system webview (WebKit on macOS, WebView2 on Windows) for rendering the storyboard client. No Chromium bundled. wry is what Tauri uses internally — we use it directly for more control over webview positioning and lifecycle.
- **libghostty-vt** gives us Ghostty-quality terminal emulation. The terminal panel is a native GPUI element, not an xterm.js widget in a webview. This is critical for the agent virtualization feature — we need full PTY control, not a JS approximation.
- **gpui-ghostty** is the reference implementation for wiring libghostty-vt into a GPUI app. We use it as a starting point / dependency for our terminal panel.
- The storyboard frontend (React + Vite) loads in the wry webview — zero porting work for existing storyboard features.

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

### PTY Architecture (Ghostty-based)

```
┌──────────────────────────────────────────────────────┐
│               GPUI Window                             │
│                                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │  wry Webview (storyboard client)                  ││
│  └──────────────────────────────────────────────────┘│
│                                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │  Terminal Panel (native GPUI, GPU-rendered)        ││
│  │                                                    ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          ││
│  │  │ Tab: zsh │ │Tab:claude│ │Tab:copilot│  [+]     ││
│  │  ├──────────┴─┴──────────┴─┴──────────┤          ││
│  │  │                                     │          ││
│  │  │  libghostty-vt (VT emulation)       │          ││
│  │  │  ↕ PTY I/O (tokio async)            │          ││
│  │  │  GPUI rendering (Metal/Vulkan)      │          ││
│  │  │                                     │          ││
│  │  │  Each tab = TerminalSession:        │          ││
│  │  │  • ghostty Surface (VT state)       │          ││
│  │  │  • OS PTY (master/slave pair)       │          ││
│  │  │  • async reader (tokio)             │          ││
│  │  │  • input handler (keystrokes)       │          ││
│  │  │  • scrollback ring buffer           │          ││
│  │  └────────────────────────────────────┘          ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

### Terminal Implementation: gpui-ghostty

Instead of xterm.js in a webview, the terminal panel is a **native GPUI element** using the `gpui-ghostty` architecture:

```
gpui_ghostty_terminal   # GPUI view wrapping libghostty-vt (reference: Xuanwo/gpui-ghostty)
libghostty-vt           # Ghostty's VT core: escape sequence parsing, screen state, scrollback
gpui                    # GPU-rendered UI framework (Metal on macOS, Vulkan on Windows)
tokio                   # Async runtime for PTY I/O multiplexing
```

Each terminal session is a `TerminalSession` struct:
- **ghostty Surface** — the VT emulation state machine from libghostty-vt. Handles all escape sequences, screen buffer, cursor, colors, Unicode, 24-bit color, ligatures.
- **OS PTY** — platform-native pseudo-terminal (posix_openpt on macOS, ConPTY on Windows). Allocated via `portable-pty` or raw libc/Win32 calls.
- **Async I/O** — tokio tasks read from PTY master fd and feed bytes into the ghostty Surface. The Surface emits render events that GPUI picks up for GPU rendering.
- **Input handling** — GPUI captures keyboard/mouse events in the terminal view and translates them to PTY writes (raw bytes, control sequences, bracketed paste).
- **Scrollback** — ghostty's built-in scrollback ring buffer, configurable size.

**Why this is better than xterm.js**: Native GPU rendering means the terminal is as fast as Ghostty itself — smooth scrolling, proper ligature rendering, instant response. No IPC overhead between webview and backend for every keystroke. The terminal is a Rust-native element that the app fully controls — critical for agent session automation.

### Agent Mode: Structured I/O

For AI agent sessions (Copilot, Claude Code), the app adds a **structured layer** on top of the PTY + ghostty Surface:

1. **Prompt submission** — The app writes text + Enter directly to the PTY master fd. From the agent's perspective, a human typed it.
2. **Output parsing** — The ghostty Surface provides full terminal state (not just raw bytes). The app can:
   - Read the screen contents as structured text (rows × columns)
   - Detect cursor position (is the agent waiting for input?)
   - Monitor for patterns (agent thinking indicator, tool call markers, completion signals)
   - Extract the agent's response text from the screen buffer
3. **Chat-like UI** — A GPUI panel alongside the terminal that shows:
   - User prompts (sent by the app)
   - Agent responses (extracted from terminal state)
   - Tool calls and results (parsed from screen content)
   - This is a GPUI native view — not HTML. Fast, themeable, integrated.
4. **Keyboard shortcuts** — The app can send any control sequence to the PTY: Ctrl+C (cancel), Ctrl+D (exit), Tab (completion), arrow keys, escape sequences for TUI navigation.
5. **Screen scraping** — Since the ghostty Surface holds the full terminal state, the app can "read" what the agent has written without parsing raw ANSI bytes. This is far more reliable than regex-based output parsing.

### Agent Session Lifecycle

```
User clicks "Start Claude Code session"
  → App allocates PTY pair (master + slave)
  → App spawns: `claude --project /path/to/storyboard-client` on slave
  → ghostty Surface created, connected to PTY master
  → GPUI terminal view renders the Surface (GPU-accelerated)
  → Output streams to both:
      a) Native terminal panel (ghostty + GPUI rendering)
      b) Agent chat panel (GPUI view, reads from Surface state)
  → User types in chat panel → app writes to PTY master fd
  → User can also type directly in terminal panel → same PTY
  → App can inject prompts programmatically:
      "Create a new prototype called Dashboard"
      → writes bytes to PTY master, enters appear in terminal
  → Agent runs, terminal updates in real-time
  → App polls Surface state to detect agent idle/response
  → Chat panel shows structured view of the conversation
```

### Multi-Session Management

The app supports multiple concurrent PTY sessions:
- **Tabs** in the terminal panel (native GPUI tabs, not HTML)
- Each tab = one `TerminalSession` with its own PTY + ghostty Surface
- Tab types: raw shell, Claude Code, Copilot CLI, custom command
- Sessions persist across webview navigations (PTY + Surface live in Rust)
- Sessions survive app window close/reopen (configurable)
- Split view: horizontal/vertical splits within the terminal panel (like Ghostty's splits)
- Session naming, pinning, and auto-restore on project reopen

---

## 6. App UI Layout (GPUI-native chrome + wry webview)

```
┌──────────────────────────────────────────────────────┐
│  GPUI Title Bar                                      │
│  [Project Name] ▾  │  Branch: feature/dashboard ▾   │
├────────┬─────────────────────────────────────────────┤
│ GPUI   │                                             │
│ Sidebar│    wry Webview (overlay)                    │
│        │    Storyboard client running in Vite         │
│ • Home │                                             │
│ • Proto│  ┌─────────────────────────────────────┐    │
│ • Canvas│  │  Your actual storyboard prototype   │    │
│ • Branch│  │  running exactly as it does today   │    │
│        │  │  in the browser                      │    │
│        │  └─────────────────────────────────────┘    │
│        │                                             │
│        │  Storyboard toolbar (existing, in webview)  │
├────────┴─────────────────────────────────────────────┤
│  GPUI Terminal Panel (native GPU-rendered)      [▲][×]│
│  ┌─────────┬──────────┬──────────┐                   │
│  │ Terminal │ Claude   │ Copilot  │ [+]    GPUI tabs  │
│  ├─────────┴──────────┴──────────┤                   │
│  │  ghostty VT rendering (GPUI)   │                   │
│  │                                │                   │
│  │ $ claude                       │                   │
│  │ > What would you like to do?   │                   │
│  │                                │                   │
│  │ User: Create a dashboard proto │                   │
│  │ Claude: I'll create that...    │                   │
│  └────────────────────────────────┘                   │
└──────────────────────────────────────────────────────┘
```

**Rendering surfaces**:
- Title bar, sidebar, terminal tabs, panel chrome → **GPUI** (native GPU, Rust)
- Terminal content → **libghostty-vt + GPUI** (native GPU, Rust)
- Storyboard client → **wry webview** (system WebKit/WebView2, HTML/JS)
- Storyboard toolbar/workshop/canvas → inside the webview, unchanged

---

## 7. New Repository: `storyboard-app`

This should be a **separate repository** from the storyboard core monorepo.

```
storyboard-app/
  src/                        # Rust source (GPUI app)
    main.rs                   # App entry: GPUI Application::run()
    app.rs                    # Root GPUI view (layout: sidebar + webview + terminal)
    sidebar/
      mod.rs                  # Sidebar GPUI view
      project_list.rs         # Recent projects list
      branch_picker.rs        # Git branch management
      prototype_list.rs       # Prototype/canvas navigation
    webview/
      mod.rs                  # wry webview management
      bridge.rs               # JS ↔ Rust communication channel
      routing.rs              # URL routing to correct dev server port
    terminal/
      mod.rs                  # Terminal panel (uses gpui-ghostty)
      session.rs              # TerminalSession: PTY + ghostty Surface
      tabs.rs                 # Tab management GPUI view
      agent.rs                # Agent session helpers (prompt inject, state detect)
    git/
      mod.rs                  # Git engine (gitoxide)
      autosync.rs             # Autosync scheduler (port from Node)
      watcher.rs              # File watcher (notify crate)
      conflict.rs             # Conflict resolution UI/logic
    sidecar/
      mod.rs                  # Node sidecar lifecycle management
      dev_server.rs           # Vite dev server spawn/monitor
      npm.rs                  # npm install / update helpers
    project/
      mod.rs                  # Project registry and state
      launcher.rs             # Project launcher / home screen
      settings.rs             # App and project settings

  assets/                     # Icons, fonts, images
    icons/
    fonts/

  Cargo.toml
  build.rs                    # Build script (compile ghostty VT, bundle Node)
  README.md
```

---

## 8. Rust Crate Dependencies

```toml
[dependencies]
# UI Framework
gpui = "0.2"                           # GPU-accelerated UI (from Zed)

# Webview
wry = "0.51"                           # System webview (WebKit/WebView2)
tao = "0.33"                           # Window management (wry's windowing layer)

# Terminal
gpui-ghostty-terminal = { git = "https://github.com/Xuanwo/gpui-ghostty" }
# ↑ Provides: TerminalConfig, TerminalSession, GPUI views for terminal
# Uses libghostty-vt internally for VT emulation
portable-pty = "0.8"                   # Cross-platform PTY allocation (fallback)

# Git
gix = "0.68"                           # gitoxide — pure Rust git
# git2 = "0.19"                        # fallback: libgit2 bindings

# Async
tokio = { version = "1", features = ["full"] }

# File watching
notify = "7"                           # Cross-platform file watcher

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Misc
dirs = "6"                             # Platform-standard directories (~/.storyboard-app/)

[build-dependencies]
# libghostty-vt requires Zig to build from source
# Build script handles Zig toolchain detection/download
```

### Build Requirements

The app requires a **Zig toolchain** at build time (for compiling Ghostty's C core). The `build.rs` script:
1. Detects or downloads Zig (pinned version matching gpui-ghostty's requirement)
2. Builds libghostty-vt via Zig
3. Links the resulting static library into the Rust binary

This is the same build process as gpui-ghostty itself — see their README for the exact steps.

---

## 9. Implementation Phases

### Phase 1: GPUI Shell + Webview (4-6 weeks)
- [ ] Initialize Rust project with GPUI dependency
- [ ] Basic GPUI window with title bar and resizable layout panels
- [ ] Embed wry webview in the main content area (overlay positioning)
- [ ] Node sidecar management: bundle Node, spawn `storyboard dev`, capture output
- [ ] Project open/close: detect `storyboard.config.json`, run npm install, start dev server
- [ ] Point wry webview at Vite dev server URL
- [ ] JS ↔ Rust bridge for communication between webview and app
- [ ] Project launcher home screen (GPUI view: recent projects, open folder)

### Phase 2: Git Engine + Sidebar (3-4 weeks)
- [ ] GPUI sidebar with project navigation (prototypes, canvases, branches)
- [ ] Rust git layer with gitoxide: status, stage, commit, push, pull
- [ ] Port autosync logic from Node to Rust (preserving scope-aware behavior)
- [ ] File watcher (notify crate) → debounced autosync trigger
- [ ] Branch picker in sidebar: list branches, create branch (= create worktree via sidecar)
- [ ] Switch branch = switch webview to different dev server port
- [ ] Conflict resolution UI (GPUI dialog: pull/rebase, force push, open terminal)

### Phase 3: Native Terminal (3-4 weeks)
- [ ] Integrate gpui-ghostty: terminal view in bottom panel
- [ ] Build libghostty-vt via Zig in build.rs
- [ ] PTY allocation (portable-pty) + async I/O (tokio)
- [ ] Terminal panel with GPUI tabs (create, close, rename sessions)
- [ ] stdin/stdout relay: GPUI keyboard events → PTY writes → ghostty Surface → GPUI render
- [ ] Session persistence across webview navigations
- [ ] Multi-session support (multiple tabs, split views)
- [ ] Terminal theming integration with app theme

### Phase 4: Agent Integration (3-4 weeks)
- [ ] Claude Code session type: spawn `claude` in PTY, detect prompt/response states
- [ ] Copilot session type: spawn `gh copilot` in PTY
- [ ] Screen scraping via ghostty Surface state (structured text extraction)
- [ ] Agent chat panel (GPUI view alongside terminal) showing structured conversation
- [ ] Programmatic prompt submission (GPUI chat input → PTY stdin)
- [ ] Output detection state machine (agent idle/thinking/responding)
- [ ] Keyboard shortcut relay (Ctrl+C, Tab, arrows, escape sequences)

### Phase 5: Polish & Distribution (2-3 weeks)
- [ ] macOS code signing + notarization (Apple Developer ID)
- [ ] Windows code signing
- [ ] DMG installer (macOS) and NSIS/MSI installer (Windows)
- [ ] Auto-updater (custom or Sparkle on macOS, WinSparkle on Windows)
- [ ] CI/CD: GitHub Actions for cross-platform builds
- [ ] Onboarding flow for first-time users
- [ ] Settings panel (GPUI): theme, font, keybindings, default agent
- [ ] Bundled Node.js runtime packaging and versioning

---

## 10. Key Design Decisions

### Decision 1: GPUI + wry, not Tauri alone

Tauri uses wry internally, but wraps it in a webview-first paradigm where the entire UI is HTML/CSS. By using GPUI + wry directly:
- App chrome (sidebar, title bar, terminal panel) is native GPU-rendered Rust — fast, no HTML overhead
- The terminal panel uses libghostty-vt + GPUI rendering — same quality as the Ghostty terminal app
- The wry webview is reserved for what it's best at: rendering the storyboard client (React/Vite)
- We get Zed-level UI performance for the app shell and terminal
- Trade-off: more integration work upfront, less mature ecosystem than Tauri's plugin system

### Decision 2: Webview content = the storyboard client, not a reimplementation

The app does NOT reimplement the storyboard UI. It loads the actual Vite dev server output in the wry webview. This means:
- Zero maintenance burden for keeping app UI in sync with storyboard features
- Every storyboard feature (canvas, workshop, viewfinder, toolbar) works immediately
- The app chrome (sidebar, terminal panel, title bar) wraps the webview — it's not a replacement

### Decision 3: Node sidecar, not full Rust rewrite

The existing Node toolchain (Vite, the data plugin, the server plugin, autosync, workshop) is ~15k+ lines of working, tested code. Rewriting it in Rust gains nothing — Vite must be Node, the plugins must be JS. The sidecar approach means:
- Existing storyboard updates just work (update the npm packages in the sidecar)
- The Rust layer only handles things Rust is genuinely better at: PTY, git, OS integration, native UI
- Contributors can work on Node code without knowing Rust and vice versa

### Decision 4: Ghostty VT for terminal, not xterm.js

The reference library `gpui-ghostty` demonstrates that libghostty-vt can be embedded in a GPUI app for native terminal rendering. This is fundamentally better than xterm.js in a webview:
- GPU-accelerated rendering (Metal/Vulkan) — smooth scrolling, proper ligatures, instant response
- No IPC overhead for every keystroke (keyboard → GPUI → PTY, all in Rust process)
- Full terminal state access via ghostty Surface (screen scraping for agent integration)
- Same emulation quality as the standalone Ghostty terminal
- Trade-off: requires Zig toolchain at build time for libghostty-vt compilation

### Decision 5: gitoxide for git, not shelling out

The current autosync shells out to `git` via `execFileSync`. This works but has downsides:
- Requires git to be installed
- Process spawn overhead on every status check (every 30 seconds × N worktrees)
- Error handling is string parsing
- Index.lock contention between concurrent operations

gitoxide (pure Rust git) eliminates all of these. Fallback to `git2-rs` or `Command::new("git")` for operations gitoxide doesn't support yet.

### Decision 6: Eliminate Caddy for desktop users

The Caddy reverse proxy exists to give worktrees clean URLs. Inside the app, routing is handled by the app itself — it knows which port each branch's dev server is on and can route the webview accordingly. Caddy remains available for CLI-only users.

### Decision 7: PTY-based agent integration, not API-based

AI agents (Claude Code, Copilot) are CLI tools that run in a terminal. Rather than integrating their APIs directly (which would require API keys, custom protocols, and constant maintenance as APIs change), the app runs them in a real PTY with a real ghostty Surface. This means:
- Any CLI agent works — not just Claude and Copilot
- The agent's own auth flow (browser OAuth, API key prompt) works naturally
- No API key management in the app
- Users see the real terminal output (trust, transparency)
- The ghostty Surface provides structured terminal state for the chat panel — far more reliable than regex-based output parsing
- The structured chat view is a convenience layer on top, not a replacement

---

## 11. Risk Assessment

| Risk | Mitigation |
|---|---|
| GPUI is newer, less documented than Tauri | Zed uses it in production daily; gpui-ghostty proves terminal integration works. Fall back to Tauri if GPUI proves too immature for our needs. |
| wry webview overlay positioning in GPUI | Zed already does this for extension webviews. Reference their implementation. Worst case: the webview fills a platform-native child window. |
| libghostty-vt requires Zig toolchain at build time | Pin Zig version, automate download in build.rs. CI caches the Zig binary. Same approach as gpui-ghostty. |
| gitoxide doesn't support all needed operations | Fallback chain: gitoxide → git2-rs → shell git |
| Node sidecar packaging is complex | Bundle standalone Node via Node's Single Executable Application (SEA) feature, or embed the full Node binary (~40 MB, acceptable for desktop). |
| Agent output parsing via ghostty Surface is best-effort | Keep raw terminal as primary view; structured chat panel is additive, not required. Users can always interact directly in the terminal. |
| Windows PTY (ConPTY) behavior differs from macOS (posix_openpt) | `portable-pty` and ghostty both abstract this; test extensively on Windows. GPUI supports Windows via Vulkan. |
| Bundle size with Node runtime + Ghostty libs | Target ~60-80 MB total (Node ~40 MB + app binary ~15 MB + libs). Acceptable for desktop app — VS Code is ~350 MB. |
| GPUI Windows support maturity | GPUI supports Windows but macOS is more mature. Ship macOS first, Windows follows. |

---

## 12. What Changes in Storyboard Core

Minimal changes needed in the existing storyboard packages:

1. **`storyboard.config.json`** — add optional `app` section for desktop-specific settings (window size, default agent, etc.)
2. **Dev server** — add a `--headless` flag to `storyboard dev` that suppresses interactive prompts (sidecar runs non-interactively)
3. **Autosync server** — add an HTTP endpoint to report status that the Rust layer can poll (or the Rust autosync replaces it entirely)
4. **Proxy** — make proxy optional; skip Caddy setup when `STORYBOARD_APP=1` env var is set

Everything else stays the same. Client repos don't need to change at all.
