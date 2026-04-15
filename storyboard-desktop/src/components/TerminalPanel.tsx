/// Terminal panel with tab management.
///
/// Supports multiple terminal sessions (shell, Claude Code, Copilot, etc.)
/// Each tab is a separate PTY session rendered with ghostty-web.

import { useState, useCallback } from "react";
import TerminalView from "./TerminalView";
import type { ProjectInfo } from "../lib/tauri";
import type { PtySessionInfo, PtyCreateParams } from "../lib/tauri";
import styles from "./TerminalPanel.module.css";

interface Tab {
  id: string;
  label: string;
  params: PtyCreateParams;
  session?: PtySessionInfo;
}

interface TerminalPanelProps {
  project: ProjectInfo;
}

export default function TerminalPanel({ project }: TerminalPanelProps) {
  const [tabs, setTabs] = useState<Tab[]>(() => [
    {
      id: "default",
      label: "Terminal",
      params: { cwd: project.path },
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("default");

  const addTab = useCallback((label: string, params: PtyCreateParams) => {
    const id = crypto.randomUUID();
    setTabs((prev) => [...prev, { id, label, params }]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== tabId);
        if (next.length === 0) {
          // Always keep at least one tab
          return [
            {
              id: crypto.randomUUID(),
              label: "Terminal",
              params: { cwd: project.path },
            },
          ];
        }
        return next;
      });

      // If closing the active tab, switch to the last remaining
      setActiveTabId((current) => {
        if (current === tabId) {
          const remaining = tabs.filter((t) => t.id !== tabId);
          return remaining[remaining.length - 1]?.id ?? "";
        }
        return current;
      });
    },
    [tabs, project.path],
  );

  const handleReady = useCallback((tabId: string, session: PtySessionInfo) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, session } : t)),
    );
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className={styles.panel}>
      {/* Tab bar */}
      <div className={`${styles.tabBar} no-select`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${tab.id === activeTabId ? styles.tabActive : ""}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className={styles.tabLabel}>{tab.label}</span>
            <span
              className={styles.tabClose}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              ×
            </span>
          </button>
        ))}

        {/* New tab dropdown */}
        <div className={styles.newTabGroup}>
          <button
            className={styles.newTab}
            onClick={() => addTab("Terminal", { cwd: project.path })}
            title="New terminal"
          >
            +
          </button>
          <button
            className={styles.newTab}
            onClick={() =>
              addTab("Claude", {
                command: "claude",
                args: ["--project", project.path],
                cwd: project.path,
              })
            }
            title="New Claude Code session"
          >
            ◆
          </button>
        </div>
      </div>

      {/* Active terminal */}
      <div className={styles.terminalArea}>
        {activeTab && (
          <TerminalView
            key={activeTab.id}
            params={activeTab.params}
            onReady={(session) => handleReady(activeTab.id, session)}
            onExit={() => {
              /* Could auto-close or show "exited" state */
            }}
          />
        )}
      </div>
    </div>
  );
}
