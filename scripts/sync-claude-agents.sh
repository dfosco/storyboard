#!/usr/bin/env bash
# Sync .agents/agents/*.agent.md → .claude/agents/*.md
# Source of truth: .agents/agents/
# Build target:   .claude/agents/
#
# Only transforms the YAML frontmatter tool names:
#   read → Read, edit → Edit, shell → Bash, search → Grep + Glob
# Body content is copied verbatim.

set -euo pipefail

SRC_DIR=".agents/agents"
DST_DIR=".claude/agents"

mkdir -p "$DST_DIR"

for src in "$SRC_DIR"/*.agent.md; do
  [ -f "$src" ] || continue
  base=$(basename "$src" .agent.md)
  dst="$DST_DIR/$base.md"

  # Extract frontmatter (between first two ---) and body
  awk '
    BEGIN { fm=0; body=0 }
    /^---$/ && fm==0 { fm=1; next }
    /^---$/ && fm==1 { body=1; next }
    body { print > "/dev/fd/3" }
    !body { print }
  ' "$src" 3>/tmp/agent-body-$$.md > /tmp/agent-fm-$$.md

  # Transform tool names in frontmatter
  sed -e 's/^  - read$/  - Read/' \
      -e 's/^  - edit$/  - Edit/' \
      -e 's/^  - shell$/  - Bash/' \
      -e 's/^  - search$/  - Grep\n  - Glob/' \
      /tmp/agent-fm-$$.md > /tmp/agent-fm-out-$$.md

  # Reassemble with Claude frontmatter
  {
    echo "---"
    cat /tmp/agent-fm-out-$$.md
    echo "---"
    cat /tmp/agent-body-$$.md
  } > "$dst"

  rm -f /tmp/agent-fm-$$.md /tmp/agent-body-$$.md /tmp/agent-fm-out-$$.md
  echo "  $base: $src → $dst"
done

echo "Done — synced $(ls "$SRC_DIR"/*.agent.md 2>/dev/null | wc -l | tr -d ' ') agent(s)"
