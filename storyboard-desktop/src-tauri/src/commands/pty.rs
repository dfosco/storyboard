/// PTY session management — the core of terminal virtualization.
///
/// Each terminal tab in the UI corresponds to a `PtySession` here.
/// The flow:
///   1. Frontend calls `pty_create` → Rust allocates PTY + spawns command
///   2. Rust reads PTY output in a background task → emits `pty-output` events
///   3. Frontend receives events → writes bytes to ghostty-web terminal
///   4. User types in terminal → frontend calls `pty_write` → Rust writes to PTY
///   5. Frontend calls `pty_resize` when terminal dimensions change

use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use std::thread;

use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

use crate::AppState;

/// Metadata about an active PTY session, returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PtySessionInfo {
    pub id: String,
    pub command: String,
    pub cwd: String,
    pub cols: u16,
    pub rows: u16,
}

/// Internal state for a single PTY session.
struct PtySession {
    info: PtySessionInfo,
    writer: Box<dyn Write + Send>,
    /// Handle to the child process (kept alive so the process doesn't get dropped)
    _child: Box<dyn portable_pty::Child + Send + Sync>,
    /// Signal to stop the reader thread
    alive: Arc<std::sync::atomic::AtomicBool>,
}

/// Manages all active PTY sessions.
pub struct PtyManager {
    sessions: HashMap<String, PtySession>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct PtyCreateParams {
    /// Command to run (e.g. "/bin/zsh", "claude", "gh copilot")
    pub command: Option<String>,
    /// Arguments to the command
    pub args: Option<Vec<String>>,
    /// Working directory
    pub cwd: Option<String>,
    /// Terminal columns
    pub cols: Option<u16>,
    /// Terminal rows
    pub rows: Option<u16>,
    /// Environment variables to set
    pub env: Option<HashMap<String, String>>,
}

/// Payload emitted to the frontend for PTY output.
#[derive(Clone, Serialize)]
struct PtyOutputEvent {
    id: String,
    /// Base64-encoded bytes (PTY output can contain arbitrary bytes)
    data: String,
}

/// Payload emitted when a PTY session exits.
#[derive(Clone, Serialize)]
struct PtyExitEvent {
    id: String,
    code: Option<u32>,
}

/// Create a new PTY session and start streaming output.
#[tauri::command]
pub async fn pty_create(
    app: AppHandle,
    state: State<'_, AppState>,
    params: PtyCreateParams,
) -> Result<PtySessionInfo, String> {
    let pty_system = NativePtySystem::default();

    let cols = params.cols.unwrap_or(80);
    let rows = params.rows.unwrap_or(24);

    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to open PTY: {e}"))?;

    // Determine default shell if no command specified
    let default_shell = if cfg!(windows) {
        "powershell.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
    };

    let command_str = params.command.as_deref().unwrap_or(&default_shell);
    let mut cmd = CommandBuilder::new(command_str);

    if let Some(args) = &params.args {
        for arg in args {
            cmd.arg(arg);
        }
    }

    if let Some(cwd) = &params.cwd {
        cmd.cwd(cwd);
    }

    // Set environment variables
    if let Some(env_vars) = &params.env {
        for (key, value) in env_vars {
            cmd.env(key, value);
        }
    }

    // Ensure TERM is set for proper terminal behavior
    cmd.env("TERM", "xterm-256color");

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn command: {e}"))?;

    // We no longer need the slave side
    drop(pair.slave);

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("Failed to clone PTY reader: {e}"))?;

    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("Failed to take PTY writer: {e}"))?;

    let session_id = uuid::Uuid::new_v4().to_string();
    let alive = Arc::new(std::sync::atomic::AtomicBool::new(true));

    let info = PtySessionInfo {
        id: session_id.clone(),
        command: command_str.to_string(),
        cwd: params.cwd.unwrap_or_else(|| ".".to_string()),
        cols,
        rows,
    };

    // Spawn a thread to read PTY output and emit events to the frontend.
    // Using a thread (not tokio task) because PTY reads are blocking I/O.
    let reader_id = session_id.clone();
    let reader_alive = alive.clone();
    let reader_app = app.clone();

    thread::spawn(move || {
        pty_reader_loop(reader, reader_id, reader_alive, reader_app);
    });

    let session = PtySession {
        info: info.clone(),
        writer,
        _child: child,
        alive,
    };

    let mut mgr = state.pty_manager.lock().await;
    mgr.sessions.insert(session_id, session);

    Ok(info)
}

