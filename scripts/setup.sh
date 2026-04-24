#!/bin/bash
# storyboard setup — bootstrap script
# Installs dependencies first (so @clack/prompts is available),
# then delegates to the Node CLI for the rest.

set -e

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

npx storyboard setup
