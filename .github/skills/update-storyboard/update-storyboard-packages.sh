#!/usr/bin/env bash
set -euo pipefail

# Updates all @dfosco/storyboard-* packages to the latest version.
# Usage:
#   npm run update:storyboard            # update to latest
#   npm run update:storyboard -- 1.8.0   # update to a specific version

PACKAGES=(
  "@dfosco/storyboard-core"
  "@dfosco/storyboard-react"
  "@dfosco/storyboard-react-primer"
  "@dfosco/storyboard-react-reshaped"
)

VERSION="${1:-latest}"

if [ "$VERSION" = "latest" ]; then
  echo "Updating storyboard packages to latest..."
  SPECS=("${PACKAGES[@]/%/@latest}")
else
  echo "Updating storyboard packages to v${VERSION}..."
  SPECS=("${PACKAGES[@]/%/@${VERSION}}")
fi

npm install "${SPECS[@]}"

echo ""
echo "Done. Installed versions:"
for pkg in "${PACKAGES[@]}"; do
  pkg_dir="node_modules/${pkg}"
  installed=$(node -p "JSON.parse(require('fs').readFileSync('${pkg_dir}/package.json','utf8')).version" 2>/dev/null || echo "not found")
  echo "  ${pkg}@${installed}"
done
