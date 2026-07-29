#!/usr/bin/env bash
# common.sh — shared helpers for the infra/nix scripts.
#
# Sourced, never executed. Factored out so the ref-resolution and
# secret-writing rules live in exactly one place instead of being
# duplicated across deploy.sh / install.sh / refresh-hashes.sh.

# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------

infra_nix_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$infra_nix_dir/../.." && pwd)"
tofu_dir="$repo_root/infra/tofu"
secrets_dir="$repo_root/secrets"

# The flake output and the git repo the app source is fetched from.
flake_target="fisioweb-app"
source_input="fisiowebSource"
source_base="git+ssh://git@github.com/ClevertonCodev/fisioweb"

# ---------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------

require_cmds() {
  local missing=()
  for cmd in "$@"; do
    command -v "$cmd" >/dev/null || missing+=("$cmd")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    echo "missing on PATH: ${missing[*]}" >&2
    echo "run \`mise install\` in the repo root, or install them by hand." >&2
    exit 1
  fi
}

# Decrypt the operator credentials the way infra/tofu/.envrc does.
# direnv hooks don't fire inside script subshells, so every entry point
# has to do this itself before calling `tofu output`.
#
# Uses sops's default age key discovery (~/.config/sops/age/keys.txt);
# SOPS_AGE_KEY_FILE or SOPS_AGE_KEY override it if yours lives
# elsewhere.
load_tofu_env() {
  if [ -f "$secrets_dir/operator/tfstate-passphrase" ]; then
    TF_VAR_state_passphrase="$(sops -d "$secrets_dir/operator/tfstate-passphrase")"
    export TF_VAR_state_passphrase
  fi
  if [ -f "$tofu_dir/credentials.env" ]; then
    set -a
    # shellcheck disable=SC1090
    source <(sops -d "$tofu_dir/credentials.env")
    set +a
  fi
}

# ---------------------------------------------------------------------
# Target host resolution
# ---------------------------------------------------------------------

# Path to the generated IP cache. Written by sync_tofu_state() from the
# tofu output, committed to git, never hand-edited.
target_ip_file="$infra_nix_dir/target-ip"

# Resolve the deploy target IP, cheapest source first:
#   1. explicit argument
#   2. infra/nix/target-ip (plaintext, no decryption or network — the
#      fast path, and the only one that works offline)
#   3. `tofu output -raw app_floating_ipv4` (authoritative, but needs
#      the state passphrase and a round-trip to R2)
#
# Source 2 is a generated cache, so it's allowed to be missing (before
# the first sync); falling through to tofu always yields truth. It can't
# meaningfully go stale — every deploy rewrites it, and the address only
# changes if someone destroys the floating IP, which is delete-protected.
resolve_ip() {
  local explicit="${1:-}"
  if [ -n "$explicit" ]; then
    echo "$explicit"
    return
  fi

  if [ -s "$target_ip_file" ]; then
    local cached
    cached=$(tr -d '[:space:]' < "$target_ip_file")
    if [ -n "$cached" ]; then
      echo "$cached"
      return
    fi
  fi

  local from_tofu
  from_tofu=$(tofu -chdir="$tofu_dir" output -raw app_floating_ipv4 2>/dev/null || true)
  if [ -z "$from_tofu" ]; then
    echo "could not resolve the target IP." >&2
    echo "Has \`tofu apply\` run yet? Otherwise pass the IP explicitly." >&2
    exit 1
  fi
  echo "$from_tofu"
}

# ---------------------------------------------------------------------
# Git ref → Nix flake URL
# ---------------------------------------------------------------------

