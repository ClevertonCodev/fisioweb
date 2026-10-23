#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MOCK_AGY="$ROOT/tests/bin/fixtures/mock-agy.sh"
TASK="$ROOT/bin/agy-task"
JOBS="$ROOT/.ai-workbench/_agy-jobs-test-$$"
JOB_DIR="$JOBS/testjob-$$"

mkdir -p "$JOB_DIR"
trap 'rm -rf "$JOBS"' EXIT

cat >"$JOB_DIR/meta.json" <<EOF
{
  "id": "testjob-$$",
  "task_file": "t.md",
  "model": "claude-opus-5-5-high",
  "status": "completed",
  "fix_rounds": 0,
  "max_fix_rounds": 3,
  "job_dir": "$JOB_DIR"
}
EOF

cat >"$JOB_DIR/review.json" <<'EOF'
{"verdict": "fail", "findings": [{"severity": "medium", "title": "x"}]}
EOF

echo "context" >"$JOB_DIR/agy-context.md"
: >"$JOB_DIR/agy.log"

export AGY_CMD="$MOCK_AGY"
export AGY_TASK_DRY_RUN=0
export AGY_TASK_SKIP_DOCTOR=1

# mock-agy increments counter file
export MOCK_AGY_COUNTER="$JOB_DIR/mock-count"

for i in 1 2 3; do
    "$TASK" fix-loop "$JOB_DIR" || true
done

count="$(cat "$MOCK_AGY_COUNTER" 2>/dev/null || echo 0)"
if [ "$count" -ne 3 ]; then
    echo "FALHOU: esperava 3 chamadas ao mock agy, obteve $count" >&2
    exit 1
fi

if "$TASK" fix-loop "$JOB_DIR"; then
    echo "FALHOU: 4ª fix-loop deveria falhar" >&2
    exit 1
fi

echo "OK: agy-task-fix-loop_test.sh"
