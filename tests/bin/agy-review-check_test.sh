#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CHECK="$ROOT/bin/agy-review-check.py"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass_json="$TMP/pass.json"
fail_json="$TMP/fail.json"

cat >"$pass_json" <<'EOF'
{"verdict": "pass", "findings": [{"severity": "low", "title": "nit"}]}
EOF

cat >"$fail_json" <<'EOF'
{"verdict": "fail", "findings": [{"severity": "high", "title": "bug"}]}
EOF

python3 "$CHECK" "$pass_json" || exit 1
if python3 "$CHECK" "$fail_json"; then
    echo "FALHOU: deveria falhar com high" >&2
    exit 1
fi

echo "OK: agy-review-check_test.sh"
