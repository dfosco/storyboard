#!/usr/bin/env bash
set -euo pipefail

# Release script for @dfosco/storyboard-* packages
# Runs lint + tests + build before creating a versioned release.
#
# Usage:
#   ./scripts/release.sh            # stable release
#   ./scripts/release.sh --beta     # beta prerelease
#   ./scripts/release.sh --alpha    # alpha prerelease

PRE_TAG=""

for arg in "$@"; do
  case "$arg" in
    --beta)  PRE_TAG="beta"  ;;
    --alpha) PRE_TAG="alpha" ;;
    *)
      echo "❌ Unknown argument: $arg"
      echo "Usage: ./scripts/release.sh [--beta|--alpha]"
      exit 1
      ;;
  esac
done

if [ -n "$PRE_TAG" ]; then
  echo "🏷️  Prerelease mode: $PRE_TAG"
fi

echo "🔍 Running lint..."
npm run lint

echo "🧪 Running tests..."
npm test

echo "🏗️  Running build..."
npm run build

# Enter prerelease mode before creating the changeset
if [ -n "$PRE_TAG" ]; then
  echo "🔀 Entering changeset prerelease mode ($PRE_TAG)..."
  npx changeset pre enter "$PRE_TAG"
fi

echo "📝 Creating changeset..."
npx changeset

echo "📦 Bumping versions..."
npx changeset version

echo "📌 Committing version bump..."
git add -A
if [ -n "$PRE_TAG" ]; then
  git commit -m "chore: version packages ($PRE_TAG)"
else
  git commit -m "chore: version packages"
fi

echo "🚀 Publishing to npm..."
if [ "${CI:-}" = "true" ]; then
  if [ -n "${NPM_TOKEN:-}" ] || [ -n "${NODE_AUTH_TOKEN:-}" ]; then
    echo "  ℹ️  CI detected; using changeset publish..."
    npx changeset publish
  else
    echo "  ❌ CI publish requires NPM_TOKEN or NODE_AUTH_TOKEN."
    exit 1
  fi
else
  echo "  ℹ️  Local release detected; using npm publish (passkey/web auth compatible)..."
  PUBLISH_ARGS=(--access public)
  if [ -n "$PRE_TAG" ]; then
    PUBLISH_ARGS+=(--tag "$PRE_TAG")
  fi
  npm publish --workspace @dfosco/storyboard-core "${PUBLISH_ARGS[@]}"
  npm publish --workspace @dfosco/storyboard-react "${PUBLISH_ARGS[@]}"
  npm publish --workspace @dfosco/storyboard-react-primer "${PUBLISH_ARGS[@]}"
  npm publish --workspace @dfosco/storyboard-react-reshaped "${PUBLISH_ARGS[@]}"
fi

# Exit prerelease mode so the repo is left clean
if [ -n "$PRE_TAG" ]; then
  echo "🔀 Exiting changeset prerelease mode..."
  npx changeset pre exit
  git add -A
  git commit -m "chore: exit prerelease mode" --allow-empty
fi

echo "⬆️  Pushing with tags..."
git push --follow-tags

echo "📢 Creating GitHub Release..."

VERSION=$(node -p "require('./packages/core/package.json').version")
TAG="@dfosco/storyboard-core@${VERSION}"
CHANGELOG="packages/core/CHANGELOG.md"

TITLE="v${VERSION}"

GH_RELEASE_ARGS=()
if [ -n "$PRE_TAG" ]; then
  GH_RELEASE_ARGS+=(--prerelease)
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
    gh release create "$TAG" --title "$TITLE" --generate-notes "${GH_RELEASE_ARGS[@]}"
  fi
  echo "  ✅ Created release ${TITLE}"
fi

echo "✅ Release complete!"
