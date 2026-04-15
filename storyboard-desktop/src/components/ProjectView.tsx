/// ProjectView — renders the storyboard client in an iframe.
///
/// Points to the Vite dev server started by the sidecar.
/// In the future, this could use Tauri's webview API for a more native approach.

import { useState, useEffect } from "react";
import { sidecarStartDev, type ProjectInfo, type SidecarInfo } from "../lib/tauri";
import styles from "./ProjectView.module.css";

interface ProjectViewProps {
  project: ProjectInfo;
}

export default function ProjectView({ project }: ProjectViewProps) {
  const [sidecar, setSidecar] = useState<SidecarInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Start the dev server when the project opens
  useEffect(() => {
    let cancelled = false;

    async function startServer() {
      try {
        setLoading(true);
        setError(null);

        const info = await sidecarStartDev({
          project_path: project.path,
          branch: project.branch ?? undefined,
        });

        if (!cancelled) {
          setSidecar(info);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      }
    }

    startServer();

    return () => {
      cancelled = true;
      // TODO: stop the sidecar when the component unmounts
    };
  }, [project.path, project.branch]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Starting dev server…</p>
        <p className={styles.hint}>{project.path}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h3>Failed to start dev server</h3>
        <p>{error}</p>
        <p className={styles.hint}>
          Make sure the project has dependencies installed ({"`"}npm install{"`"}).
        </p>
      </div>
    );
  }

  if (!sidecar?.port) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Waiting for dev server port…</p>
      </div>
    );
  }

  const devUrl = `http://localhost:${sidecar.port}/`;

  return (
    <iframe
      src={devUrl}
      className={styles.iframe}
      title="Storyboard Client"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
    />
  );
}
