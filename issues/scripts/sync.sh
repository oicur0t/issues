#!/usr/bin/env bash
# Sync to GitHub: bump the build number, commit it, push.
# Usage: ./scripts/sync.sh
# Commit your work first; this only commits BUILD_NUMBER.
set -euo pipefail
cd "$(dirname "$0")/.."

branch=$(git rev-parse --abbrev-ref HEAD)

# Warn (not fail) if tracked files are uncommitted: they won't be on GitHub for this build
if ! git diff --quiet HEAD -- . ':(exclude)BUILD_NUMBER'; then
  echo "Note: uncommitted changes are NOT included in this sync:" >&2
  git status --short | grep -v '^??' >&2
fi

current=$(tr -dc '0-9' < BUILD_NUMBER)
next=$(( ${current:-0} + 1 ))
echo "$next" > BUILD_NUMBER

git add BUILD_NUMBER
git commit -q -m "chore: build $next"
git push origin "$branch"

echo "Synced to GitHub as build $next"
