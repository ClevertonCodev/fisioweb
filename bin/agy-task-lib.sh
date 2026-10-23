# Funções compartilhadas do harness agy-task (source por bin/agy-task).
agy_task_root() {
    git rev-parse --show-toplevel 2>/dev/null
}

agy_task_jobs_root() {
    local root
    root="$(agy_task_root)" || return 1
    echo "$root/.ai-workbench/_agy-jobs"
}

agy_task_new_id() {
    date '+%Y%m%d-%H%M%S'
}

agy_task_resolve_job_dir() {
    local ref="${1:-}"
    local jobs_root
    jobs_root="$(agy_task_jobs_root)" || return 1

    if [ -z "$ref" ]; then
        if [ -L "$jobs_root/latest" ]; then
            readlink "$jobs_root/latest"
            return 0
        fi
        echo "FALHOU: informe o job-id ou crie um job com start." >&2
        return 1
    fi

    if [ -d "$ref" ] && [ -f "$ref/meta.json" ]; then
        echo "$ref"
        return 0
    fi

    local match
    match="$(find "$jobs_root" -maxdepth 1 -type d -name "${ref}*" 2>/dev/null | head -n 1)"
    if [ -n "$match" ] && [ -f "$match/meta.json" ]; then
        echo "$match"
        return 0
    fi

    echo "FALHOU: job não encontrado: $ref" >&2
    return 1
}

agy_task_meta_get() {
    local job_dir="$1"
    local key="$2"
    python3 - "$job_dir/meta.json" "$key" <<'PY'
import json
import sys
from pathlib import Path

data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
key = sys.argv[2]
val = data.get(key)
if val is None:
    print("")
elif isinstance(val, (dict, list)):
    print(json.dumps(val))
else:
    print(val)
PY
}

agy_task_meta_set() {
    local job_dir="$1"
    python3 - "$job_dir/meta.json" "$2" "$3" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
key, raw = sys.argv[2], sys.argv[3]
data = json.loads(path.read_text(encoding="utf-8"))
if raw == "true":
    data[key] = True
elif raw == "false":
    data[key] = False
elif raw.isdigit():
    data[key] = int(raw)
else:
    try:
        data[key] = json.loads(raw)
    except json.JSONDecodeError:
        data[key] = raw
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY
}

agy_task_agy_bin() {
    if [ -n "${AGY_CMD:-}" ]; then
        echo "$AGY_CMD"
        return 0
    fi
    command -v agy
}
