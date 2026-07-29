#!/usr/bin/env bash
# nix.sh — run nix commands against the local flake without installing
# Nix on the host. Escape hatch for ad-hoc work the other scripts don't
# cover.
#
# Uses the official nixos/nix image; a named Docker volume persists /nix
# between invocations so the store isn't re-downloaded every time.
#
# Usage:
#   ./infra/nix/nix.sh flake check
#   ./infra/nix/nix.sh flake metadata
#   ./infra/nix/nix.sh build .#nixosConfigurations.fisioweb-app.config.system.build.toplevel
#   ./infra/nix/nix.sh repl

set -euo pipefail

# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

require_cmds docker ssh-keyscan

# The agent socket carries the key that grants access to the private
# source repo. Commands that don't touch fisiowebSource still work
# without it, so this is a warning rather than a hard failure.
if [ -z "${SSH_AUTH_SOCK:-}" ]; then
  echo "warning: no ssh-agent (SSH_AUTH_SOCK unset)." >&2
  echo "         Anything that evaluates fisiowebSource will fail." >&2
  echo "         Run: ssh-add" >&2
  # A path that exists but carries nothing, so the -v mount below is
  # still valid.
  SSH_AUTH_SOCK=/dev/null
elif [ "$(uname)" = "Darwin" ]; then
  SSH_AUTH_SOCK=/run/host-services/ssh-auth.sock
fi

setup_nix_env
trap cleanup_nix_env EXIT

run_nix "$@"
