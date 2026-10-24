#!/usr/bin/env bash
# Smoke HTTP do cadastro/edição/foto. Tokens saem como [removido].
set -euo pipefail

BASE="${APP_URL:-http://localhost:8000}"
OUT_001=".ai-workbench/008-clinic-paciente-form-ds/evidence/001-cadastro-vira-tela-real/backend"
OUT_002=".ai-workbench/008-clinic-paciente-form-ds/evidence/002-edicao-vira-tela-real/backend"
OUT_003=".ai-workbench/008-clinic-paciente-form-ds/evidence/003-permissoes-isolamento-foto/backend"
mkdir -p "$OUT_001" "$OUT_002" "$OUT_003"

login() {
  local email="$1"
  curl -sS -X POST "$BASE/api/clinic/auth/login" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"12345678\"}"
}

redact() {
  perl -pe 's/(Authorization:\s*Bearer)\s+\S+/$1 [removido]/gi; s/("access_token"\s*:\s*")[^"]+"/$1[removido]"/g; s/("token"\s*:\s*")[^"]+"/$1[removido]"/g'
}

save() {
  local file="$1"
  redact > "$file"
}

TOKEN_A=$(login 'clevertonsantoscodev@gmail.com' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("access_token") or d.get("token") or d["data"]["access_token"])')
TOKEN_B=$(login 'start@fisioweb.local' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("access_token") or d.get("token") or d["data"]["access_token"])')

STAMP=$(date +%s)
EMAIL="qa.form.backend.${STAMP}@fisioweb.test"
CPF=$(python3 - <<'PY'
import random
n = [random.randint(0, 9) for _ in range(9)]
def d(ns, w):
    s = sum(a * b for a, b in zip(ns, w))
    r = (s * 10) % 11
    return 0 if r == 10 else r
n.append(d(n, range(10, 1, -1)))
n.append(d(n, range(11, 1, -1)))
print(''.join(map(str, n)))
PY
)

# store na Cleverton
{
  echo "### POST /api/clinic/patients (Cleverton)"
  curl -sv -X POST "$BASE/api/clinic/patients" \
    -H "Authorization: Bearer ${TOKEN_A}" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"QA Form Backend ${STAMP}\",\"email\":\"${EMAIL}\",\"cpf\":\"${CPF}\",\"phone\":\"21987654321\",\"birth_date\":\"1990-07-20\",\"is_foreign\":false,\"status\":\"em_tratamento\"}" \
    2>&1
} | save "$OUT_001/store-cleverton.txt"

ID=$(python3 - <<PY
import json, pathlib
for line in pathlib.Path("$OUT_001/store-cleverton.txt").read_text().splitlines():
    line = line.strip()
    if line.startswith('{') and '"data"' in line:
        print(json.loads(line)['data']['id'])
        break
else:
    raise SystemExit('nao achei o id no store')
PY
)

# show propria
{
  echo "### GET /api/clinic/patients/${ID} (Cleverton)"
  curl -sv "$BASE/api/clinic/patients/${ID}" \
    -H "Authorization: Bearer ${TOKEN_A}" \
    -H 'Accept: application/json' \
    2>&1
} | save "$OUT_001/show-cleverton.txt"

# Start nao ve
{
  echo "### GET /api/clinic/patients/${ID} (Start, isolamento)"
  curl -sv "$BASE/api/clinic/patients/${ID}" \
    -H "Authorization: Bearer ${TOKEN_B}" \
    -H 'Accept: application/json' \
    2>&1
} | save "$OUT_001/show-start-404.txt"

# update propria
{
  echo "### PUT /api/clinic/patients/${ID} (Cleverton)"
  curl -sv -X PUT "$BASE/api/clinic/patients/${ID}" \
    -H "Authorization: Bearer ${TOKEN_A}" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"QA Form Backend ${STAMP}\",\"email\":\"${EMAIL}\",\"cpf\":\"${CPF}\",\"phone\":\"21987654321\",\"birth_date\":\"1990-07-20\",\"is_foreign\":false,\"status\":\"alta\",\"apelido\":\"QA PUT\"}" \
    2>&1
} | save "$OUT_002/update-cleverton.txt"

# Start nao altera
{
  echo "### PUT /api/clinic/patients/${ID} (Start, isolamento)"
  curl -sv -X PUT "$BASE/api/clinic/patients/${ID}" \
    -H "Authorization: Bearer ${TOKEN_B}" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"Nao deveria\",\"email\":\"${EMAIL}\",\"cpf\":\"${CPF}\",\"phone\":\"21987654321\",\"birth_date\":\"1990-07-20\",\"is_foreign\":false,\"status\":\"alta\"}" \
    2>&1
} | save "$OUT_002/update-start-404.txt"

# foto propria (pode falhar se R2 local nao estiver no ar)
{
  echo "### POST /api/clinic/patients/${ID}/photo (Cleverton)"
  curl -sv -X POST "$BASE/api/clinic/patients/${ID}/photo" \
    -H "Authorization: Bearer ${TOKEN_A}" \
    -H 'Accept: application/json' \
    -F "photo=@.ai-workbench/008-clinic-paciente-form-ds/smoke/foto.png;type=image/png" \
    2>&1
} | save "$OUT_003/upload-photo-cleverton.txt"

# Start nao envia foto do paciente da Cleverton
{
  echo "### POST /api/clinic/patients/${ID}/photo (Start, isolamento)"
  curl -sv -X POST "$BASE/api/clinic/patients/${ID}/photo" \
    -H "Authorization: Bearer ${TOKEN_B}" \
    -H 'Accept: application/json' \
    -F "photo=@.ai-workbench/008-clinic-paciente-form-ds/smoke/foto.png;type=image/png" \
    2>&1
} | save "$OUT_003/upload-photo-start-404.txt"

# id de um paciente da Start
START_ID=$(curl -sS "$BASE/api/clinic/patients?search=Paciente%20Start" \
  -H "Authorization: Bearer ${TOKEN_B}" \
  -H 'Accept: application/json' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["data"]["data"][0]["id"])')

{
  echo "### POST /api/clinic/patients/${START_ID}/photo (Cleverton no paciente da Start)"
  curl -sv -X POST "$BASE/api/clinic/patients/${START_ID}/photo" \
    -H "Authorization: Bearer ${TOKEN_A}" \
    -H 'Accept: application/json' \
    -F "photo=@.ai-workbench/008-clinic-paciente-form-ds/smoke/foto.png;type=image/png" \
    2>&1
} | save "$OUT_003/upload-photo-cleverton-no-start-404.txt"

echo "OK id=${ID} start_id=${START_ID}"
