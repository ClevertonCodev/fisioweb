#!/usr/bin/env bash
# deploy.sh — deploy the fisioweb-app NixOS config to the VM.
#
# Single entry point for a routine deploy: sync tofu-derived state into
# local files, then run `nixos-rebuild switch` against the target host.
#
# The deploy ref is passed with --ref <git-ref> — anything git would
# accept: a tag (v0.2.0), a branch (main), or a commit sha. Required, so
# a deploy is always traceable to a specific tree.
#
# Usage:
#   ./infra/nix/deploy.sh --ref v0.2.0 [<ip>]
#
# Prereqs:
#   - Docker (or --no-docker with nix on PATH)
#   - ssh-agent holding a key listed in keys.nix .operators
#   - sops age key at ~/.config/sops/age/keys.txt (or $SOPS_AGE_KEY)
#   - VM host pubkey at $FISIOWEB_HOST_KEY.pub

set -euo pipefail

# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

usage() {
  cat >&2 <<'EOF'
usage: deploy.sh --ref <git-ref> [<ip>] [flags]

--ref <git-ref>     (required) tag / branch / commit to pin the app
                    source at.

<ip> defaults to the cached address in infra/nix/target-ip (generated
by this script), falling back to `tofu output -raw app_floating_ipv4`.

Default: full deploy, two steps in order:
  1. sync tofu outputs → local files / secrets
  2. nixos-rebuild switch on the target host

The committed infra/nix/{composer-vendor,npm-deps}.sha pins are trusted
as-is. Run ./infra/nix/refresh-hashes.sh --ref <ref> during release prep
when lockfiles change, commit the updated pins, then deploy.

  --no-tofu-sync   skip step 1 (fast iteration when only NixOS modules
                   changed)
  --no-docker      run nix natively instead of via the Docker harness.
                   Requires nix on PATH. Faster if you already have it.
  -y, --yes        skip the confirmation prompt
EOF
}

ip=""
skip_tofu_sync=false
auto_yes=false
deploy_ref=""

while [ $# -gt 0 ]; do
  case "$1" in
    --ref)          shift; deploy_ref="${1:?--ref requires a git ref}" ;;
    --ref=*)        deploy_ref="${1#--ref=}" ;;
    --no-tofu-sync) skip_tofu_sync=true ;;
    --no-docker)    use_docker=false ;;
    -y|--yes)       auto_yes=true ;;
    -h|--help)      usage; exit 0 ;;
    # A positional IP is accepted in any position, not just $1.
    *.*.*.*)
      [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "not an IPv4: $1" >&2; exit 2; }
      [ -z "$ip" ] || { echo "target IP given twice: $ip and $1" >&2; exit 2; }
      ip="$1" ;;
    *) echo "unknown flag: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

[ -n "$deploy_ref" ] || { echo "missing required --ref <git-ref>" >&2; usage; exit 2; }

#=============================================================================
# Preflight
#=============================================================================

if $use_docker; then
  require_cmds tofu sops docker git ssh-keyscan
else
  require_cmds tofu sops nix git ssh-keyscan
fi

: "${SSH_AUTH_SOCK:?SSH_AUTH_SOCK not set; start ssh-agent and ssh-add your key}"

# macOS Docker Desktop exposes the host agent at a fixed magic path.
if $use_docker && [ "$(uname)" = "Darwin" ]; then
  SSH_AUTH_SOCK=/run/host-services/ssh-auth.sock
fi

load_tofu_env
resolve_source_url "$deploy_ref"

ip=$(resolve_ip "$ip")

# SSH target user. Defaults to the local $USER, on the assumption that
# operators have matching accounts on the VM via keys.nix .operators.
# Override with FISIOWEB_OPERATOR when your laptop username differs from
# your attr name in keys.nix.
operator="${FISIOWEB_OPERATOR:-${USER:?USER is unset; export FISIOWEB_OPERATOR explicitly}}"

host_key="${FISIOWEB_HOST_KEY:-$HOME/Sync/profile/.ssh/fisioweb-app-host}"
[ -f "${host_key}.pub" ] || {
  echo "VM host pubkey not found at ${host_key}.pub." >&2
  echo "Without it the deploy can't pin the host identity." >&2
  echo "Recover by SSHing in and copying back /etc/ssh/ssh_host_ed25519_key.pub," >&2
  echo "or set FISIOWEB_HOST_KEY to wherever yours lives." >&2
  exit 1
}

setup_nix_env "$ip"
trap cleanup_nix_env EXIT

#=============================================================================
# Confirm
#=============================================================================
# --ref is explicit, but a typo in it is still possible. Surfacing ref +
# IP lets the operator bail before any secret is re-synced or any
# rebuild starts.

steps=""
$skip_tofu_sync && steps+="[skip tofu] " || steps+="tofu→ "
steps+="rebuild"

echo
echo "About to deploy:"
echo "  target: ${operator}@${ip}"
echo "  ref:    ${deploy_ref}  (${qualified_ref})"
echo "  steps:  ${steps}"
echo

if ! $auto_yes; then
  read -rp "Continue? [y/N] " ans
  case "$ans" in
    [Yy]|[Yy][Ee][Ss]) ;;
    *) echo "aborted."; exit 0 ;;
  esac
fi

#=============================================================================
# Step 1 — sync tofu state into local files
#=============================================================================

if $skip_tofu_sync; then
  echo "==> skipping tofu sync (--no-tofu-sync)."
else
  sync_tofu_state
fi

#=============================================================================
# Step 2 — nixos-rebuild against the target host
#=============================================================================

echo "==> deploying to $ip (ref=$deploy_ref)..."

# --use-substitutes tells the REMOTE to pull unchanged store paths from
# cache.nixos.org directly, so the operator's home connection only has
# to ship what actually changed in the closure.
#
# --override-input pins the app source to --ref without touching
# flake.lock, so a deploy never produces a git diff.
run_nix run nixpkgs#nixos-rebuild -- switch \
  --flake ".#${flake_target}" \
  --override-input "$source_input" "$source_url" \
  --target-host "${operator}@${ip}" \
  --sudo \
  --no-reexec \
  --use-substitutes

echo "==> deploy complete."
