#!/usr/bin/env bash
# Troca symlinks em .cursor/skills e .claude/skills por pastas/arquivos reais.
# A seta ↗ no Explorer do Cursor/VS Code costuma ser symlink no disco (atalho antigo
# para a outra árvore), não o modelo "duas canônicas" do projeto.
#
# Uso: bash bin/materializar-skills.sh
# Depois: bash bin/verificar-skills.sh
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

materialize_tree() {
    local tree="$1"
    [ -d "$tree" ] || return 0

    while IFS= read -r link; do
        [ -L "$link" ] || continue
        parent="$(dirname "$link")"
        base="$(basename "$link")"
        target="$(readlink "$link")"
        if [ -z "$target" ]; then
            rm -f "$link"
            continue
        fi
        if [[ "$target" = /* ]]; then
            resolved="$target"
        else
            resolved="$parent/$target"
        fi
        if [ ! -e "$resolved" ]; then
            echo "Aviso: symlink órfão removido: $link" >&2
            rm -f "$link"
            continue
        fi
        echo "Materializando: $link"
        rm -f "$link"
        if [ -d "$resolved" ]; then
            cp -R "$resolved" "$parent/$base"
        else
            cp -f "$resolved" "$parent/$base"
        fi
    done < <(find "$tree" -type l 2>/dev/null | sort -r || true)
}

materialize_tree "$ROOT/.cursor/skills"
materialize_tree "$ROOT/.claude/skills"

if find "$ROOT/.cursor/skills" "$ROOT/.claude/skills" -type l -print -quit 2>/dev/null | grep -q .; then
    echo "FALHOU: ainda há symlinks." >&2
    find "$ROOT/.cursor/skills" "$ROOT/.claude/skills" -type l >&2
    exit 1
fi

echo "OK: symlinks substituídos por pastas reais. Rode: bash bin/verificar-skills.sh"
