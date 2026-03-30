#!/usr/bin/env bash
# Register all workspace packages as global npm links.
# Run from storyboard-core root: ./scripts/link.sh
set -euo pipefail

PACKAGES=(
  "packages/core"
  "packages/react"
  "packages/react-primer"
  "packages/react-reshaped"
  "packages/tiny-canvas"
)

echo "Registering npm links for all packages..."
for pkg in "${PACKAGES[@]}"; do
  name=$(node -p "require('./$pkg/package.json').name")
  (cd "$pkg" && npm link --quiet)
  echo "  ✔ $name"
done

echo ""
echo "Done. Now run this in the consumer repo:"
echo "  npm link @dfosco/storyboard-core @dfosco/storyboard-react @dfosco/storyboard-react-primer @dfosco/storyboard-react-reshaped @dfosco/tiny-canvas"
