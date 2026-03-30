#!/usr/bin/env bash
set -euo pipefail

# Resume a failed release — tags, publishes, pushes, and creates GH release.
#
# Use this when `npm run release` failed partway through (e.g. npm auth
# expired, network error, publish failed for some packages). It skips
# lint/test/build/versioning and picks up from the current committed state.
#
# Usage:
#   npm run release:resume              # resume stable release
#   npm run release:resume:beta         # resume beta prerelease
#   npm run release:resume:alpha        # resume alpha prerelease
#
# Direct invocation:
#   ./scripts/release-resume.sh
#   ./scripts/release-resume.sh --beta
#   ./scripts/release-resume.sh --alpha

PRE_TAG="${PRERELEASE_TAG:-}"

for arg in "$@"; do
  case "$arg" in
    --beta)  PRE_TAG="beta"  ;;
    --alpha) PRE_TAG="alpha" ;;
    *)
      echo "❌ Unknown argument: $arg"
      echo "Usage: npm run release:resume | npm run release:resume:beta | npm run release:resume:alpha"
      exit 1
      ;;
  esac
done

# Read the version from the already-bumped packages
VERSION=$(node -p "require('./packages/core/package.json').version")

if [ -n "$PRE_TAG" ]; then
  echo "🏷️  Resuming prerelease: $PRE_TAG (v${VERSION})"
else
  echo "📦 Resuming stable release (v${VERSION})"
fi

# Check npm auth before doing any work
echo ""
echo "🔑 Checking npm authentication..."
if ! npm whoami &>/dev/null; then
  echo "  ⚠️  Not logged in to npm."
  echo "  Please run 'npm login' in a separate terminal, then re-run this script."
  exit 1
fi
echo "  ✅ Logged in as $(npm whoami)"

# Confirm
echo ""
echo "┌──────────────────────────────────────────┐"
echo "│  About to resume release: ${VERSION}"
if [ -n "$PRE_TAG" ]; then
  echo "│  npm dist-tag: ${PRE_TAG}"
else
  echo "│  npm dist-tag: latest"
fi
echo "└──────────────────────────────────────────┘"
echo ""
read -r -p "Proceed? (y/N) " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "❌ Aborted."
  exit 1
fi

# Ensure tags exist (re-create if they were deleted or never created)
echo "🏷️  Ensuring git tags..."
npx changeset tag 2>/dev/null || true
echo "  ✅ Tags verified"

# Publish — skip packages that are already published
echo "🚀 Publishing to npm..."
PUBLISH_ARGS=(--access public)
if [ -n "$PRE_TAG" ]; then
  PUBLISH_ARGS+=(--tag "$PRE_TAG")
fi

WORKSPACES=(
  "@dfosco/storyboard-core"
  "@dfosco/storyboard-react"
  "@dfosco/storyboard-react-primer"
  "@dfosco/storyboard-react-reshaped"
)

for ws in "${WORKSPACES[@]}"; do
  PKG_VERSION=$(npm view "${ws}@${VERSION}" version 2>/dev/null || true)
  if [ "$PKG_VERSION" = "$VERSION" ]; then
    echo "  ⏭️  ${ws}@${VERSION} already published, skipping"
  else
    echo "  📦 Publishing ${ws}@${VERSION}..."
    npm publish --workspace "$ws" "${PUBLISH_ARGS[@]}"
  fi
done

# Exit prerelease mode if needed
if [ -n "$PRE_TAG" ]; then
  if [ -f ".changeset/pre.json" ]; then
    echo "🔀 Exiting changeset prerelease mode..."
    npx changeset pre exit
    git add -A
    git commit -m "chore: exit prerelease mode" --allow-empty
  fi
fi

echo "⬆️  Pushing with tags..."
git push --follow-tags

echo "📢 Creating GitHub Release..."

TAG="@dfosco/storyboard-core@${VERSION}"
CHANGELOG="packages/core/CHANGELOG.md"
TITLE="v${VERSION}"

GH_RELEASE_ARGS=()
if [ -n "$PRE_TAG" ]; then
  GH_RELEASE_ARGS+=(--prerelease)
else
  GH_RELEASE_ARGS+=(--latest)
fi

if gh release view "$TAG" &>/dev/null; then
  echo "  ⏭️  ${TITLE} release already exists, skipping"
else
  NOTES=$(awk -v ver="## ${VERSION}" '
    $0 ~ ver { found=1; next }
    found && /^## / { exit }
    found { print }
  ' "$CHANGELOG")

  if [ -n "$NOTES" ]; then
    echo "$NOTES" | gh release create "$TAG" --title "$TITLE" --notes-file - "${GH_RELEASE_ARGS[@]}"
  else
    echo "  ⚠️  No changelog section found for ${VERSION} in ${CHANGELOG}"
    echo "     Falling back to auto-generated notes from commits."
    gh release create "$TAG" --title "$TITLE" --generate-notes "${GH_RELEASE_ARGS[@]}"
  fi
  echo "  ✅ Created release ${TITLE}"
fi

echo "✅ Release resumed successfully!"
