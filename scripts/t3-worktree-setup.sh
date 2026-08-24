#!/usr/bin/env bash
# Link a T3 Code worktree to the main Rycode checkout.
# T3CODE_PROJECT_ROOT is the original repo path. This script runs in the worktree.
set -euo pipefail

MAIN="${T3CODE_PROJECT_ROOT:-}"

if [ -n "$MAIN" ] && [ -d "$MAIN/node_modules" ]; then
  ln -sfn "$MAIN/node_modules" node_modules
  echo "Linked node_modules -> $MAIN/node_modules"
else
  npm install
fi
