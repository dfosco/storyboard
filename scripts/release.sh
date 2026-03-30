#!/usr/bin/env bash
set -euo pipefail

# Release script for @dfosco/storyboard-* packages
# Runs lint + tests + build before creating a versioned release.
#
# Usage:
#   npm run release              # stable release
#   npm run release:beta         # beta prerelease
#   npm run release:alpha        # alpha prerelease
#
# Direct invocation also works:
#   ./scripts/release.sh --beta
#   ./scripts/release.sh --alpha
#
# Note: "npm run release --beta" does NOT work (npm eats the flag).
# Always use "npm run release:beta" instead.

PRE_TAG="${PRERELEASE_TAG:-}"

for arg in "$@"; do
  case "$arg" in
    --beta)  PRE_TAG="beta"  ;;
    --alpha) PRE_TAG="alpha" ;;
    *)
      echo "❌ Unknown argument: $arg"
      echo "Usage: npm run release:beta | npm run release:alpha | npm run release"
      exit 1
      ;;
  esac
done

if [ -n "$PRE_TAG" ]; then
  echo "🏷️  Prerelease mode: $PRE_TAG"
else
  echo "📦 Stable release"
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

echo ""
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
echo ""
echo "  What type of version bump?"
echo "    1) patch  (bug fixes)"
echo "    2) minor  (new features)"
echo "    3) major  (breaking changes)"
echo ""
read -r -p "  Choose [1/2/3]: " bump_choice
case "$bump_choice" in
  1) BUMP_TYPE="patch" ;;
  3) BUMP_TYPE="major" ;;
  *) BUMP_TYPE="minor" ;;
esac

echo ""
read -r -p "  Summary: " SUMMARY
if [ -z "$SUMMARY" ]; then
  SUMMARY="Release"
fi

# Generate changeset file (all fixed packages bump together — only need to name one)
CHANGESET_ID=$(node -p "'changeset-' + Date.now().toString(36)")
cat > ".changeset/${CHANGESET_ID}.md" <<EOF
---
"@dfosco/storyboard-core": ${BUMP_TYPE}
---

${SUMMARY}
EOF
echo "  ✅ Created .changeset/${CHANGESET_ID}.md (${BUMP_TYPE})"

echo "📦 Bumping versions..."
npm run version

# Read the version that was just set
VERSION=$(node -p "require('./packages/core/package.json').version")

# Sanity check: prerelease versions must contain the tag
if [ -n "$PRE_TAG" ] && [[ "$VERSION" != *"-${PRE_TAG}."* ]]; then
  echo ""
  echo "❌ ERROR: Expected a ${PRE_TAG} prerelease version but got ${VERSION}"
  echo "   This usually means 'changeset pre enter' failed silently."
  echo "   Aborting — no packages have been published."
  echo ""
  echo "   To fix: run 'npx changeset pre exit' and try again."
  exit 1
fi

# Confirm before publishing
echo ""
echo "┌──────────────────────────────────────────┐"
echo "│  About to publish version: ${VERSION}"
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
  # Roll back pre mode if we entered it
  if [ -n "$PRE_TAG" ]; then
    npx changeset pre exit 2>/dev/null || true
  fi
  exit 1
fi

echo "📌 Committing version bump..."
git add -A
if [ -n "$PRE_TAG" ]; then
  git commit -m "chore: version packages (${PRE_TAG})"
else
  git commit -m "chore: version packages"
fi

echo "🏷️  Creating git tags..."
npx changeset tag

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

TAG="@dfosco/storyboard-core@${VERSION}"
CHANGELOG="packages/core/CHANGELOG.md"

TITLE="v${VERSION}"

# Verify the tag exists on the remote
if ! git ls-remote --tags origin "refs/tags/${TAG}" | grep -q .; then
  echo "  ⚠️  Tag ${TAG} not found on remote. Pushing tags..."
  git push --follow-tags
fi

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

echo "✅ Release complete!"
