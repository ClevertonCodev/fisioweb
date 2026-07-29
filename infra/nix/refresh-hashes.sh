#!/usr/bin/env bash
# refresh-hashes.sh — refresh the composer-vendor.sha + npm-deps.sha
# pins against a candidate git ref.
#
# Run this during RELEASE PREP, not during deploy: deploy.sh trusts the
# committed .sha files as-is, which is what keeps a deploy fast and
# free of surprise rebuilds.
#
# Workflow:
#   1. Bump composer.lock / package-lock.json on a branch, push it.
#   2. ./infra/nix/refresh-hashes.sh --ref <branch>
#   3. git add infra/nix/*.sha && git commit -m "infra: refresh hash pins"
#   4. Merge / tag.
#
# Prereqs:
#   - Docker
#   - ssh-agent with a key that can read the repo on GitHub

set -euo pipefail

# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

usage() {
  cat >&2 <<'EOF'
usage: refresh-hashes.sh --ref <git-ref> [--no-docker]

--ref <git-ref>   (required) tag / branch / commit whose lockfiles the
                  hashes should be derived from.

Re-runs `nix build` against the ref until composer-vendor.sha and
npm-deps.sha match what the fixed-output derivations actually produce.
On each hash mismatch it parses Nix's "got: sha256-..." line, overwrites
the pin, and retries. Idempotent: exits immediately if the pins are
already correct.
EOF
}

deploy_ref=""

while [ $# -gt 0 ]; do
  case "$1" in
    --ref)       shift; deploy_ref="${1:?--ref requires a git ref}" ;;
    --ref=*)     deploy_ref="${1#--ref=}" ;;
    --no-docker) use_docker=false ;;
    -h|--help)   usage; exit 0 ;;
    *) echo "unknown flag: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

[ -n "$deploy_ref" ] || { echo "missing required --ref <git-ref>" >&2; usage; exit 2; }

composer_hash_file="$infra_nix_dir/composer-vendor.sha"
npm_hash_file="$infra_nix_dir/npm-deps.sha"

# Known-bad value used to force a fixed-output derivation to actually
# rebuild. See the drift handling in the loop below.
sentinel="sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

if $use_docker; then
  require_cmds docker git ssh-keyscan
else
  require_cmds nix git ssh-keyscan
fi

: "${SSH_AUTH_SOCK:?SSH_AUTH_SOCK not set; start ssh-agent and ssh-add your key}"
if $use_docker && [ "$(uname)" = "Darwin" ]; then
  SSH_AUTH_SOCK=/run/host-services/ssh-auth.sock
fi

resolve_source_url "$deploy_ref"

# No VM target here, so no host key to pin — just github.com.
setup_nix_env
build_log=$(mktemp)
trap 'rm -f "$build_log"; cleanup_nix_env' EXIT

echo "==> refreshing hash pins against ref=$qualified_ref"

max_attempts=6
for attempt in $(seq 1 "$max_attempts"); do
  echo "    attempt $attempt/$max_attempts — building…"
  : > "$build_log"

  run_nix build \
    --no-link --print-out-paths -L \
    --override-input "$source_input" "$source_url" \
    ".#nixosConfigurations.${flake_target}.config.system.build.toplevel" \
    > "$build_log" 2>&1 || true
  output=$(<"$build_log")

  # ── Drift case 1: composer ────────────────────────────────────────
  # A fixed-output derivation is addressed by its OUTPUT hash, so if the
  # pin still points at an existing store path, Nix reuses it and never
  # rebuilds — even though composer.lock changed. No "hash mismatch"
  # ever fires. Instead buildComposerProject's own validator compares
  # the lock against the snapshot baked into the vendor FOD and fails
  # with a different message. Bust the pin with a sentinel so the next
  # iteration produces a real, parseable mismatch.
  if echo "$output" | grep -qE 'vendorHash is out of date|composer\.lock is not the same'; then
    echo "    composer vendor pin stale (composer.lock drift) — invalidating."
    printf '%s' "$sentinel" > "$composer_hash_file"
    continue
  fi

  # ── Drift case 2: npm ─────────────────────────────────────────────
  # Same root cause, different symptom. `npm ci` runs offline against
  # the cache in the npmDeps FOD; when package-lock.json adds a package
  # the reused cache simply doesn't have its tarball, and npm fails with
  # ENOTCACHED rather than anything hash-shaped.
  if echo "$output" | grep -qE 'ENOTCACHED|npmDepsHash|Cannot read properties of undefined.*resolved|npm error code E404'; then
    echo "    npm deps pin stale (package-lock.json drift) — invalidating."
    printf '%s' "$sentinel" > "$npm_hash_file"
    continue
  fi

  if ! echo "$output" | grep -qE 'hash mismatch in fixed-output derivation'; then
    if echo "$output" | grep -qE '^error:'; then
      echo "build failed without a hash mismatch — dumping output:" >&2
      echo "$output" >&2
      exit 1
    fi
    echo "==> hashes up to date."
    break
  fi

  # Pull the drv path from the SAME line that announced the mismatch,
  # not the first /nix/store/*.drv anywhere in the log — nix prints many
  # unrelated .drv references during a build.
  mismatch_drv=$(echo "$output" | grep -m1 'hash mismatch in fixed-output derivation' | grep -oE "/nix/store/[^']+\.drv" || true)
  got=$(echo "$output" | grep -m1 -oE 'got:[[:space:]]+sha256-[A-Za-z0-9+/=]+' | awk '{print $2}' || true)

  if [ -z "$got" ] || [ -z "$mismatch_drv" ]; then
    echo "couldn't parse the hash mismatch from the build output:" >&2
    echo "$output" >&2
    exit 1
  fi

  case "$mismatch_drv" in
    *fisioweb-app-vendor*.drv)
      echo "    composer vendor hash: $got"
      printf '%s' "$got" > "$composer_hash_file"
      ;;
    *fisioweb-app-npm-deps*.drv)
      echo "    npm deps hash: $got"
      printf '%s' "$got" > "$npm_hash_file"
      ;;
    *)
      echo "unrecognized fixed-output derivation in mismatch: $mismatch_drv" >&2
      echo "If a derivation was renamed, update the case patterns above." >&2
      exit 1
      ;;
  esac

  if [ "$attempt" -eq "$max_attempts" ]; then
    echo "exceeded $max_attempts refresh attempts — bailing." >&2
    exit 1
  fi
done

echo "==> done. Review and commit:"
git -C "$repo_root" diff --stat -- infra/nix/composer-vendor.sha infra/nix/npm-deps.sha || true
