#!/usr/bin/env bash
set -euo pipefail

# initializeCommand for devcontainer
# - Use `op inject` to expand op:// references in a template into a secure env file

SRC=".devcontainer/.env.template"
DST=".devcontainer/.env"

mkdir -p .devcontainer

if [ ! -f "$SRC" ]; then
  echo "initializeCommand: template $SRC not found, nothing to do" >&2
  exit 0
fi

if ! command -v op >/dev/null 2>&1; then
  echo "initializeCommand: op CLI not found; cannot inject secrets" >&2
  exit 1
fi

if ! op inject -i "$SRC" -o "$DST" --file-mode 0600 -f; then
  echo "initializeCommand: op inject failed" >&2
  exit 2
fi

echo "initializeCommand: wrote $DST"
exit 0
