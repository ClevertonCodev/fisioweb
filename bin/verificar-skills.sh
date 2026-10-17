#!/usr/bin/env bash
# Confere que .claude/skills/ e .cursor/skills/ têm o mesmo conteúdo (ambas canônicas).
# Uso: bash bin/verificar-skills.sh
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CLAUDE="$ROOT/.claude/skills"
CURSOR="$ROOT/.cursor/skills"
FAILED=0

for tree in "$CLAUDE" "$CURSOR"; do
    if [ ! -d "$tree" ]; then
        echo "FALHOU: pasta não encontrada: $tree" >&2
        exit 2
    fi
    while IFS= read -r link; do
        echo "FALHOU: symlink em $tree: $link (seta ↗ no Cursor = atalho no disco)" >&2
        FAILED=1
    done < <(find "$tree" -type l 2>/dev/null || true)
done

DIFF_OUT="$(diff -rq "$CLAUDE" "$CURSOR" 2>/dev/null | grep -v '\.DS_Store' || true)"
if [ -n "$DIFF_OUT" ]; then
    echo "FALHOU: .claude/skills e .cursor/skills divergem:" >&2
    echo "$DIFF_OUT" >&2
    FAILED=1
fi

if [ "$FAILED" -ne 0 ]; then
    echo >&2
    echo "Corrija:" >&2
    echo "  - Symlinks: bash bin/materializar-skills.sh (e recarregue a janela do Cursor)." >&2
    echo "  - Conteúdo diferente: mesma mudança em .claude/skills/<nome>/ e .cursor/skills/<nome>/." >&2
    exit 1
fi

echo "OK: .claude/skills e .cursor/skills estão alinhadas ($(find "$CLAUDE" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ') skills)."
