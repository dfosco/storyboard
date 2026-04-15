/// Terminal component using ghostty-web (WASM).
///
/// Renders a Ghostty terminal connected to a Rust PTY session via Tauri IPC.
/// The flow:
///   1. Component mounts → calls pty_create to allocate a PTY
///   2. Listens for pty-output events → writes bytes to ghostty-web Terminal
///   3. Terminal onData → encodes keystrokes → calls pty_write
///   4. Terminal resize → calls pty_resize

import { useEffect, useRef, useCallback, useState } from "react";
import { Terminal } from "ghostty-web";
import {
  ptyCreate,
  ptyWrite,
  ptyClose,
  ptyResize,
  onPtyOutput,
  onPtyExit,
  base64ToBytes,
  stringToBase64,
  type PtyCreateParams,
  type PtySessionInfo,
} from "../lib/tauri";
import styles from "./Terminal.module.css";

interface TerminalViewProps {
  /** Parameters for creating the PTY session */
  params?: PtyCreateParams;
  /** Called when the session exits */
  onExit?: (code: number | null) => void;
  /** Called when the session is created */
  onReady?: (session: PtySessionInfo) => void;
}

export default function TerminalView({ params, onExit, onReady }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const sessionRef = useRef<PtySessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize terminal and PTY session
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let unlistenOutput: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;

    async function init() {
      try {
        // Create ghostty-web terminal
        const terminal = new Terminal({
          cols: params?.cols ?? 80,
          rows: params?.rows ?? 24,
          cursorBlink: true,
          fontSize: 13,
          fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
          theme: {
            background: "#0d1117",
            foreground: "#e6edf3",
            cursor: "#e6edf3",
            selectionBackground: "#264f78",
          },
        });

        if (destroyed) {
          terminal.dispose();
          return;
        }

        terminal.open(container);
        terminalRef.current = terminal;

        // Create PTY session in Rust backend
        const session = await ptyCreate({
          cols: terminal.cols,
          rows: terminal.rows,
          ...params,
        });

        if (destroyed) {
          await ptyClose(session.id);
          terminal.dispose();
          return;
        }

        sessionRef.current = session;
        onReady?.(session);

        // Listen for PTY output → write to terminal
        const unlisten1 = await onPtyOutput((event) => {
          if (event.id === session.id && terminalRef.current) {
            const bytes = base64ToBytes(event.data);
            terminalRef.current.write(bytes);
          }
        });
        unlistenOutput = unlisten1;

        // Listen for PTY exit
        const unlisten2 = await onPtyExit((event) => {
          if (event.id === session.id) {
            onExit?.(event.code);
          }
        });
        unlistenExit = unlisten2;

        // Terminal input → write to PTY
        terminal.onData((data: string) => {
          if (sessionRef.current) {
            const encoded = stringToBase64(data);
            ptyWrite(sessionRef.current.id, encoded);
          }
        });

        // Terminal resize → resize PTY
        terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
          if (sessionRef.current) {
            ptyResize(sessionRef.current.id, cols, rows);
          }
        });
      } catch (err) {
        if (!destroyed) {
          setError(String(err));
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      unlistenOutput?.();
      unlistenExit?.();

      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }

      if (sessionRef.current) {
        ptyClose(sessionRef.current.id);
        sessionRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Handle container resize → fit terminal
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // ghostty-web should handle resize internally based on container size
      // If it doesn't, we'd calculate cols/rows from container dimensions here
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  if (error) {
    return (
      <div className={styles.error}>
        <p>Terminal error: {error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className={styles.container} />;
}
