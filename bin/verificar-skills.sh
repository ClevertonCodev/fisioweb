#!/usr/bin/env bash
# Confere que .claude/skills/, .cursor/skills/ e .agents/skills/ (Antigravity) têm o
# mesmo conteúdo (as três são canônicas).
# Uso: bash bin/verificar-skills.sh
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CLAUDE="$ROOT/.claude/skills"
CURSOR="$ROOT/.cursor/skills"
AGENTS="$ROOT/.agents/skills"
FAILED=0

for tree in "$CLAUDE" "$CURSOR" "$AGENTS"; do
    if [ ! -d "$tree" ]; then
        echo "FALHOU: pasta não encontrada: $tree" >&2
        exit 2
    fi
    while IFS= read -r link; do
        echo "FALHOU: symlink em $tree: $link (seta ↗ no Cursor = atalho no disco)" >&2
        FAILED=1
    done < <(find "$tree" -type l 2>/dev/null || true)
done

for tree in "$CURSOR" "$AGENTS"; do
    DIFF_OUT="$(diff -rq "$CLAUDE" "$tree" 2>/dev/null | grep -v '\.DS_Store' || true)"
    if [ -n "$DIFF_OUT" ]; then
        echo "FALHOU: .claude/skills e ${tree#"$ROOT"/} divergem:" >&2
        echo "$DIFF_OUT" >&2
        FAILED=1
    fi
done

if [ "$FAILED" -ne 0 ]; then
    echo >&2
    echo "Corrija:" >&2
    echo "  - Symlinks: bash bin/materializar-skills.sh (e recarregue a janela do Cursor)." >&2
    echo "  - Conteúdo diferente: mesma mudança em .claude/skills/<nome>/, .cursor/skills/<nome>/ e .agents/skills/<nome>/." >&2
    exit 1
fi

echo "OK: .claude/skills, .cursor/skills e .agents/skills estão alinhadas ($(find "$CLAUDE" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ') skills)."
