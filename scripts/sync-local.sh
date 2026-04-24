#!/usr/bin/env bash
# sync-local.sh — Build + pack + install into a consumer repo's node_modules.
#
# Emulates a full npm publish → install cycle using `npm pack`. Each package's
# prepublishOnly scripts run, tarballs are created, and extracted into the
# consumer's node_modules — structurally identical to a real npm install.
#
# Usage:
#   ./scripts/sync-local.sh [options] [target-path]
#
# Options:
#   --no-build     Skip the root build step (use if you already built)
#   --help, -h     Show this help message
#
# Target resolution (first match wins):
#   1. CLI argument        ./scripts/sync-local.sh ../consumer-repo
#   2. .sync-target file   echo "../consumer-repo" > .sync-target
#   3. SYNC_TARGET env     SYNC_TARGET=../consumer-repo npm run sync

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DO_BUILD=true
TARGET=""

# --- Parse args ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-build) DO_BUILD=false; shift ;;
    --help|-h)
      sed -n '2,/^[^#]/s/^# \{0,1\}//p' "$0"
      exit 0
      ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *) TARGET="$1"; shift ;;
  esac
done

# --- Resolve target ---
if [[ -z "$TARGET" ]]; then
  if [[ -f "$ROOT/.sync-target" ]]; then
    TARGET="$(head -1 "$ROOT/.sync-target" | xargs)"
  elif [[ -n "${SYNC_TARGET:-}" ]]; then
    TARGET="$SYNC_TARGET"
  fi
fi

if [[ -z "$TARGET" ]]; then
  echo "Error: No sync target specified." >&2
  echo "" >&2
  echo "Provide a target via:" >&2
  echo "  1. CLI arg:       ./scripts/sync-local.sh ../consumer-repo" >&2
  echo "  2. .sync-target:  echo '../consumer-repo' > .sync-target" >&2
  echo "  3. Env var:       SYNC_TARGET=../consumer-repo npm run sync" >&2
  exit 1
fi

# Resolve to absolute path relative to ROOT
if [[ "$TARGET" != /* ]]; then
  TARGET="$(cd "$ROOT" && cd "$TARGET" && pwd)"
fi

if [[ ! -d "$TARGET/node_modules" ]]; then
  echo "Error: $TARGET/node_modules does not exist." >&2
  echo "Run npm install in the consumer first." >&2
  exit 1
fi

# --- Workspace packages (auto-discovered) ---
discover_packages() {
  node -e "
    const fs = require('fs');
    const path = require('path');
    const dirs = fs.readdirSync('$ROOT/packages', { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const dir of dirs) {
      const pkgPath = path.join('$ROOT/packages', dir, 'package.json');
      if (!fs.existsSync(pkgPath)) continue;
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.private) continue;
      if (!pkg.name) continue;
      console.log('packages/' + dir + ':' + pkg.name);
    }
  "
}

PACKAGES=()
while IFS= read -r line; do
  PACKAGES+=("$line")
done < <(discover_packages)

if [[ ${#PACKAGES[@]} -eq 0 ]]; then
  echo "Error: No publishable packages found in packages/." >&2
  exit 1
fi

echo "Packages to sync:"
for entry in "${PACKAGES[@]}"; do
  echo "  ${entry##*:}"
done
echo ""

# --- Step 1: Build (root) ---
if [[ "$DO_BUILD" == true ]]; then
  echo "▸ Building..."
  (cd "$ROOT" && npm run build)
  echo ""
fi

# --- Step 2: Pack + extract each package ---
TMPDIR_SYNC="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_SYNC"' EXIT

for entry in "${PACKAGES[@]}"; do
  pkg_dir="${entry%%:*}"
  pkg_name="${entry##*:}"
  dest="$TARGET/node_modules/$pkg_name"

  if [[ ! -d "$dest" ]]; then
    echo "  skip $pkg_name (not in consumer's node_modules)"
    continue
  fi

  echo "▸ Packing $pkg_name..."
  tarball=$(cd "$ROOT/$pkg_dir" && npm pack --pack-destination "$TMPDIR_SYNC" 2>/dev/null | tail -1)
  tarball_path="$TMPDIR_SYNC/$tarball"

  if [[ ! -f "$tarball_path" ]]; then
    echo "  ✗ npm pack failed for $pkg_name" >&2
    continue
  fi

  # Clear dest (except node_modules inside it — those are the package's own deps)
  find "$dest" -maxdepth 1 -not -name node_modules -not -path "$dest" -exec rm -rf {} +

  # Extract tarball (npm pack creates package/ prefix inside tarball)
  tar xzf "$tarball_path" -C "$dest" --strip-components=1

  echo "  ✓ $pkg_name → $dest"
done

echo ""
echo "Sync complete $(date +%H:%M:%S)"
