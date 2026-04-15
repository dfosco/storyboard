/// useProject — React hook for managing the current project state.
///
/// Wraps project detection, opening, and sidecar management.

import { useState, useCallback } from "react";
import {
  projectOpen,
  projectDetect,
  sidecarStartDev,
  sidecarStop,
  type ProjectInfo,
  type SidecarInfo,
} from "../lib/tauri";

interface UseProjectReturn {
  /** Current project info */
  project: ProjectInfo | null;
  /** Running dev server sidecar */
  sidecar: SidecarInfo | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Open a project by path */
  open: (path: string) => Promise<void>;
  /** Close the current project */
  close: () => Promise<void>;
  /** Dev server URL if available */
  devUrl: string | null;
}

export default function useProject(): UseProjectReturn {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [sidecar, setSidecar] = useState<SidecarInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(async (path: string) => {
    try {
      setLoading(true);
      setError(null);

      // Detect and register the project
      const info = await projectOpen(path);
      setProject(info);

      // Start the dev server
      const dev = await sidecarStartDev({
        project_path: info.path,
        branch: info.branch ?? undefined,
      });
      setSidecar(dev);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(async () => {
    if (sidecar) {
      await sidecarStop(sidecar.id);
    }
    setProject(null);
    setSidecar(null);
  }, [sidecar]);

  const devUrl = sidecar?.port ? `http://localhost:${sidecar.port}/` : null;

  return { project, sidecar, loading, error, open, close, devUrl };
}
