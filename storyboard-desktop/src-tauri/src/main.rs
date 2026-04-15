// Tauri entry point — launches the desktop app.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    storyboard_desktop_lib::run();
}
