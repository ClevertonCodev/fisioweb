#!/usr/bin/env bash
# Testa bin/agy-task doctor (sem depender de agy instalado no PATH global do CI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
AGY_TASK="$ROOT/bin/agy-task"

if [ ! -x "$AGY_TASK" ]; then
    echo "FALHOU: bin/agy-task não existe ou não é executável" >&2
    exit 1
fi

# Sem agy no PATH: deve falhar com mensagem acionável.
doctor_out=""
doctor_code=0
doctor_out="$(PATH="/usr/bin:/bin" "$AGY_TASK" doctor 2>&1)" || doctor_code=$?

if ! echo "$doctor_out" | grep -qi 'agy'; then
    echo "FALHOU: doctor sem agy no PATH deveria mencionar agy" >&2
    echo "$doctor_out" >&2
    exit 1
fi

if [ "$doctor_code" -eq 0 ]; then
    echo "FALHOU: doctor sem agy no PATH deveria sair com código != 0" >&2
    exit 1
fi

echo "OK: agy-task-doctor_test.sh"
