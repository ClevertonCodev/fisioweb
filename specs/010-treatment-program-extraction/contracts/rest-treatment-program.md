# REST Contract — Treatment Program (preservado, zero mudança)

Todos os paths, métodos, nomes de rota, request e response permanecem **idênticos**. Guard `auth:clinic` + `clinic.guard`, prefixo `clinic`. Após a extração, os controllers pertencem a `Modules\TreatmentProgram\Http\Controllers` e as rotas são registradas pelo `RouteServiceProvider` do `TreatmentProgram` (merge no mesmo grupo `clinic`).

## treatment-plans (`clinic.treatment-plans.*`)

| Método | Path | Nome | Controller@ação | Resposta |
|--------|------|------|-----------------|----------|
| GET | `/api/clinic/treatment-plans` | `.index` | `TreatmentPlanController@index` | `{ data: <paginator> }` |
| GET | `/api/clinic/treatment-plans/{id}/pdf` | `.pdf` | `@downloadPdf` | download PDF (blade `pdf.clinic.treatment.treatment-plan`) |
| GET | `/api/clinic/treatment-plans/{id}` | `.show` | `@show` | `{ data: <plan+relations> }` / 404 |
| POST | `/api/clinic/treatment-plans` | `.store` | `@store` | `{ data }` **201** |
| PUT | `/api/clinic/treatment-plans/{id}` | `.update` | `@update` | `{ data }` **200** / 404 |
| DELETE | `/api/clinic/treatment-plans/{id}` | `.destroy` | `@destroy` | `{ message }` / 404 / 403 (policy `delete`) |
| POST | `/api/clinic/treatment-plans/{id}/duplicate` | `.duplicate` | `@duplicate` | `{ data }` **201** / 404 |
| POST | `/api/clinic/treatment-plans/{id}/to-model` | `.to-model` | `@toModel` | `{ data }` **201** / 404 |

**Filtros do index** (preservados): `search`, `status`, `patient_id`, `physio_area_id`, `without_patient`, `per_page`.

**Request store/update** (preservado — ver `StoreTreatmentPlanRequest`/`UpdateTreatmentPlanRequest`): `title` (req), `patient_id` (`exists:patients,id`), `message` (max 600), `physio_area_id`/`physio_subarea_id` (exists admin), `start_date`/`end_date` (`after_or_equal`), `duration_minutes`, `status` (`Rule::in(STATUSES)`), `notes`, `groups[]{name,sort_order}`, `exercises[]{exercise_id(exists admin_exercises), group_index, days_of_week[], period(in PERIODS), sets_min/max, repetitions_min/max, load_min/max, rest_time, notes, sort_order}`.

**Isolamento**: `show/update/destroy/duplicate/toModel` retornam 404 `'Plano de tratamento não encontrado.'` se `plan.clinic_id !== auth.clinic_id`.

## program-drafts (`clinic.program-drafts.*`)

| Método | Path | Nome | Ação | Resposta |
|--------|------|------|------|----------|
| GET | `/api/clinic/program-drafts` | `.show` | `ProgramDraftController@show` | `{ data: draft_data|null }` |
| PUT | `/api/clinic/program-drafts` | `.upsert` | `@upsert` | `{ message: 'Rascunho salvo.' }` |
| DELETE | `/api/clinic/program-drafts` | `.destroy` | `@destroy` | `{ message: 'Rascunho descartado.' }` |

**Request upsert** (preservado): `step` (int in 1..4), `selectedIds` (array de string), `groups` (array), `savedAt` (int). Escopo por `clinic_user_id` do ator.

## programs (`clinic.programs.*`) — catálogo Admin (read-only)

| Método | Path | Nome | Ação | Resposta |
|--------|------|------|------|----------|
| GET | `/api/clinic/programs` | `clinic.programs.index` | `SharedProgramController@index` | paginator **direto** (sem envelope `data`) |
| GET | `/api/clinic/programs/{id}` | `clinic.programs.show` | `@show` | `{ data: <program+relations> }` / 404 |

**Filtros index** (preservados): `search`, `physio_area_id`, `per_page`. Só `is_active=true`. `show` carrega `physioArea, createdBy, groups.exercises.exercise.videos` + `withCount(exercises)`.

> ⚠️ Diferença de envelope proposital e preservada: `programs.index` retorna o paginador **direto** (`response()->json($programs)`), enquanto `programs.show` usa `{ data }`. Não alterar.

## Não muda

- Nenhum status HTTP, header, nome de campo, ordem de relação eager-loaded ou mensagem de erro.
- Blade de PDF permanece em `resources/views/pdf/clinic/treatment/treatment-plan.blade.php` (app-level).