# Nix's git fetcher resolves a bare `?ref=X` as `refs/heads/X` — a
# branch. Tags need the fully-qualified `refs/tags/X`.
#
# A raw commit sha can NOT be passed as `ref` at all: Nix would look for
# refs/heads/<sha> and die with "couldn't find remote ref". It has to
# travel as `rev`, paired with a `ref` that contains it, and WITHOUT
# shallow=1 — a depth-1 clone only carries the tip, so any older rev
# would be missing from the fetched history.
#
# shallow=1 elsewhere cuts the source fetch to whatever the working tree
# weighs instead of the full history.
#
# Sets: source_url, qualified_ref
resolve_source_url() {
  local ref="$1"

  if git -C "$repo_root" show-ref --verify --quiet "refs/tags/$ref"; then
    qualified_ref="refs/tags/$ref"
    source_url="${source_base}?ref=${qualified_ref}&shallow=1"
  elif git -C "$repo_root" show-ref --verify --quiet "refs/heads/$ref"; then
    qualified_ref="refs/heads/$ref"
    source_url="${source_base}?ref=${qualified_ref}&shallow=1"
  elif rev=$(git -C "$repo_root" rev-parse --verify --quiet "${ref}^{commit}"); then
    # Nix needs a fetchable ref before it can check out a rev. Any
    # origin branch containing the commit will do. grep -v HEAD drops
    # refs/remotes/origin/HEAD, a symref Nix can't fetch by name.
    local branch
    branch=$(git -C "$repo_root" for-each-ref --format='%(refname:strip=3)' \
               --contains "$rev" 'refs/remotes/origin/*' \
             | grep -v '^HEAD$' | head -1)
    [ -n "$branch" ] || {
      echo "commit $ref is not on any origin/* branch — push it first" >&2
      exit 1
    }
    qualified_ref="${rev} (on origin/${branch})"
    source_url="${source_base}?ref=refs/heads/${branch}&rev=${rev}"
  else
    echo "unknown git ref: $ref" >&2
    echo "Fetch first (\`git fetch --all --tags\`) if it exists upstream." >&2
    exit 1
  fi
}

# ---------------------------------------------------------------------
# Nix invocation — Docker harness or native
# ---------------------------------------------------------------------
#
# Two ways to run nix:
#   - Docker (default): the operator's laptop needs no Nix installation.
#     A named volume persists /nix between runs so the store isn't
#     re-downloaded every time.
#   - Native (--no-docker): for operators who already run NixOS or have
#     Nix installed. Skips the container entirely, which is noticeably
#     faster.

use_docker=true
docker_volume="fisioweb-nix-store"

# Populated by setup_nix_env; cleaned by its trap.
kh=""
gitconfig=""

# Builds the known_hosts + gitconfig temp files both modes need.
#   $1 (optional) — target IP to pin, alongside github.com
setup_nix_env() {
  local target_ip="${1:-}"

  kh=$(mktemp)
  gitconfig=$(mktemp)

  {
    # Pin the VM's host key so StrictHostKeyChecking=yes works without
    # an interactive prompt (and so a MITM can't silently intercept a
    # deploy). The pubkey is committed in keys.nix.
    if [ -n "$target_ip" ]; then
      local host_pub="${FISIOWEB_HOST_KEY:-$HOME/Sync/profile/.ssh/fisioweb-app-host}.pub"
      if [ -f "$host_pub" ]; then
        printf '%s %s\n' "$target_ip" "$(cat "$host_pub")"
      fi
    fi
    # github.com's current keys, so the in-container nix can fetch the
    # private source input without prompting. ssh-keyscan picks up
    # whatever is currently advertised, so rotations Just Work.
    ssh-keyscan -t ed25519,ecdsa,rsa github.com 2>/dev/null
  } > "$kh"

  # Nix reads the local flake via libgit2, which enforces
  # CVE-2022-24765: it refuses to open a repo whose on-disk owner
  # differs from the runtime user. The container runs as root while
  # /work is bind-mounted with the operator's UID, so libgit2 bails with
  # "repository path '/work' is not owned by current user".
  cat > "$gitconfig" <<'EOF'
[safe]
	directory = *
EOF
}

cleanup_nix_env() {
  rm -f "$kh" "$gitconfig" 2>/dev/null || true
}

