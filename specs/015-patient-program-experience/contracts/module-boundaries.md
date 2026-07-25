# Contract: Module Boundaries (Patient Program Experience)

**Feature**: `015-patient-program-experience`  
**Skills**: `architecture-paradigm-modular-monolith`, `backend-clean-code`

## Ownership

| Artifact | Owner |
|----------|--------|
| `clinic_treatment_plans` (+ outcome flags) | TreatmentProgram |
| `clinic_treatment_plan_groups` / `_exercises` | TreatmentProgram |
| `clinic_treatment_plan_executions` / `_series` / `_feedbacks` | TreatmentProgram |
| HTTP `GET|POST|PATCH /api/patient/programs…` | TreatmentProgram (`routes/patient.php`) |
| JWT guard `patient`, login/me | Patient |
| Exercise catalog media URLs | Admin/Media (read via relations already used in TreatmentProgram) |

## Allowed collaboration

```text
SPA (sem JWT)
  → GET /api/patient/programs/{publicToken}   // detalhe público
      → GetPatientProgramDetailService
          → findByPublicToken (não-draft)

SPA (apiClient, guard patient quando autenticado)
  → HTTP TreatmentProgram PatientProgramController
      → UseCase/Service (TreatmentProgram)
          → RepositoryInterface (TreatmentProgram)
          → auth('patient')->user()  // identity nas rotas autenticadas
          → PatientServiceInterface  // ONLY if extra patient read needed
```

## Forbidden

- `Modules\Patient\…` importar `TreatmentPlan`, Execution, Feedback, Repositories de TreatmentProgram
- `Modules\TreatmentProgram\…` Service/Controller usar `PatientRepository` / queries em tabelas Patient (exceto via `PatientServiceInterface`)
- Clinic/Admin Controllers escrevendo nas tabelas de execução/feedback do paciente nesta feature
- Controller com `DB::`, regra de status ou transação (fica no UseCase)
- Repository validando permissão ou disparando eventos de negócio

## Public contracts (backend)

| Contrato | Quando |
|----------|--------|
| HTTP REST patient (este feature) | Consumidor = SPA |
| `PatientServiceInterface` (existente) | Se TreatmentProgram precisar nome/dados extras do paciente |
| Evento `PatientProgramCompleted` | **Não** no v1 (YAGNI; ver research R9) |
| Estender `TreatmentProgramReadServiceInterface` | Só se Clinic precisar ler engajamento — **fora de escopo v1** |

## Fitness / tests de fronteira

- Feature tests HTTP com `actingAs($patient, 'patient')` cobrindo cross-clinic / cross-patient → 404
- (Opcional) teste estático/CI: Patient não referencia namespace Models TreatmentProgram (grep/arch test) — nice-to-have
