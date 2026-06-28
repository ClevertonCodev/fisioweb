# Phase 0 — Research: Clinical Record Extraction

## R1. Mecanismo de registro do módulo

- **Decision**: Criar `modules/ClinicalRecord/module.json` com provider `ClinicalRecordServiceProvider`; `"ClinicalRecord": true` em `modules_statuses.json`; `composer.json` com PSR-4; `composer dump-autoload`.
- **Rationale**: Padrão idêntico a `ClinicScheduling` / `ClinicFinance`.
- **Alternatives**: `bootstrap/providers.php` — proibido.

## R2. Relações Eloquent cross-module (ADR-008)

- **Decision**: Models de `ClinicalRecord` declaram `belongsTo`/`HasMany` cross-module com **FQN inline** (`\Modules\Patient\Models\Patient::class`, `\Modules\Clinic\Models\ClinicUser::class`). Sem `use Modules\...\Models\` no topo dos Models de produção quando apontam para outro módulo.
- **Rationale**: Clarificação 2026-06-27 + precedente `ClinicScheduling\Appointment`. Preserva `load(['patient','clinicUser','template'])` e shape JSON.
- **Alternatives**: DTO manual em todo response — quebra paridade; rejeitado.

## R3. FormRequests, Policies e Controllers

- **Decision**:
  - Policies: type-hint `$user` sem `ClinicUser` ou validar via guard (espelhar `AppointmentPolicy` / `FinancialTransactionPolicy` se boundary flaggar).
  - Controllers: padronizar validação de paciente via `PatientServiceInterface::find()` + `clinic_id` (como `EvolutionController`); remover route-model-binding `Patient $patient` de `PatientFileController`.
  - FormRequests: validação FK via `Rule::exists`; checagens multi-tenant via query builder/`DB::table` ou FQN inline.
- **Rationale**: `ModuleBoundaryTest` escaneia `use Modules\...\Models\` em produção de `ClinicalRecord`.
- **Alternatives**: Whitelist — rejeitado.

## R4. Contrato público Admin para templates de avaliação

- **Decision**: Criar `Modules\Admin\Contracts\Public\AssessmentTemplateReadServiceInterface` + `AssessmentTemplateReadService` no Admin. Métodos mínimos:
  - `findActiveForValidation(int $templateId): ?AssessmentTemplateSnapshotDto` — sections/fields/options para `assertPayloadMatchesTemplate`.
  - `listActive(?string $search, int $perPage): LengthAwarePaginator` — index de `assessment-templates`.
  - `findActiveForShow(int $id): ?AssessmentTemplateDetailDto` — show com relações.
  DTOs readonly em `Modules\Admin\Contracts\Public\Dto\` (ou array shape documentado). `SharedAssessmentTemplateController` e `AssessmentService` consomem a interface.
- **Rationale**: Clarificação Q2 — sem Models Admin em Service de `ClinicalRecord`.
- **Alternatives**: Import Admin Model só no Repository — rejeitado pela clarificação.

## R5. Introdução de Repositories

- **Decision**: Extrair queries dos 4 Services atuais para 4 Repositories + interfaces. Services orquestram transação, validação (via contratos), eventos afterCommit.
- **Rationale**: FR-010–012; código legado violava o padrão (queries no Service). Momento da extração é o ponto certo para corrigir.
- **Mapping**:
  - `AssessmentRepository` — CRUD assessment, answers, answerOptions, eager loads.
  - `EvolutionRepository` — CRUD evolution, checked items, generateText queries (template items).
  - `EvolutionTemplateRepository` — CRUD template tree, `hasEvolutions` check.
  - `PatientFileRepository` — list/store/soft-delete.
- **Alternatives**: Mover Services sem Repository — viola requisitos.

## R6. Eventos de integração

- **Decision**: 6 classes `final readonly` em `ClinicalRecord\Events`, `version=1`, `DB::afterCommit`. Triggers:
  - `AssessmentCreated` → create
  - `AssessmentUpdated` → update (PUT, rascunho)
  - `AssessmentCompleted` → sign (não dispara `AssessmentUpdated`)
  - `EvolutionRecorded` → create, update (PUT), sign (clarificação Q1)
  - `PatientFileAttached` → store (após persist)
  - `PatientFileDeleted` → destroy (soft delete)
  - `generate-text` → **sem evento** (não persiste)
  - destroy assessment/evolution → **sem evento** (fora do escopo de eventos listados)
- **Rationale**: Spec FR-014 + clarificações.
- **Alternatives**: Eventos com Model — proibido.

## R7. Upload e delete de arquivos

- **Decision**: Upload via `Modules\Cloudflare\Contracts\FileServiceInterface` (já usado). Delete permanece **soft-delete DB-only** — não chama `FileServiceInterface::deleteFile()` (comportamento atual de `PatientFileService::destroy`).
- **Rationale**: Preservar comportamento; evitar escopo extra de limpeza R2.
- **Alternatives**: Delete físico + evento listener Cloudflare — mudança de comportamento; deferido.

## R8. PDF de evolução

- **Decision**: `EvolutionController::downloadPdf` injeta `PdfGeneratorInterface` (não `PdfService` concreto). View `pdf.clinic.evolution.evolution` e dados inalterados.
- **Rationale**: FR-020; interface já existe em `Modules\Pdf\Contracts\PdfGeneratorInterface`.
- **Alternatives**: Manter service concreto — viola espírito FR-019/020.

## R9. Rotas REST e nested `patients/*`

- **Decision**: `ClinicalRecord/routes/clinic.php` registra **todas** as rotas de prontuário (incluindo nested `patients/{patient}/assessments|evolutions|files`). `Clinic/routes/clinic.php` remove essas rotas e imports. RouteServiceProvider espelha ClinicScheduling (`api` prefix + `api.` name).
- **Rationale**: FR-008 — Clinic não deve ter rotas de prontuário. Laravel merge route files de módulos distintos sob o mesmo prefixo.
- **Alternatives**: Clinic mantém rotas apontando para controllers ClinicalRecord — viola FR-008.

## R10. Migrations (10 arquivos)

- **Decision**: `git mv` de `modules/Clinic/database/migrations/` → `modules/ClinicalRecord/database/migrations/`:
  - `2026_04_03_000005_create_clinic_assessments_table.php`
  - `2026_04_03_000006_create_clinic_assessment_answers_table.php`
  - `2026_04_03_000007_create_clinic_assessment_answer_options_table.php`
  - `2026_04_04_000001_create_clinic_evolution_templates_table.php`
  - `2026_04_04_000002_create_clinic_evolution_template_sections_table.php`
  - `2026_04_04_000003_create_clinic_evolution_template_items_table.php`
  - `2026_04_04_000004_create_clinic_patient_evolutions_table.php`
  - `2026_04_04_000005_create_clinic_patient_evolution_checked_items_table.php`
  - `2026_04_04_000006_create_clinic_patient_files_table.php`
  - `2026_04_09_000001_add_name_to_clinic_patient_files_table.php`
  Conteúdo inalterado. `loadMigrationsFrom` no provider. Ordem de timestamps preservada (FKs para `clinics`, `patients`, `clinic_users`, `admin_assessment_templates` já existem antes).
- **Rationale**: FR-006/007.
- **Alternatives**: Duplicar migrations — rejeitado.

## R11. Seeders e factories

- **Decision**:
  - Mover `EvolutionTemplateSeeder` → `ClinicalRecord/database/seeders/`.
  - Mover `PatientFileFactory` → `ClinicalRecord/database/factories/`.
  - `ClinicPatientDataSeeder` permanece em Clinic (orquestra demo de paciente inteiro) mas imports de Models de prontuário → `ClinicalRecord`.
  - `ClinicDatabaseSeeder` chama `EvolutionTemplateSeeder` do namespace novo.
- **Rationale**: Seeders cross-module podem usar factories/models via whitelist `non_production` do boundary test.
- **Alternatives**: Mover `ClinicPatientDataSeeder` inteiro — escopo maior; deferido.

## R12. Fitness tests

- **Decision**:
  - `ModuleBoundaryTest`: scan `modules/ClinicalRecord/app`.
  - `ClinicalRecordRouteCompatibilityTest`: URIs de prontuário + owners `Modules\ClinicalRecord\Http\Controllers\*`.
  - `ExtractionReadinessTest`: glob migrations de prontuário ausentes em Clinic, presentes em ClinicalRecord.
  - `clinic-capability-map.php`: adicionar `clinical_record` → `extracted`; ajustar `care` candidate (remover evolutions/clinical_files/assessments já extraídos).
  - `extraction-readiness.php`: bloco `ClinicalRecord`.
- **Rationale**: FR-025 + enunciado original.
- **Alternatives**: Suíte nova do zero — rejeitado.

## R13. Read model público ClinicalRecord

- **Decision**: **Não criar** read model público nesta extração — nenhum consumidor externo (Dashboard, etc.) importa Models de prontuário hoje.
- **Rationale**: YAGNI; reduz escopo. Eventos cobrem integrações futuras.
- **Alternatives**: `ClinicalRecordReadServiceInterface` preemptivo — deferido no checklist de readiness.
