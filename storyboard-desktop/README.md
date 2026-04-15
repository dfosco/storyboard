# Storyboard Desktop

> A native macOS/Windows app that runs any storyboard instance — think of each client repo as a "sketch file" the app can open.

Built with [Tauri v2](https://tauri.app) (Rust backend + system webview) and [ghostty-web](https://github.com/coder/ghostty-web) (Ghostty terminal in WASM).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│               Storyboard Desktop (Tauri v2)              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           System Webview (wry)                     │   │
│  │                                                    │   │
│  │  React App Shell                                   │   │
│  │  ┌────────┬──────────────────────────────────┐    │   │
│  │  │Sidebar │  Storyboard Client (Vite iframe)  │    │   │
│  │  │        │  Loads http://localhost:<port>/    │    │   │
│  │  │• Protos│  Existing storyboard UI unchanged │    │   │
│  │  │• Branch│                                    │    │   │
│  │  │• Git   │                                    │    │   │
│  │  ├────────┴──────────────────────────────────┤    │   │
│  │  │  Terminal Panel (ghostty-web WASM)          │    │   │
│  │  │  Claude Code / Copilot / shell sessions    │    │   │
│  │  └───────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Rust Backend (Tauri)                     │   │
│  │  • PTY management (portable-pty)                  │   │
│  │  • Git engine (gitoxide)                          │   │
│  │  • Node sidecar (storyboard dev server)           │   │
│  │  • File watcher (notify)                          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) v20+
- Platform build tools:
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools + WebView2

### Setup

```bash
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

## Key Features

- **Open any storyboard repo** as a project — auto-detects `storyboard.config.json`
- **Autosync git** — automatic commit + push, always on, scope-aware
- **Virtualized terminals** — ghostty-web WASM terminal with real PTY sessions
- **Agent sessions** — run Claude Code, Copilot, or any CLI agent with programmatic I/O
- **No Caddy needed** — app routes webview directly to dev server ports