# Run `nix <args...>`, in Docker or natively depending on $use_docker.
run_nix() {
  if ! $use_docker; then
    GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=$kh -o StrictHostKeyChecking=yes" \
    NIX_SSHOPTS="-o UserKnownHostsFile=$kh -o StrictHostKeyChecking=yes" \
      nix --extra-experimental-features "nix-command flakes" "$@"
    return
  fi

  local docker_args=()
  [ -t 0 ] && docker_args+=(-it)

  # NIX_CONFIG (rather than --option flags) propagates to the nested
  # nix-build invocations that nixos-rebuild / nixos-anywhere spawn.
  # Without it those nested calls try to install a seccomp BPF filter
  # inside the container — we have seccomp=unconfined at the Docker
  # layer but no CAP_SYS_ADMIN to install nix's own filter — and fail
  # with "unable to load seccomp BPF program: Invalid argument".
  docker run --rm \
    --platform linux/amd64 \
    --security-opt seccomp=unconfined \
    -v "$repo_root:/work" -w /work \
    -v "${docker_volume}:/nix" \
    -v "${SSH_AUTH_SOCK}:/ssh-agent" \
    -v "$kh:/known_hosts:ro" \
    -v "$gitconfig:/root/.gitconfig:ro" \
    -e SSH_AUTH_SOCK=/ssh-agent \
    -e NIX_SSHOPTS="-o UserKnownHostsFile=/known_hosts -o StrictHostKeyChecking=yes" \
    -e GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/known_hosts -o StrictHostKeyChecking=yes" \
    -e NIX_CONFIG=$'experimental-features = nix-command flakes\nfilter-syscalls = false\nsandbox = false' \
    ${docker_args[@]+"${docker_args[@]}"} \
    nixos/nix \
    nix "$@"
}

# ---------------------------------------------------------------------
# Idempotent file writers
# ---------------------------------------------------------------------
#
# Each managed file is rewritten only when its desired content actually
# differs from what's there. For sops files we compare DECRYPTED
# plaintext: re-encrypting identical plaintext produces fresh ciphertext
# (random IV per encrypt), so a naive write would dirty the git tree on
# every single run.

# BSD realpath on macOS lacks --relative-to, and inputs are always
# inside $repo_root, so strip the prefix manually.
rel() { echo "${1#"$repo_root"/}"; }

write_if_changed_plain() {
  local target="$1" content="$2"
  if [ -f "$target" ] && [ "$(cat "$target")" = "$content" ]; then
    return
  fi
  printf '%s\n' "$content" > "$target"
  echo "    wrote $(rel "$target")"
}

write_if_changed_sops_binary() {
  local target="$1" content="$2"
  if [ -f "$target" ]; then
    local cur
    cur=$(sops -d --input-type binary --output-type binary "$target" 2>/dev/null || true)
    [ "$cur" = "$content" ] && return
  fi
  printf '%s' "$content" | sops -e \
    --input-type binary --output-type binary \
    --filename-override "$(rel "$target")" /dev/stdin > "$target"
  echo "    wrote $(rel "$target")"
}

write_if_changed_sops_dotenv() {
  local target="$1" content="$2"
  if [ -f "$target" ]; then
    local cur
    cur=$(sops -d --input-type dotenv --output-type dotenv "$target" 2>/dev/null || true)
    [ "$cur" = "$content" ] && return
  fi
  printf '%s\n' "$content" | sops -e \
    --input-type dotenv --output-type dotenv \
    --filename-override "$(rel "$target")" /dev/stdin > "$target"
  echo "    wrote $(rel "$target")"
}

