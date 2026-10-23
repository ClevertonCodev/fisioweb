#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PACK="$ROOT/bin/agy-context-pack"
CORE="$ROOT/docs/ai-harness/agy-context-core.md"
TASK="$ROOT/.ai-workbench/009-agy-task-harness/tasks/002-agy-context-pack-e-manifest.md"
OUT="$(mktemp -d)"

cleanup() {
    rm -rf "$OUT"
}
trap cleanup EXIT

if [ ! -x "$PACK" ]; then
    echo "FALHOU: bin/agy-context-pack não é executável" >&2
    exit 1
fi

if ! grep -q 'clinic_id' "$CORE"; then
    echo "FALHOU: agy-context-core.md deve mencionar clinic_id" >&2
    exit 1
fi

if ! grep -qi 'apiClient' "$CORE"; then
    echo "FALHOU: agy-context-core.md deve mencionar apiClient" >&2
    exit 1
fi

"$PACK" --task "$TASK" --out-dir "$OUT"
OUT_FILE="$OUT/agy-context.md"

if [ ! -f "$OUT_FILE" ]; then
    echo "FALHOU: agy-context.md não foi gerado" >&2
    exit 1
fi

if ! grep -q 'clinic_id' "$OUT_FILE"; then
    echo "FALHOU: pacote gerado sem clinic_id" >&2
    exit 1
fi

if ! grep -qi 'apiClient' "$OUT_FILE"; then
    echo "FALHOU: pacote gerado sem apiClient" >&2
    exit 1
fi

if ! grep -q '# AGENTS.md' "$OUT_FILE" && ! grep -q 'AGENTS.md' "$OUT_FILE"; then
    echo "FALHOU: pacote gerado sem seção AGENTS" >&2
    exit 1
fi

if ! grep -q '### Skill:' "$OUT_FILE"; then
    echo "FALHOU: pacote gerado sem skill anexada" >&2
    exit 1
fi

echo "OK: agy-context-pack_test.sh"
