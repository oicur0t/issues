#!/usr/bin/env bash
# Sync to GitHub (bumps the build number), then rebuild and swap the container.
# Usage: ./scripts/deploy.sh          (set PODMAN="podman" if your container is rootless)
# Roll back: sudo podman tag localhost/issues_app:build-<N> localhost/issues_app:latest
#            sudo podman-compose down && sudo podman-compose up -d --no-build
set -euo pipefail
cd "$(dirname "$0")/.."

PODMAN=${PODMAN:-"sudo podman"}
COMPOSE=${COMPOSE:-"sudo podman-compose"}
IMAGE=localhost/issues_app
PORT=${PORT:-3002}

previous=$(tr -dc '0-9' < BUILD_NUMBER)

# 1. Sync first: GitHub always has what we deploy
./scripts/sync.sh
build=$(tr -dc '0-9' < BUILD_NUMBER)

# 2. Keep the running image as a rollback point (named by the build it was)
if $PODMAN image exists "$IMAGE:latest"; then
  $PODMAN tag "$IMAGE:latest" "$IMAGE:build-$previous"
  echo "Rollback point: $IMAGE:build-$previous"
fi

# 3. Build and swap (down first: 'up --build' alone does not recreate the container)
$COMPOSE build
$COMPOSE down
$COMPOSE up -d --no-build

# 4. Verify the new build is live
sleep 5
live=$(curl -s "localhost:$PORT/api/v1/version" || true)
echo "Live: $live"
if echo "$live" | grep -q "\"build\":\"$build\""; then
  echo "Deployed build $build"
else
  echo "WARNING: expected build $build is not live. Check: $PODMAN logs --tail 30 issues_app_1" >&2
  exit 1
fi
