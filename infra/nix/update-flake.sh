#!/usr/bin/env bash
# update-flake.sh — bump the pinned nixpkgs / disko / sops-nix revisions
# in flake.lock.
#
# This is the closest thing this project has to "unattended upgrades".
# Nothing else ever moves nixpkgs: flake.lock pins it to one exact
# revision, so without this the VM's kernel, OpenSSL and every other
# system package stay frozen at whatever they were on install day,
# however many rebuilds you do.
#
# Deliberately NOT automated on the VM. The lock file is what makes a
# rebuild reproducible; a server that rewrites its own lock has silently
# diverged from git, which throws away the reason for pinning at all.
# So: bump here, review the diff, commit, deploy.
#
# Usage:
#   ./infra/nix/update-flake.sh                  # all inputs
#   ./infra/nix/update-flake.sh nixpkgs          # just one
#   ./infra/nix/update-flake.sh --no-docker      # use a local nix
#
# Suggested cadence: monthly, and after any published CVE that matters
# to you. Expect the following deploy to rebuild most of the system —
# don't do it right before a demo.

set -euo pipefail

# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

usage() {
  cat >&2 <<'EOF'
usage: update-flake.sh [<input>...] [--no-docker]

With no arguments, updates every flake input (nixpkgs, disko, sops-nix).
Pass one or more input names to update only those.

  --no-docker   run nix natively instead of via the Docker harness

Does NOT commit. Review the reported changes, then:
  git add flake.lock && git commit -m "infra: bump flake inputs"
  ./infra/nix/deploy.sh --ref main
EOF
}

inputs=()
while [ $# -gt 0 ]; do
  case "$1" in
    --no-docker) use_docker=false ;;
    -h|--help)   usage; exit 0 ;;
    -*)          echo "unknown flag: $1" >&2; usage; exit 2 ;;
    *)           inputs+=("$1") ;;
  esac
  shift
done

if $use_docker; then
  require_cmds docker ssh-keyscan
else
  require_cmds nix ssh-keyscan
fi

lock="$repo_root/flake.lock"
[ -f "$lock" ] || { echo "no flake.lock at $lock" >&2; exit 1; }

# Snapshot the current pins so we can report what actually moved. Nix's
# own output is noisy and doesn't summarise well.
before=$(mktemp)
trap 'rm -f "$before"; cleanup_nix_env' EXIT
cp "$lock" "$before"

# fisiowebSource resolves over SSH, so the agent has to be reachable
# even though we're only touching the lock.
if [ -z "${SSH_AUTH_SOCK:-}" ]; then
  echo "warning: no ssh-agent; updating the fisiowebSource input will fail." >&2
  SSH_AUTH_SOCK=/dev/null
elif $use_docker && [ "$(uname)" = "Darwin" ]; then
  SSH_AUTH_SOCK=/run/host-services/ssh-auth.sock
fi

setup_nix_env

# git's progress meter (Counting/Compressing/Receiving/Resolving) comes
# through nix's stderr as \r-delimited spam and buries everything that
# matters. Split on \r and drop only those known-noise lines, so real
# warnings and errors still surface. `set -o pipefail` is already on, so
# a nix failure still fails the script.
strip_progress() {
  tr '\r' '\n' \
    | grep -vE '^(remote: )?(Counting|Compressing|Receiving|Resolving) (objects|deltas)|^remote: Total|^remote: Enumerating' \
    || true
}

if [ ${#inputs[@]} -gt 0 ]; then
  echo "==> updating: ${inputs[*]}"
  run_nix flake update "${inputs[@]}" 2>&1 | strip_progress
else
  echo "==> updating all flake inputs"
  run_nix flake update 2>&1 | strip_progress
fi

#=============================================================================
# Report what moved
#=============================================================================

python3 - "$before" "$lock" <<'PY'
import json, sys

def pins(path):
    with open(path) as fh:
        nodes = json.load(fh).get("nodes", {})
    out = {}
    for name, node in nodes.items():
        if name == "root":
            continue
        loc = node.get("locked", {})
        rev = loc.get("rev") or loc.get("narHash", "")
        out[name] = (rev[:12], loc.get("lastModified"))
    return out

old, new = pins(sys.argv[1]), pins(sys.argv[2])
changed = [k for k in new if k in old and old[k][0] != new[k][0]]
added   = [k for k in new if k not in old]

if not changed and not added:
    print("\n==> no changes — every input was already at its latest pin.")
    sys.exit(0)

print("\n==> inputs updated:\n")
for k in sorted(changed):
    print(f"    {k}")
    print(f"      {old[k][0]}  ->  {new[k][0]}")
for k in sorted(added):
    print(f"    {k} (new)  {new[k][0]}")

print("""
Next:
    git diff flake.lock                       # review
    git add flake.lock
    git commit -m "infra: bump flake inputs"
    ./infra/nix/deploy.sh --ref main

A nixpkgs bump rebuilds most of the system closure, so the next deploy
will be slow. If the kernel moved, the VM needs a reboot to run it:

    ssh <operator>@<ip> 'sudo reboot'

To undo before committing:  git checkout flake.lock""")
PY
