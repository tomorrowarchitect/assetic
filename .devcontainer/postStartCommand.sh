#!/usr/bin/env bash
set -euo pipefail

# postStartCommand for devcontainer
# - Run optional dotfiles bootstrap (if DOTFILES_GIT_URL set)
# - Remove any temporary .devcontainer/.env file created by initializeCommand

if [ -n "${DOTFILES_GIT_URL:-}" ]; then
  URL="$DOTFILES_GIT_URL"
  case "$URL" in
    https://*|ssh://*) URL="git+$URL" ;;
  esac
  # Run npx on the host-provided URL to bootstrap dotfiles
  if command -v npx >/dev/null 2>&1; then
    npx -y "$URL" || echo "postStartCommand: npx bootstrap failed" >&2
  else
    echo "postStartCommand: npx not available, skipping bootstrap" >&2
  fi
fi

ENV_FILE=".devcontainer/.env"
if [ -f "$ENV_FILE" ]; then
  chmod 600 "$ENV_FILE" || true
  rm -f "$ENV_FILE"
fi

exit 0
