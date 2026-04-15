/// Launcher — home screen when no project is open.
///
/// Shows recent projects, open folder button, and clone from GitHub.

import { useState, useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { projectOpen, projectListRecent, type ProjectInfo } from "../lib/tauri";
import styles from "./Launcher.module.css";

interface LauncherProps {
  onProjectOpen: (info: ProjectInfo) => void;
}

export default function Launcher({ onProjectOpen }: LauncherProps) {
  const [recentProjects, setRecentProjects] = useState<ProjectInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load recent projects on mount
  useEffect(() => {
    projectListRecent()
      .then(setRecentProjects)
      .catch(() => {
        /* ignore — no recent projects */
      });
  }, []);

  const handleOpenFolder = useCallback(async () => {
    try {
      setError(null);
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Open Storyboard Project",
      });

      if (selected) {
        const path = typeof selected === "string" ? selected : selected;
        const info = await projectOpen(path);
        onProjectOpen(info);
      }
    } catch (err) {
      setError(String(err));
    }
  }, [onProjectOpen]);

  const handleOpenRecent = useCallback(
    async (path: string) => {
      try {
        setError(null);
        const info = await projectOpen(path);
        onProjectOpen(info);
      } catch (err) {
        setError(String(err));
      }
    },
    [onProjectOpen],
  );

  return (
    <div className={styles.launcher}>
      <div className={styles.content}>
        {/* Logo and title */}
        <div className={styles.hero}>
          <div className={styles.logo}>◈</div>
          <h1 className={styles.title}>Storyboard</h1>
          <p className={styles.subtitle}>Open a project to get started</p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.primaryAction} onClick={handleOpenFolder}>
            Open Folder
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {/* Recent projects */}
        {recentProjects.length > 0 && (
          <div className={styles.recent}>
            <h2 className={styles.recentTitle}>Recent Projects</h2>
            <ul className={styles.recentList}>
              {recentProjects.map((p) => (
                <li key={p.path}>
                  <button
                    className={styles.recentItem}
                    onClick={() => handleOpenRecent(p.path)}
                  >
                    <span className={styles.recentIcon}>◈</span>
                    <span className={styles.recentInfo}>
                      <span className={styles.recentName}>{p.name}</span>
                      <span className={styles.recentPath}>{p.path}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
