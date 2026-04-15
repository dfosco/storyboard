/// Typed wrappers for Tauri IPC commands.
///
/// These match the Rust command signatures in src-tauri/src/commands/.

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

// ─── Types ───────────────────────────────────────────────────────

export interface ProjectInfo {
  path: string;
  name: string;
  git_remote: string | null;
  last_opened: string | null;
  has_deps: boolean;
  branch: string | null;
}

export interface PtySessionInfo {
  id: string;
  command: string;
  cwd: string;
  cols: number;
  rows: number;
}

export interface PtyCreateParams {
  command?: string;
  args?: string[];
  cwd?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
}

export interface SidecarInfo {
  id: string;
  project_path: string;
  port: number | null;
  status: "Starting" | "Running" | "Stopped" | { Error: string };
  branch: string | null;
}

export interface StartDevParams {
  project_path: string;
  branch?: string;
  port?: number;
}

// ─── PTY Commands ────────────────────────────────────────────────

export async function ptyCreate(params: PtyCreateParams): Promise<PtySessionInfo> {
  return invoke("pty_create", { params });
}

export async function ptyWrite(id: string, data: string): Promise<void> {
  return invoke("pty_write", { id, data });
}

export async function ptyResize(id: string, cols: number, rows: number): Promise<void> {
  return invoke("pty_resize", { id, cols, rows });
}

export async function ptyClose(id: string): Promise<void> {
  return invoke("pty_close", { id });
}

export async function ptyList(): Promise<PtySessionInfo[]> {
  return invoke("pty_list");
}

// ─── PTY Events ──────────────────────────────────────────────────

export interface PtyOutputEvent {
  id: string;
  /** Base64-encoded bytes */
  data: string;
}

export interface PtyExitEvent {
  id: string;
  code: number | null;
}

export function onPtyOutput(callback: (event: PtyOutputEvent) => void): Promise<UnlistenFn> {
  return listen<PtyOutputEvent>("pty-output", (e) => callback(e.payload));
}

export function onPtyExit(callback: (event: PtyExitEvent) => void): Promise<UnlistenFn> {
  return listen<PtyExitEvent>("pty-exit", (e) => callback(e.payload));
}

// ─── Sidecar Commands ────────────────────────────────────────────

export async function sidecarStartDev(params: StartDevParams): Promise<SidecarInfo> {
  return invoke("sidecar_start_dev", { params });
}

export async function sidecarStop(id: string): Promise<void> {
  return invoke("sidecar_stop", { id });
}

export async function sidecarStatus(): Promise<SidecarInfo[]> {
  return invoke("sidecar_status");
}

// ─── Project Commands ────────────────────────────────────────────

export async function projectOpen(path: string): Promise<ProjectInfo> {
  return invoke("project_open", { path });
}

export async function projectClose(path: string): Promise<void> {
  return invoke("project_close", { path });
}

export async function projectListRecent(): Promise<ProjectInfo[]> {
  return invoke("project_list_recent");
}

export async function projectDetect(path: string): Promise<ProjectInfo> {
  return invoke("project_detect", { path });
}

// ─── Utilities ───────────────────────────────────────────────────

/** Decode base64 string to Uint8Array. */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encode string to base64 for sending to PTY. */
export function stringToBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
