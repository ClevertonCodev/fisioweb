# Contract: Admin Exercise Review (guard `admin`)

Prefixo: `admin/` · Middleware: `auth:admin`. Envelope: `{ "data": ... }`.
Autorização: `ExercisePolicy` — apenas guard `admin` pode `approve`/`reject` (FR-012).

## GET `admin/exercises/pending-count` — contador para o dashboard

Resposta:
```json
{ "data": { "pending_count": 4 } }
```
Usado pelo `AdminDashboardPage` para exibir "N exercícios a revisar" (FR-007, SC-004).
Pode ser incorporado ao payload do `DashboardController` existente em vez de rota dedicada.

## GET `admin/exercises?review_status=pending` — lista de pendentes

Reutiliza `admin/exercises` (index) com filtro `review_status`. Cada item inclui a clínica de origem, `submitted_by_clinic_user`, vídeo e metadados para revisão (FR-008).

Adicionar suporte ao filtro `review_status` (`pending|approved|rejected`) no `ExerciseRepository::paginate`.

## PUT `admin/exercises/{id}/approve` — aprovar

Efeito: `review_status = approved`, grava `reviewed_by = <admin>`, `reviewed_at = now()`.
Resultado: exercício passa a ser visível para todas as clínicas (FR-009, SC-003).

Respostas:
- `200` → `{ "data": { exercício com review_status: "approved" } }`
- `403` → não-admin
- `404` → exercício inexistente
- `409` (opcional) → já aprovado

## PUT `admin/exercises/{id}/reject` — rejeitar

Efeito: `review_status = rejected`, grava `reviewed_by`, `reviewed_at`.
Resultado: permanece visível só para a clínica de origem; card mostra badge (FR-010, FR-010a).
Motivo **não** é obrigatório (clarificação Q3). `ReviewExerciseRequest` pode aceitar `reason` opcional para rastreabilidade futura.

Respostas:
- `200` → `{ "data": { exercício com review_status: "rejected" } }`
- `403` / `404` conforme acima

## Rotas (adicionar em `modules/Admin/routes/admin.php`, grupo `exercises`)

```
GET  exercises/pending-count      → ExerciseReviewController@pendingCount
PUT  exercises/{id}/approve       → ExerciseReviewController@approve
PUT  exercises/{id}/reject        → ExerciseReviewController@reject
```
(o `GET exercises` com filtro `review_status` reusa o controller/rota index existente)
