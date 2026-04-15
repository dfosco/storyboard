/// usePty — React hook for managing a PTY session.
///
/// Wraps the Tauri IPC calls into a clean React interface.
/// Manages the lifecycle: create session on mount, clean up on unmount,
/// relay output events, and provide input functions.

import { useState, useEffect, useRef, useCallback } from "react";
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

interface UsePtyOptions {
  /** PTY creation parameters */
  params?: PtyCreateParams;
  /** Callback when output bytes are received */
  onOutput?: (data: Uint8Array) => void;
  /** Callback when the PTY process exits */
  onExit?: (code: number | null) => void;
  /** Whether to auto-create the session on mount (default: true) */
  autoCreate?: boolean;
}

interface UsePtyReturn {
  /** Current session info, null if not yet created */
  session: PtySessionInfo | null;
  /** Whether the session is being created */
  creating: boolean;
  /** Error message if creation or I/O failed */
  error: string | null;
  /** Send text input to the PTY */
  write: (text: string) => Promise<void>;
  /** Send raw bytes (base64-encoded) to the PTY */
  writeRaw: (base64: string) => Promise<void>;
  /** Resize the PTY */
  resize: (cols: number, rows: number) => Promise<void>;
  /** Close the PTY session */
  close: () => Promise<void>;
  /** Create a new session (if autoCreate was false or after close) */
  create: (params?: PtyCreateParams) => Promise<void>;
}

export default function usePty(options: UsePtyOptions = {}): UsePtyReturn {
  const { params, onOutput, onExit, autoCreate = true } = options;
  const [session, setSession] = useState<PtySessionInfo | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep refs to callbacks to avoid stale closures
  const onOutputRef = useRef(onOutput);
  const onExitRef = useRef(onExit);
  onOutputRef.current = onOutput;
  onExitRef.current = onExit;

  const sessionRef = useRef<PtySessionInfo | null>(null);

  const create = useCallback(async (overrideParams?: PtyCreateParams) => {
    try {
      setCreating(true);
      setError(null);

      const info = await ptyCreate(overrideParams ?? params ?? {});
      sessionRef.current = info;
      setSession(info);
    } catch (err) {
      setError(String(err));
    } finally {
      setCreating(false);
    }
  }, [params]);

  const write = useCallback(async (text: string) => {
    if (!sessionRef.current) return;
    const encoded = stringToBase64(text);
    await ptyWrite(sessionRef.current.id, encoded);
  }, []);

  const writeRaw = useCallback(async (base64: string) => {
    if (!sessionRef.current) return;
    await ptyWrite(sessionRef.current.id, base64);
  }, []);

  const resize = useCallback(async (cols: number, rows: number) => {
    if (!sessionRef.current) return;
    await ptyResize(sessionRef.current.id, cols, rows);
  }, []);

  const close = useCallback(async () => {
    if (!sessionRef.current) return;
    await ptyClose(sessionRef.current.id);
    sessionRef.current = null;
    setSession(null);
  }, []);

  // Auto-create on mount
  useEffect(() => {
    if (autoCreate) {
      create();
    }

    return () => {
      // Clean up session on unmount
      if (sessionRef.current) {
        ptyClose(sessionRef.current.id);
      }
    };
  }, [autoCreate, create]);

  // Listen for PTY events
  useEffect(() => {
    let unlistenOutput: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;

    async function setupListeners() {
      unlistenOutput = await onPtyOutput((event) => {
        if (sessionRef.current && event.id === sessionRef.current.id) {
          const bytes = base64ToBytes(event.data);
          onOutputRef.current?.(bytes);
        }
      });

      unlistenExit = await onPtyExit((event) => {
        if (sessionRef.current && event.id === sessionRef.current.id) {
          onExitRef.current?.(event.code);
        }
      });
    }

    setupListeners();

    return () => {
      unlistenOutput?.();
      unlistenExit?.();
    };
  }, []);

  return { session, creating, error, write, writeRaw, resize, close, create };
}
