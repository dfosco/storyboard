/// Node sidecar management — spawns and monitors `storyboard dev` processes.
///
/// Each open project has a sidecar that runs the Vite dev server.
/// The app manages the sidecar lifecycle: start, stop, health check, port detection.

use std::collections::HashMap;
use std::process::Stdio;

use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};

use crate::AppState;

/// Status of a running sidecar.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarInfo {
    pub id: String,
    pub project_path: String,
    pub port: Option<u16>,
    pub status: SidecarStatus,
    pub branch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SidecarStatus {
    Starting,
    Running,
    Stopped,
    Error(String),
}

/// Internal sidecar state.
struct Sidecar {
    info: SidecarInfo,
    child: Child,
}

/// Manages all active sidecar processes.
pub struct SidecarManager {
    sidecars: HashMap<String, Sidecar>,
}

impl SidecarManager {
    pub fn new() -> Self {
        Self {
            sidecars: HashMap::new(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct StartDevParams {
    /// Path to the storyboard project directory
    pub project_path: String,
    /// Optional branch name (spawns dev for a worktree)
    pub branch: Option<String>,
    /// Override port
    pub port: Option<u16>,
}

/// Start a storyboard dev server for a project.
#[tauri::command]
pub async fn sidecar_start_dev(
    state: State<'_, AppState>,
    params: StartDevParams,
) -> Result<SidecarInfo, String> {
    let id = uuid::Uuid::new_v4().to_string();

    // Build the command: npx storyboard dev [branch]
    // Use --no-create to avoid interactive prompts in sidecar mode
    let mut cmd = Command::new("npx");
    cmd.arg("storyboard");
    cmd.arg("dev");

    if let Some(ref branch) = params.branch {
        cmd.arg(branch);
        cmd.arg("--no-create");
    }

    if let Some(port) = params.port {
        cmd.arg("--port");
        cmd.arg(port.to_string());
    }

    // Set the working directory to the project
    cmd.current_dir(&params.project_path);

    // Suppress interactive prompts
    cmd.env("CI", "1");
    cmd.env("STORYBOARD_APP", "1");

    // Capture stdout to detect the port
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());
    // Don't inherit stdin — sidecar runs non-interactively
    cmd.stdin(Stdio::null());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start dev server: {e}"))?;

    // Try to detect the port from initial stdout lines.
    // After detection (or timeout), spawn a background task to drain
    // stdout so the child process doesn't block on a full buffer.
    let mut detected_port: Option<u16> = params.port;

    let stdout = child.stdout.take();
    if let Some(stdout) = stdout {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();

        // Read a few lines to try to detect the port
        // Vite outputs something like: "Local: http://localhost:1234/"
        let mut line_count = 0;
        loop {
            // Use a timeout so we don't block forever waiting for output
            let line_result = tokio::time::timeout(
                std::time::Duration::from_secs(30),
                lines.next_line(),
            )
            .await;

            match line_result {
                Ok(Ok(Some(line))) => {
                    line_count += 1;
                    if let Some(port) = detect_port_from_output(&line) {
                        detected_port = Some(port);
                        break;
                    }
                    if line_count > 50 {
                        break;
                    }
                }
                _ => break, // Timeout, error, or EOF
            }
        }

        // Spawn a background task to continuously drain remaining stdout
        // so the child process doesn't block on a full pipe buffer.
        tokio::spawn(async move {
            while let Ok(Some(_)) = lines.next_line().await {
                // Discard — we only needed the port
            }
        });
    }

    // Also drain stderr in the background
    if let Some(stderr) = child.stderr.take() {
        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        tokio::spawn(async move {
            while let Ok(Some(_)) = lines.next_line().await {
                // Discard stderr output
            }
        });
    }

    let info = SidecarInfo {
        id: id.clone(),
        project_path: params.project_path.clone(),
        port: detected_port,
        status: if detected_port.is_some() {
            SidecarStatus::Running
        } else {
            SidecarStatus::Starting
        },
        branch: params.branch,
    };

    let sidecar = Sidecar {
        info: info.clone(),
        child,
    };

    let mut mgr = state.sidecar_manager.lock().await;
    mgr.sidecars.insert(id, sidecar);

    Ok(info)
}

/// Stop a running sidecar.
#[tauri::command]
pub async fn sidecar_stop(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let mut mgr = state.sidecar_manager.lock().await;

    if let Some(mut sidecar) = mgr.sidecars.remove(&id) {
        let _ = sidecar.child.kill().await;
    }

    Ok(())
}

/// Get status of all sidecars.
#[tauri::command]
pub async fn sidecar_status(
    state: State<'_, AppState>,
) -> Result<Vec<SidecarInfo>, String> {
    let mgr = state.sidecar_manager.lock().await;
    Ok(mgr.sidecars.values().map(|s| s.info.clone()).collect())
}

/// Try to extract a port number from a line of dev server output.
fn detect_port_from_output(line: &str) -> Option<u16> {
    // Match patterns like "localhost:1234" or "http://localhost:1234"
    let re_like = line.find("localhost:");
    if let Some(pos) = re_like {
        let after = &line[pos + "localhost:".len()..];
        let port_str: String = after.chars().take_while(|c| c.is_ascii_digit()).collect();
        if let Ok(port) = port_str.parse::<u16>() {
            return Some(port);
        }
    }
    None
}