/// Background loop: reads PTY output and emits events to the frontend.
fn pty_reader_loop(
    mut reader: Box<dyn Read + Send>,
    session_id: String,
    alive: Arc<std::sync::atomic::AtomicBool>,
    app: AppHandle,
) {
    use base64::Engine;
    let engine = base64::engine::general_purpose::STANDARD;

    let mut buf = [0u8; 4096];
    loop {
        if !alive.load(std::sync::atomic::Ordering::Relaxed) {
            break;
        }

        match reader.read(&mut buf) {
            Ok(0) => {
                // EOF — process exited
                let _ = app.emit(
                    "pty-exit",
                    PtyExitEvent {
                        id: session_id.clone(),
                        code: None,
                    },
                );
                break;
            }
            Ok(n) => {
                let data = engine.encode(&buf[..n]);
                let _ = app.emit(
                    "pty-output",
                    PtyOutputEvent {
                        id: session_id.clone(),
                        data,
                    },
                );
            }
            Err(e) => {
                // Broken pipe or similar — session ended
                eprintln!("PTY read error for {}: {e}", session_id);
                let _ = app.emit(
                    "pty-exit",
                    PtyExitEvent {
                        id: session_id.clone(),
                        code: None,
                    },
                );
                break;
            }
        }
    }

    alive.store(false, std::sync::atomic::Ordering::Relaxed);
}

/// Write data to a PTY session (user input from the terminal).
#[tauri::command]
pub async fn pty_write(
    state: State<'_, AppState>,
    id: String,
    data: String,
) -> Result<(), String> {
    use base64::Engine;
    let engine = base64::engine::general_purpose::STANDARD;

    let bytes = engine
        .decode(&data)
        .map_err(|e| format!("Invalid base64: {e}"))?;

    let mut mgr = state.pty_manager.lock().await;
    let session = mgr
        .sessions
        .get_mut(&id)
        .ok_or_else(|| format!("PTY session not found: {id}"))?;

    session
        .writer
        .write_all(&bytes)
        .map_err(|e| format!("Failed to write to PTY: {e}"))?;

    session
        .writer
        .flush()
        .map_err(|e| format!("Failed to flush PTY: {e}"))?;

    Ok(())
}

/// Resize a PTY session.
#[tauri::command]
pub async fn pty_resize(
    state: State<'_, AppState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let mut mgr = state.pty_manager.lock().await;
    let session = mgr
        .sessions
        .get_mut(&id)
        .ok_or_else(|| format!("PTY session not found: {id}"))?;

    session.info.cols = cols;
    session.info.rows = rows;

    // Note: portable-pty doesn't expose resize on the writer directly.
    // The master PTY handle would need to be kept for resize. For now,
    // we store the new size — the resize will be handled when we refine
    // the PTY lifecycle to keep the master handle.
    // TODO: implement actual PTY resize via master handle

    Ok(())
}

/// Close a PTY session.
#[tauri::command]
pub async fn pty_close(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let mut mgr = state.pty_manager.lock().await;

    if let Some(session) = mgr.sessions.remove(&id) {
        session
            .alive
            .store(false, std::sync::atomic::Ordering::Relaxed);
        // Writer and child are dropped, which closes the PTY
    }

    Ok(())
}

/// List all active PTY sessions.
#[tauri::command]
pub async fn pty_list(
    state: State<'_, AppState>,
) -> Result<Vec<PtySessionInfo>, String> {
    let mgr = state.pty_manager.lock().await;
    Ok(mgr.sessions.values().map(|s| s.info.clone()).collect())
}
