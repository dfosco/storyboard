---
name: migrate
description: Migrates a client storyboard project to the latest version. Handles breaking changes in config, routes, and features.
---

# Migrate

> Triggered by: "migrate", "upgrade storyboard", "run migration", "update to latest", "breaking changes", "what changed"

## What This Does

Walks through all breaking changes between storyboard versions and applies the necessary updates to the client project. Each migration step is idempotent — safe to run multiple times.

---

## Migrations

### From 4.2.x → 4.3.0

#### 1. Homepage route: `/viewfinder` → `/workspace`

The storyboard homepage URL changed from `/viewfinder` to `/workspace`. The old route still works as a redirect, but all config should be updated.

**Check and update:**

1. If the client has a custom `src/prototypes/viewfinder.jsx`, rename it to `src/prototypes/workspace.jsx`
2. Search `storyboard.config.json` for any `"/viewfinder"` strings and replace with `"/workspace"`
3. Search toolbar/command palette config overrides for `"viewfinder"` tool ID references and update to `"workspace"`
4. If the client has `customerMode.protoHomepage` configured, no change needed — that overrides the homepage entirely

**localStorage keys also changed** (migrated automatically at runtime):
- `sb-viewfinder-starred` → `sb-workspace-starred`
- `sb-viewfinder-recent` → `sb-workspace-recent`
- `sb-viewfinder-group-folders` → `sb-workspace-group-folders`

Users' starred items and recent history are migrated automatically on first load — no manual action needed.

#### 2. Canvas agents config (required for agentic features)

Canvas agent widgets (Copilot CLI, Claude Code, Codex, etc.) require a `canvas.agents` block in `storyboard.config.json`. Without it, the "Add Agent" menu won't appear on canvases.

**Check if `canvas.agents` exists in `storyboard.config.json`.** If missing, add it:

```json
{
  "canvas": {
    "agents": {
      "copilot": {
        "label": "Copilot CLI",
        "default": true,
        "icon": "primer/copilot",
        "startupCommand": "copilot --agent terminal-agent",
        "resumeCommand": "copilot --resume",
        "readinessSignal": "Environment loaded:",
        "resizable": true
      },
      "claude": {
        "label": "Claude Code",
        "icon": "claude",
        "startupCommand": "claude --agent terminal-agent --dangerously-skip-permissions",
        "resumeCommand": "claude --resume",
        "resizable": true,
        "readinessSignal": "bypass permissions"
      },
      "codex": {
        "label": "Codex CLI",
        "icon": "codex",
        "startupCommand": "codex --full-auto",
        "resumeCommand": "codex --resume",
        "configFiles": [".codex/config.toml"],
        "resizable": true
      }
    }
  }
}
```

**Agent config properties:**
| Property | Required | Description |
|----------|----------|-------------|
| `label` | yes | Display name in the Add Agent menu |
| `icon` | no | Icon name (e.g. `primer/copilot`, `claude`, `codex`) |
| `startupCommand` | yes | Command to start the agent CLI |
| `resumeCommand` | no | Command to resume an existing agent session |
| `postStartup` | no | Text sent after the agent starts (e.g. `/allow-all on`) |
| `readinessSignal` | no | String to wait for in output before marking agent ready |
| `configFiles` | no | Array of config file paths the agent needs |
| `resizable` | no | Whether the agent widget can be resized |
| `default` | no | If true, this agent is pre-selected in the menu |

#### 3. Hot pool config (recommended for agentic features)

For instant agent startup, configure hot pooling. This pre-warms agent sessions in the background.

**Check if `hotPool` exists in `storyboard.config.json`.** If missing and the client uses canvas agents, add:

```json
{
  "hotPool": {
    "enabled": true,
    "default_pool_size": 1,
    "default_max_pool_size": 3,
    "pools": {
      "terminal": { "pool_size": 1 },
      "copilot": { "pool_size": 1 },
      "claude": { "pool_size": 1 },
      "codex": { "pool_size": 1 },
      "prompt": { "pool_size": 1 }
    }
  }
}
```

Each pool key must match an agent ID from `canvas.agents` (plus `terminal` and `prompt` for built-in widget types).

#### 4. Prompt widget support (new in 4.3.0)

The prompt widget enables single-shot AI tasks on canvas. It uses a lighter agent model than terminal agents.

No config changes required — the prompt widget is built-in. However, the `prompt` pool in `hotPool.pools` improves startup time.

---

## Procedure

### Step 1: Detect current version

Read the client's `package.json` for the installed `@dfosco/storyboard-core` and `@dfosco/storyboard-react` versions.

### Step 2: Run applicable migrations

For each migration section above (ordered by version), check if the change has already been applied. If not, apply it. Ask the user before making changes to `storyboard.config.json`.

### Step 3: Verify

After all migrations, run `npm run build` to verify nothing is broken.

### Step 4: Summary

Print a summary of all changes made and any manual steps the user needs to take.
