/// Storyboard Desktop — Tauri application library.
///
/// Manages:
/// - PTY sessions for terminal virtualization
/// - Node sidecar for running storyboard dev servers
/// - Project registry and lifecycle
/// - Git operations (future: gitoxide)

mod commands;

use std::sync::Arc;
use tokio::sync::Mutex;

use commands::pty::PtyManager;
use commands::sidecar::SidecarManager;
use commands::project::ProjectRegistry;

/// Shared application state accessible from all Tauri commands.
pub struct AppState {
    pub pty_manager: Arc<Mutex<PtyManager>>,
    pub sidecar_manager: Arc<Mutex<SidecarManager>>,
    pub project_registry: Arc<Mutex<ProjectRegistry>>,
}

pub fn run() {
    let state = AppState {
        pty_manager: Arc::new(Mutex::new(PtyManager::new())),
        sidecar_manager: Arc::new(Mutex::new(SidecarManager::new())),
        project_registry: Arc::new(Mutex::new(ProjectRegistry::load())),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            // PTY commands
            commands::pty::pty_create,
            commands::pty::pty_write,
            commands::pty::pty_resize,
            commands::pty::pty_close,
            commands::pty::pty_list,
            // Sidecar commands
            commands::sidecar::sidecar_start_dev,
            commands::sidecar::sidecar_stop,
            commands::sidecar::sidecar_status,
            // Project commands
            commands::project::project_open,
            commands::project::project_close,
            commands::project::project_list_recent,
            commands::project::project_detect,
        ])
        .run(tauri::generate_context!())
        .expect("error while running storyboard desktop");
}
