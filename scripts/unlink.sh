#!/usr/bin/env bash
# Unregister all workspace packages from the global npm link store.
# Run from storyboard-core root: ./scripts/unlink.sh
set -euo pipefail

PACKAGES=(
  "packages/core"
  "packages/react"
  "packages/react-primer"
  "packages/react-reshaped"
  "packages/tiny-canvas"
)

echo "Removing global npm links..."
for pkg in "${PACKAGES[@]}"; do
  name=$(node -p "require('./$pkg/package.json').name")
  (cd "$pkg" && npm unlink --quiet 2>/dev/null) || true
  echo "  ✔ $name"
done

echo ""
echo "Done. Run 'npm install' in the consumer repo to restore registry versions."