# ---------------------------------------------------------------------
# Tofu → local files
# ---------------------------------------------------------------------
#
# Everything derived from cloud state lands here, so `tofu apply` never
# needs to be followed by hand-editing a config file. Shared by
# deploy.sh and install.sh.
sync_tofu_state() {
  echo "==> syncing tofu state..."

  # R2 credentials for the pg-backup unit. AWS_* come from
  # credentials.env (loaded by load_tofu_env); the account-ID URL is not
  # secret. Binary rather than dotenv because the NixOS module mounts
  # the decrypted file whole as systemd's EnvironmentFile=.
  #
  # Cloudflare account 7c45003b… — the same one holding the tofu state
  # bucket. See infra/tofu/r2.tf.
  local cf_account_id="7c45003b9de7c4655a880a0b02c0b2a0"
  write_if_changed_sops_binary "$secrets_dir/r2-backup-creds" "$(cat <<EOF
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:?need AWS_ACCESS_KEY_ID in env (sops infra/tofu/credentials.env)}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:?need AWS_SECRET_ACCESS_KEY in env}
AWS_ENDPOINT_URL_S3=https://${cf_account_id}.eu.r2.cloudflarestorage.com
AWS_DEFAULT_REGION=auto
EOF
)"

  # The app's public address.
  #
  # This is what removes the floating-IP chicken-and-egg: the IP is
  # created by tofu, so it can't be known when secrets/app.env is
  # written. Deriving it here means it lives in exactly ONE place (tofu
  # state) and flows to APP_URL, GOOGLE_REDIRECT_URI, floating-ip.nix
  # and the SSH target automatically.
  #
  # The laravel-env template appends this LAST, so it wins over any
  # APP_URL left in app.env.
  #
  # NOTE: Google rejects bare-IP redirect URIs, so the OAuth flow stays
  # broken until a domain exists. The value is still written so the
  # config is coherent and the fix is a one-line change here. See
  # infra/DOMINIO.md.
  local floating_ipv4
  floating_ipv4=$(tofu -chdir="$tofu_dir" output -raw app_floating_ipv4)

  # Plaintext cache of the address, so artisan.sh (and deploy.sh
  # --no-tofu-sync) can find the host without decrypting the state
  # passphrase and round-tripping to R2 — which also means they keep
  # working offline. Committed to git; regenerated here on every deploy,
  # so it is never hand-edited and cannot drift from tofu state.
  write_if_changed_plain "$target_ip_file" "$floating_ipv4"

  write_if_changed_sops_dotenv "$secrets_dir/app-url.env" "$(cat <<EOF
APP_URL=http://${floating_ipv4}
GOOGLE_REDIRECT_URI=http://${floating_ipv4}/api/clinic/google-calendar/callback
EOF
)"

  # Generated Nix module — fileSystems."/srv/data" pointing at the
  # current Hetzner volume device path.
  local device
  device=$(tofu -chdir="$tofu_dir" output -raw data_volume_device)
  write_if_changed_plain "$repo_root/infra/nix/modules/data-volume.nix" "\
# AUTO-GENERATED by infra/nix/deploy.sh from
#   tofu -chdir=infra/tofu output -raw data_volume_device
#
# Do not edit by hand — your changes will be overwritten on the next
# deploy. To change the volume, edit infra/tofu/volume.tf and apply.

{
  fileSystems.\"/srv/data\" = {
    device = \"$device\";
    fsType = \"ext4\";
  };
}"

  # Generated Nix module — binds the Floating IPv4 to the NIC. Hetzner
  # routes the address to the server, but the kernel still has to claim
  # it or nothing answers.
  write_if_changed_plain "$repo_root/infra/nix/modules/floating-ip.nix" "\
# AUTO-GENERATED by infra/nix/deploy.sh from
#   tofu -chdir=infra/tofu output -raw app_floating_ipv4
#
# Do not edit by hand — your changes will be overwritten on the next
# deploy.
#
# Binds the Hetzner Floating IPv4 as a secondary /32 on the public NIC
# after dhcpcd has configured the primary. \`ip addr replace\` is
# idempotent, so re-activation never trips on existing state.

{ pkgs, ... }:
{
  systemd.services.floating-ip = {
    description = \"Bind Hetzner Floating IPv4 as secondary on enp1s0\";
    after = [ \"network-online.target\" ];
    wants = [ \"network-online.target\" ];
    wantedBy = [ \"multi-user.target\" ];
    serviceConfig = {
      Type = \"oneshot\";
      RemainAfterExit = true;
      ExecStart = \"\${pkgs.iproute2}/bin/ip addr replace ${floating_ipv4}/32 dev enp1s0\";
    };
  };
}"
}
