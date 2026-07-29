#!/usr/bin/env bash
# artisan.sh — run a Laravel artisan command on the fisioweb-app VM as
# the `fisioweb` user.
#
# Resolves the active app store path on every invocation by walking the
# closure of /run/current-system, so it always targets whatever the last
# deploy shipped — no edits needed when the store hash advances.
#
# Args are %q-quoted before pass-through so quoting survives the SSH
# hop. ssh -t is enabled when stdin is a TTY, so `tinker` works.
#
# Usage:
#   ./infra/nix/artisan.sh [<ip>] <artisan args...>
# Examples:
#   ./infra/nix/artisan.sh migrate --force
#   ./infra/nix/artisan.sh migrate:status
#   ./infra/nix/artisan.sh cache:clear
#   ./infra/nix/artisan.sh queue:work --stop-when-empty
#   ./infra/nix/artisan.sh tinker
#   ./infra/nix/artisan.sh tinker --execute 'echo App\Models\User::count();'

set -euo pipefail

# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

# If the first positional looks like an IPv4, consume it as the target;
# otherwise everything is artisan args and the IP is resolved from
# tfvars. Lets you write `artisan.sh migrate --force` without pasting a
# host every time.
ip=""
if [[ "${1:-}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  ip="$1"
  shift
fi

[ $# -gt 0 ] || { echo "usage: artisan.sh [<ip>] <artisan args...>" >&2; exit 2; }

# resolve_ip falls back to `tofu output`, which needs the decrypted
# state passphrase and a network round-trip. Only pay for that when the
# generated cache is missing — otherwise this stays a plain SSH command
# that works offline.
if [ -z "$ip" ] && [ ! -s "$target_ip_file" ]; then
  load_tofu_env
fi
ip=$(resolve_ip "$ip")

args=$(printf '%q ' "$@")
ssh_flags=()
[ -t 0 ] && ssh_flags+=(-t)

operator="${FISIOWEB_OPERATOR:-${USER:?USER is unset; export FISIOWEB_OPERATOR explicitly}}"

# `bash -s` reads the script from stdin so the operator's login shell
# (fish/zsh/whatever) only ever sees a single command name and doesn't
# try to parse bash syntax. Without this, fish login shells choke on
# `set -euo pipefail`, $( … ), and friends.
exec ssh "${ssh_flags[@]}" "${operator}@${ip}" bash -s <<EOF
set -euo pipefail

# Resolve the active app store path via the system closure. Falls back
# to mtime ordering if nix-store isn't on PATH (shouldn't happen on
# NixOS, but cheap insurance).
app=\$(nix-store -q --requisites /run/current-system 2>/dev/null \\
        | grep -m1 -E '^/nix/store/[^/]+-fisioweb-app\$' \\
        || ls -dt /nix/store/*-fisioweb-app 2>/dev/null | head -1)
[ -n "\$app" ] || { echo 'no fisioweb-app derivation found on the VM' >&2; exit 1; }

# Resolve the php-with-extensions wrapper the same way. We can't rely on
# \$PATH: sudo -u fisioweb strips it, and the fisioweb system user has
# no shell profile.
php_wrapper=\$(nix-store -q --requisites /run/current-system 2>/dev/null \\
                | grep -m1 -E '^/nix/store/[^/]+-php-with-extensions-' \\
                || true)
[ -n "\$php_wrapper" ] || { echo 'no php-with-extensions in the system closure' >&2; exit 1; }

cd "\$app"
sudo -u fisioweb HOME=/tmp "\$php_wrapper/bin/php" artisan $args
EOF
