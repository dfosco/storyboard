/// Sidebar — project navigation, branch picker, quick actions.

import type { ProjectInfo } from "../lib/tauri";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  project: ProjectInfo;
  onClose: () => void;
}

export default function Sidebar({ project, onClose }: SidebarProps) {
  return (
    <div className={`${styles.sidebar} no-select`}>
      {/* Project header */}
      <div className={styles.header}>
        <div className={styles.projectIcon}>◈</div>
        <div className={styles.projectInfo}>
          <div className={styles.projectName}>{project.name}</div>
          <div className={styles.projectPath} title={project.path}>
            {shortenPath(project.path)}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Navigation</div>
          <button className={styles.navItem}>
            <span className={styles.navIcon}>⌂</span>
            Viewfinder
          </button>
          <button className={styles.navItem}>
            <span className={styles.navIcon}>▦</span>
            Canvases
          </button>
          <button className={styles.navItem}>
            <span className={styles.navIcon}>◻</span>
            Prototypes
          </button>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Git</div>
          <button className={styles.navItem}>
            <span className={styles.navIcon}>⎇</span>
            {project.branch ?? "main"}
          </button>
          <div className={styles.syncStatus}>
            <span className={styles.syncDot} />
            Autosync active
          </div>
        </div>
      </nav>

      {/* Bottom actions */}
      <div className={styles.footer}>
        <button className={styles.footerAction} onClick={onClose}>
          ← Close project
        </button>
      </div>
    </div>
  );
}

function shortenPath(path: string): string {
  const home = "~";
  const parts = path.replace(/^\/Users\/[^/]+/, home).split("/");
  if (parts.length <= 3) return parts.join("/");
  return `${parts[0]}/…/${parts[parts.length - 1]}`;
}
