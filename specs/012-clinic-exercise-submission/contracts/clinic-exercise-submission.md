# Contract: Clinic Exercise Submission (guard `clinic`)

Prefixo: `clinic/` · Middleware: `auth:clinic`, `clinic.guard`. Envelope de resposta: `{ "data": ... }`.
Autorização: apenas **admin da clínica** (`ClinicUser::isAdmin()`) — caso contrário `403`.

## Fluxo de upload (reutiliza módulo Media, já existente)

1. `POST clinic/media/videos/presigned-upload-request` → URL presigned + `video_id` (status `pending`).
2. Cliente faz `PUT` do arquivo no R2.
3. (opcional) `POST clinic/media/videos/{video}/presigned-thumbnail-request` + PUT.
4. `POST clinic/media/videos/{video}/confirm-upload` → `video` com `status = completed`.

## POST `clinic/exercises` — submeter exercício

Cria um exercício vinculado à clínica com `review_status = pending`.

Request body:
```json
{
  "name": "Ponte Glútea",
  "physio_area_id": 3,
  "difficulty_level": "easy",
  "description": "Fortalecimento de glúteos...",
  "video_id": 42
}
```

Validação (`SubmitExerciseRequest`):
- `name`: required|string|max:255
- `physio_area_id`: required|integer|exists:admin_physio_areas,id
- `difficulty_level`: required|in:easy,medium,hard
- `description`: nullable|string
- `video_id`: required|integer|exists:media_videos,id (vídeo deve estar `completed`)

Respostas:
- `201` → `{ "data": { exercício criado com review_status: "pending", is_own_submission: true } }`
- `403` → usuário não é admin da clínica
- `422` → validação (inclui `video_id` inexistente/não confirmado)

## GET `clinic/exercises` — biblioteca (ALTERADO)

Aplica escopo de visibilidade no backend: `review_status = 'approved' OR clinic_id = <clínica atual>`.

Cada item passa a incluir:
```json
{
  "id": 10,
  "name": "...",
  "difficulty_level": "easy",
  "physio_area": { "id": 3, "name": "Traumato-Ortopédica" },
  "review_status": "pending",
  "is_own_submission": true,
  "is_favorite": false,
  "videos": [ ... ]
}
```

Regras:
- Exercícios `pending`/`rejected` de outras clínicas: **nunca** retornados (SC-002).
- `is_own_submission = true` + `review_status != approved` → FE exibe badge "disponível apenas para a clínica que enviou" (FR-010a).
