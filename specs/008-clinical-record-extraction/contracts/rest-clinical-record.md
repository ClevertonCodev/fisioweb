# REST Contract — Clinical Record (PRESERVED, must not change)

Todos os paths, métodos, request shapes e response shapes são **idênticos aos atuais**. Apenas o owner dos controllers muda de `Modules\Clinic\Http\Controllers\*` para `Modules\ClinicalRecord\Http\Controllers\*`.

Grupo base: `prefix('api')` + `name('api.')` + `prefix('clinic')` + `middleware(['auth:clinic','clinic.guard'])`.

## Rotas nested em pacientes

Prefixo `patients`, name `clinic.patients.*`:

| Método | URI (full) | Route name | Controller |
|--------|-----------|------------|------------|
| GET | `api/clinic/patients/{patient}/assessments` | `api.clinic.patients.assessments.index` | `AssessmentController@indexByPatient` |
| POST | `api/clinic/patients/{patient}/assessments` | `api.clinic.patients.assessments.store` | `AssessmentController@storeForPatient` |
| GET | `api/clinic/patients/{patient}/evolutions` | `api.clinic.patients.evolutions.index` | `EvolutionController@indexByPatient` |
| POST | `api/clinic/patients/{patient}/evolutions` | `api.clinic.patients.evolutions.store` | `EvolutionController@storeForPatient` |
| GET | `api/clinic/patients/{patient}/files` | `api.clinic.patients.files.index` | `PatientFileController@index` |
| POST | `api/clinic/patients/{patient}/files` | `api.clinic.patients.files.store` | `PatientFileController@store` |
| DELETE | `api/clinic/patients/{patient}/files/{file}` | `api.clinic.patients.files.destroy` | `PatientFileController@destroy` |

## Assessments

Prefixo `assessments`, name `clinic.assessments.*`:

| Método | URI | Route name | Action |
|--------|-----|------------|--------|
| GET | `api/clinic/assessments/{id}` | `api.clinic.assessments.show` | show |
| PUT | `api/clinic/assessments/{id}` | `api.clinic.assessments.update` | update |
| POST | `api/clinic/assessments/{id}/sign` | `api.clinic.assessments.sign` | sign |
| DELETE | `api/clinic/assessments/{id}` | `api.clinic.assessments.destroy` | destroy |

**store request** (via patients): `admin_assessment_template_id`, `answers[]`, `answer_options[]` — validados contra template Admin via contrato público.

**Response**: `{ "data": Assessment with template, answers, patient, clinicUser }`.

## Evolutions

Prefixo `evolutions`, name `clinic.evolutions.*`:

| Método | URI | Route name | Action |
|--------|-----|------------|--------|
| GET | `api/clinic/evolutions/{id}` | `api.clinic.evolutions.show` | show |
| PUT | `api/clinic/evolutions/{id}` | `api.clinic.evolutions.update` | update |
| POST | `api/clinic/evolutions/{id}/generate-text` | `api.clinic.evolutions.generate-text` | generateText |
| POST | `api/clinic/evolutions/{id}/sign` | `api.clinic.evolutions.sign` | sign |
| GET | `api/clinic/evolutions/{id}/pdf` | `api.clinic.evolutions.pdf` | downloadPdf |
| DELETE | `api/clinic/evolutions/{id}` | `api.clinic.evolutions.destroy` | destroy |

**generate-text**: body `checked_item_ids`, `free_text_values` → `{ "data": { "generated_text": "..." } }` (sem persistência, sem evento).

**pdf**: download via `PdfGeneratorInterface`, view `pdf.clinic.evolution.evolution`.

## Evolution templates

Prefixo `evolution-templates`, name `clinic.evolution-templates.*`:

| Método | URI | Action |
|--------|-----|--------|
| GET/POST | `api/clinic/evolution-templates` | index, store |
| GET/PUT/DELETE | `api/clinic/evolution-templates/{id}` | show, update, destroy |

## Assessment templates (catálogo Admin)

| Método | URI | Route name | Controller |
|--------|-----|------------|------------|
| GET | `api/clinic/assessment-templates` | `api.clinic.assessment-templates.index` | `SharedAssessmentTemplateController@index` |
| GET | `api/clinic/assessment-templates/{id}` | `api.clinic.assessment-templates.show` | `SharedAssessmentTemplateController@show` |

Implementação consome `AssessmentTemplateReadServiceInterface` (Admin); paths e shapes inalterados.

## Contract test

`ClinicalRecordRouteCompatibilityTest` (Feature): URIs acima existem com métodos corretos; owners começam com `Modules\ClinicalRecord\Http\Controllers\`.

Nenhuma rota de prontuário em `modules/Clinic/routes/clinic.php` após extração.
