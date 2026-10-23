#!/usr/bin/env bash
# Mock do agy para testes (incrementa contador).
set -euo pipefail
if [ -n "${MOCK_AGY_COUNTER:-}" ]; then
    n=0
    [ -f "$MOCK_AGY_COUNTER" ] && n="$(cat "$MOCK_AGY_COUNTER")"
    echo $((n + 1)) >"$MOCK_AGY_COUNTER"
fi
echo "mock-agy ok"
exit 0
