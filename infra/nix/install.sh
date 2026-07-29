#!/usr/bin/env bash
# install.sh — FIRST-TIME NixOS install onto a freshly provisioned
# Hetzner VM, via nixos-anywhere.
#
# This is destructive: it kexecs the target into a NixOS installer and
# repartitions the disk per infra/nix/modules/disko.nix. Everything on
# the machine is wiped. For incremental rebuilds against an
# already-installed VM use deploy.sh instead.
#
# nixos-anywhere doesn't expose --override-input, so the first install
# always uses the fisiowebSource default from flake.nix (ref=main). Run
# deploy.sh --ref <tag> afterwards to pin the host to a release.
#
# Usage:
#   ./infra/nix/install.sh [<ip>]
#
# <ip> defaults to the server's NATIVE public IPv4 (tofu output
# app_public_ipv4), not the Floating IP — see the comment at the
# resolution step below for why that distinction matters here and
# nowhere else.
#
# Prereqs:
#   - Docker
#   - ssh-agent with a key authorized for root@<ip> (the key registered
#     as ssh_public_key in terraform.tfvars)
#   - VM host SSH keypair at $FISIOWEB_HOST_KEY
#     (default ~/Sync/profile/.ssh/fisioweb-app-host), pubkey pasted
#     into keys.nix as fisiowebApp. Generate with:
#       ssh-keygen -t ed25519 -f ~/Sync/profile/.ssh/fisioweb-app-host -N ''
#   - sops age key at $SOPS_AGE_KEY_FILE
#     (default ~/.config/sops/age/keys.txt), matching .sops.yaml
#
# First run bootstraps /nix into the fisioweb-nix-store Docker volume
# (~10-15 min). Later runs reuse it.

set -euo pipefail

# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

ip="${1:-}"

#=============================================================================
# Preflight
#=============================================================================

require_cmds tofu sops docker ssh-keyscan

: "${SSH_AUTH_SOCK:?SSH_AUTH_SOCK not set; start ssh-agent and ssh-add your key}"
if [ "$(uname)" = "Darwin" ]; then
  SSH_AUTH_SOCK=/run/host-services/ssh-auth.sock
fi

load_tofu_env

# The first install targets the server's NATIVE public IPv4 — NOT the
# Floating IP that every other script uses.
#
# Hetzner routes the Floating IP to the server at the network layer, but
# the OS still has to claim the address on its NIC or the kernel drops
# the packets. Claiming it is what infra/nix/modules/floating-ip.nix
# does, and that only exists once NixOS is installed. So at this point
# in the lifecycle the Floating IP is unreachable by definition, and
# ssh to it hangs until it times out.
#
# After this script finishes, the binding is in place and deploy.sh /
# artisan.sh use the Floating IP as normal.
if [ -z "$ip" ]; then
  ip=$(tofu -chdir="$tofu_dir" output -raw app_public_ipv4 2>/dev/null || true)
  [ -n "$ip" ] || {
    echo "could not resolve the server's native IPv4 from tofu." >&2
    echo "Has \`tofu apply\` run? Otherwise pass the IP explicitly:" >&2
    echo "  ./infra/nix/install.sh <ip>" >&2
    exit 1
  }
fi

host_key="${FISIOWEB_HOST_KEY:-$HOME/Sync/profile/.ssh/fisioweb-app-host}"
[ -f "$host_key" ] && [ -f "${host_key}.pub" ] || {
  echo "VM host SSH keypair not found at ${host_key}{,.pub}." >&2
  echo "Generate with: ssh-keygen -t ed25519 -f $host_key -N ''" >&2
  echo "Then paste the .pub contents into keys.nix as fisiowebApp." >&2
  exit 1
}

# Guard against the most common first-install mistake: forgetting to
# paste the generated pubkey into keys.nix, which produces a VM whose
# host identity doesn't match what deploy.sh will later pin.
if grep -q 'PASTE_THE_CONTENTS_OF' "$repo_root/keys.nix"; then
  echo "keys.nix still contains the fisiowebApp placeholder." >&2
  echo "Paste the contents of ${host_key}.pub into it first:" >&2
  echo >&2
  cat "${host_key}.pub" >&2
  exit 1
fi

age_key="${SOPS_AGE_KEY_FILE:-$HOME/.config/sops/age/keys.txt}"
[ -f "$age_key" ] || {
  echo "sops age key not found at $age_key." >&2
  echo "Generate with: age-keygen -o $age_key" >&2
  echo "Then put the 'age1...' public line into .sops.yaml and rekey" >&2
  echo "every secret (sops updatekeys secrets/<file>)." >&2
  exit 1
}

setup_nix_env "$ip"

#=============================================================================
# Step 1 — sync tofu state into local files
#=============================================================================
# Must happen BEFORE nixos-anywhere: the generated data-volume.nix is
# what puts /srv/data on the Hetzner volume. Installing with the
# committed placeholder would silently put Postgres on the root disk.

sync_tofu_state

#=============================================================================
# Step 2 — nixos-anywhere
#=============================================================================
# --extra-files rsyncs this directory's contents onto the target's root
# before activation. Two secrets ride in this way:
#   - SSH host key  → /etc/ssh/ssh_host_ed25519_key, so the VM's
#     identity matches keys.nix from its very first boot
#   - age key       → /var/lib/sops-nix/key.txt, so sops-install-secrets
#     can decrypt /run/secrets/* at every activation

echo "==> running nixos-anywhere against $ip..."
echo "    THIS WIPES THE MACHINE."

extra=$(mktemp -d)
trap 'rm -rf "$extra"; cleanup_nix_env' EXIT
mkdir -p "$extra/etc/ssh" "$extra/var/lib/sops-nix"
install -m 0600 "$host_key"       "$extra/etc/ssh/ssh_host_ed25519_key"
install -m 0644 "${host_key}.pub" "$extra/etc/ssh/ssh_host_ed25519_key.pub"
install -m 0400 "$age_key"        "$extra/var/lib/sops-nix/key.txt"

docker run --rm -it \
  --platform linux/amd64 \
  --security-opt seccomp=unconfined \
  -v "$repo_root:/work" -w /work \
  -v "${docker_volume}:/nix" \
  -v "${SSH_AUTH_SOCK}:/ssh-agent" \
  -v "$extra:/extra:ro" \
  -v "$kh:/known_hosts:ro" \
  -v "$gitconfig:/root/.gitconfig:ro" \
  -e SSH_AUTH_SOCK=/ssh-agent \
  -e GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/known_hosts -o StrictHostKeyChecking=yes" \
  -e NIX_CONFIG=$'experimental-features = nix-command flakes\nfilter-syscalls = false\nsandbox = false' \
  nixos/nix \
  nix run github:nix-community/nixos-anywhere -- \
    --flake ".#${flake_target}" \
    --extra-files /extra \
    "root@${ip}"

echo
echo "==> install complete."
echo "    Next: ./infra/nix/refresh-hashes.sh --ref main"
echo "          ./infra/nix/deploy.sh --ref main"
