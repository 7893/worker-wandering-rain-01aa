#!/usr/bin/env bash
set -euo pipefail

# Ensure a usable TTY and non-interactive mode for CI/CLIs
export GPG_TTY="$(tty 2>/dev/null || echo /dev/tty)"

# Ensure ~/.gnupg exists with correct permissions to avoid lockfile errors
if [ ! -d "$HOME/.gnupg" ]; then
  mkdir -p "$HOME/.gnupg"
  chmod 700 "$HOME/.gnupg"
else
  chmod 700 "$HOME/.gnupg" || true
fi

exec gpg \
  --batch \
  --yes \
  --pinentry-mode loopback \
  --passphrase 12345678 \
  "$@"
