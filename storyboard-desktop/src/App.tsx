import { useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import TerminalPanel from "./components/TerminalPanel";
import ProjectView from "./components/ProjectView";
import Launcher from "./components/Launcher";
import type { ProjectInfo } from "./lib/tauri";
import styles from "./App.module.css";

export default function App() {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const handleProjectOpen = useCallback((info: ProjectInfo) => {
    setProject(info);
  }, []);

  const handleProjectClose = useCallback(() => {
    setProject(null);
  }, []);

  // No project open → show launcher
  if (!project) {
    return <Launcher onProjectOpen={handleProjectOpen} />;
  }

  return (
    <div className={styles.app}>
      {/* Sidebar */}
      {sidebarVisible && (
        <aside className={styles.sidebar}>
          <Sidebar
            project={project}
            onClose={handleProjectClose}
          />
        </aside>
      )}

      {/* Main content area */}
      <div className={styles.main}>
        {/* Title bar */}
        <header className={`${styles.titleBar} no-select`}>
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarVisible(!sidebarVisible)}
            title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          >
            ☰
          </button>
          <span className={styles.projectName}>{project.name}</span>
          {project.branch && (
            <span className={styles.branch}>
              <span className={styles.branchIcon}>⎇</span>
              {project.branch}
            </span>
          )}
          <div className={styles.spacer} />
          <button
            className={styles.terminalToggle}
            onClick={() => setTerminalVisible(!terminalVisible)}
            title={terminalVisible ? "Hide terminal" : "Show terminal"}
          >
            {terminalVisible ? "▼" : "▲"} Terminal
          </button>
        </header>

        {/* Storyboard client webview */}
        <div className={styles.content}>
          <ProjectView project={project} />
        </div>

        {/* Terminal panel */}
        {terminalVisible && (
          <div className={styles.terminal}>
            <TerminalPanel project={project} />
          </div>
        )}
      </div>
    </div>
  );
}
