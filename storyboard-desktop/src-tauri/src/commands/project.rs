/// Project management — open, close, and track storyboard projects.
///
/// A "project" is a directory containing `storyboard.config.json`.
/// The app maintains a registry of recently opened projects.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;

/// Information about a storyboard project.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectInfo {
    /// Absolute path to the project directory
    pub path: String,
    /// Project name (from storyboard.config.json or directory name)
    pub name: String,
    /// Git remote URL, if available
    pub git_remote: Option<String>,
    /// Last opened timestamp (ISO 8601)
    pub last_opened: Option<String>,
    /// Whether the project has node_modules installed
    pub has_deps: bool,
    /// Current git branch
    pub branch: Option<String>,
}

/// Configuration read from storyboard.config.json.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryboardConfig {
    #[serde(rename = "devDomain")]
    pub dev_domain: Option<String>,
    pub repository: Option<RepoConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoConfig {
    pub owner: Option<String>,
    pub name: Option<String>,
}

/// Registry of known projects, persisted to disk.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectRegistry {
    pub projects: Vec<ProjectInfo>,
}

impl ProjectRegistry {
    /// Load the project registry from the app data directory.
    pub fn load() -> Self {
        let path = registry_path();
        if path.exists() {
            if let Ok(data) = fs::read_to_string(&path) {
                if let Ok(registry) = serde_json::from_str(&data) {
                    return registry;
                }
            }
        }
        Self {
            projects: Vec::new(),
        }
    }

    /// Save the registry to disk.
    pub fn save(&self) {
        let path = registry_path();
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        if let Ok(data) = serde_json::to_string_pretty(self) {
            let _ = fs::write(path, data);
        }
    }

    /// Add or update a project in the registry.
    pub fn upsert(&mut self, info: ProjectInfo) {
        if let Some(existing) = self.projects.iter_mut().find(|p| p.path == info.path) {
            *existing = info;
        } else {
            self.projects.push(info);
        }
        self.save();
    }
}

fn registry_path() -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("storyboard-desktop").join("projects.json")
}

/// Detect if a directory is a valid storyboard project.
#[tauri::command]
pub async fn project_detect(path: String) -> Result<ProjectInfo, String> {
    let dir = Path::new(&path);

    if !dir.is_dir() {
        return Err(format!("Not a directory: {path}"));
    }

    let config_path = dir.join("storyboard.config.json");
    if !config_path.exists() {
        return Err(format!("No storyboard.config.json found in {path}"));
    }

    // Read storyboard.config.json
    let config_data = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {e}"))?;
    let config: StoryboardConfig = serde_json::from_str(&config_data)
        .map_err(|e| format!("Invalid storyboard.config.json: {e}"))?;

    // Determine project name
    let name = config
        .repository
        .as_ref()
        .and_then(|r| r.name.clone())
        .unwrap_or_else(|| {
            dir.file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unknown".to_string())
        });

    // Check for node_modules
    let has_deps = dir.join("node_modules").exists();

    // Try to get git remote
    let git_remote = get_git_remote(dir);

    // Try to get current branch
    let branch = get_git_branch(dir);

    Ok(ProjectInfo {
        path: dir.to_string_lossy().to_string(),
        name,
        git_remote,
        last_opened: None,
        has_deps,
        branch,
    })
}

/// Open a project — detect, register, and return info.
#[tauri::command]
pub async fn project_open(
    state: State<'_, AppState>,
    path: String,
) -> Result<ProjectInfo, String> {
    let mut info = project_detect(path).await?;
    info.last_opened = Some(chrono_now());

    let mut registry = state.project_registry.lock().await;
    registry.upsert(info.clone());

    Ok(info)
}

/// Close a project (mark as not active, stop sidecar if running).
#[tauri::command]
pub async fn project_close(
    _state: State<'_, AppState>,
    _path: String,
) -> Result<(), String> {
    // TODO: stop associated sidecar, clean up watchers
    Ok(())
}

/// List recently opened projects.
#[tauri::command]
pub async fn project_list_recent(
    state: State<'_, AppState>,
) -> Result<Vec<ProjectInfo>, String> {
    let registry = state.project_registry.lock().await;
    let mut projects = registry.projects.clone();

    // Sort by last_opened descending
    projects.sort_by(|a, b| b.last_opened.cmp(&a.last_opened));

    // Return at most 20 recent projects
    projects.truncate(20);

    Ok(projects)
}

/// Get the git remote URL for a directory.
fn get_git_remote(dir: &Path) -> Option<String> {
    std::process::Command::new("git")
        .args(["remote", "get-url", "origin"])
        .current_dir(dir)
        .output()
        .ok()
        .and_then(|output| {
            if output.status.success() {
                Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                None
            }
        })
}

/// Get the current git branch for a directory.
fn get_git_branch(dir: &Path) -> Option<String> {
    std::process::Command::new("git")
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .current_dir(dir)
        .output()
        .ok()
        .and_then(|output| {
            if output.status.success() {
                Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                None
            }
        })
}

/// Simple ISO 8601 timestamp.
fn chrono_now() -> String {
    // Using std time to avoid adding chrono dependency for now
    use std::time::SystemTime;
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}Z", now.as_secs())
}
