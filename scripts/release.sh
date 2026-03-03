#!/usr/bin/env bash
set -euo pipefail

# Release script for @dfosco/storyboard-* packages
# Runs lint + tests + build before creating a versioned release.
# Usage: ./scripts/release.sh

echo "🔍 Running lint..."
npm run lint

echo "🧪 Running tests..."
npm test

echo "🏗️  Running build..."
npm run build

echo "📝 Creating changeset..."
npx changeset

echo "📦 Bumping versions..."
npx changeset version

echo "📌 Committing version bump..."
git add -A
git commit -m "chore: version packages"

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
  npm publish --workspace @dfosco/storyboard-core --access public
  npm publish --workspace @dfosco/storyboard-react --access public
  npm publish --workspace @dfosco/storyboard-react-primer --access public
  npm publish --workspace @dfosco/storyboard-react-reshaped --access public
fi

echo "⬆️  Pushing with tags..."
git push --follow-tags

echo "📢 Creating GitHub Release..."

VERSION=$(node -p "require('./packages/core/package.json').version")
TAG="@dfosco/storyboard-core@${VERSION}"
TITLE="v${VERSION}"
CHANGELOG="packages/core/CHANGELOG.md"

if gh release view "$TAG" &>/dev/null; then
  echo "  ⏭️  ${TITLE} release already exists, skipping"
else
  NOTES=$(awk -v ver="## ${VERSION}" '
    $0 ~ ver { found=1; next }
    found && /^## / { exit }
    found { print }
  ' "$CHANGELOG")

  if [ -n "$NOTES" ]; then
    echo "$NOTES" | gh release create "$TAG" --title "$TITLE" --notes-file -
  else
    gh release create "$TAG" --title "$TITLE" --generate-notes
  fi
  echo "  ✅ Created release ${TITLE}"
fi

echo "✅ Release complete!"
