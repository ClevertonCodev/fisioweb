# Research: Patient Program Experience (Backend)

**Feature**: `015-patient-program-experience` | **Date**: 2026-07-25

## R1 — Módulo dono da API e dos dados de engajamento

**Decision**: `TreatmentProgram` é dono da API `/api/patient/programs/*`, das migrations de engajamento e das regras de view/execução/feedback/conclusão. `Patient` permanece dono apenas de auth JWT. **`GET …/programs/{publicToken}` é público** (sem `auth:patient`); demais rotas exigem JWT. Share URL da clínica = deep link `/{clinicSlug}/paciente/programas/{token}`; SPA sem sessão abre o detalhe nessa URL (API pública pelo token).

**Rationale**:
- Prescrição (`clinic_treatment_plans` + groups/exercises/`public_token`/`patient_viewed_at`/`patient_completed_count`) já é ownership do TreatmentProgram (ADR-010).
- Precedente: Media expõe `routes/patient.php` sob `auth:patient` sem mover dados para o módulo Patient. **Diferença desta feature**: só o `GET …/programs/{publicToken}` é público; demais rotas seguem `auth:patient`.
- Evita Patient importar Models/Repositories de TreatmentProgram (cheiro proibido pela skill de monólito modular).

**Alternatives considered**:
| Alt | Rejected because |
|-----|------------------|
| API no módulo Patient lendo Models de TreatmentProgram | Viola fronteira; Patient viraria “BFF acoplado” |
| Novo módulo `PatientProgram` | Over-engineering para um consumidor HTTP; extrai depois se engajamento crescer |
| Clinic module host | Clinic não é o contexto do paciente autenticado |

**ADR (curto)**:

```markdown
# ADR: Patient program API lives in TreatmentProgram

## Contexto
SPA paciente precisa ler/escrever engajamento sobre TreatmentPlan sem mocks.

## Decisão
TreatmentProgram ownership de rotas patient/programs + tabelas de execução/feedback.
Patient só autentica (JWT guard patient).

## Consequências
- Benefícios: tabela/regra no mesmo bounded context da prescrição
- Custos: TreatmentProgram cresce com superfície patient
- Regra: Patient NÃO importa Models TreatmentProgram; TreatmentProgram NÃO usa Patient Repository — usa auth user + PatientServiceInterface se precisar read extra

## Extração futura
Extrair engajamento para módulo dedicado com contrato síncrono de leitura de plano, se o bounded context engordar.
```

---

## R2 — Camadas internas (clean code)

**Decision**: Um **UseCase/Service por ação** sob `Services/PatientProgram/`, cada um com `execute(...)`; Controllers finos; FormRequests para series/unfinished/feedback; DTOs readonly; Repositories internos via interface; Policy ou check de ownership no Service (paciente autenticado == `plan.patient_id` && mesma `clinic_id`).

**Rationale**: Skill `backend-clean-code` — Controller não pensa; Service decide; Repository persiste; Interface Segregation (não um God-Service).

**Alternatives considered**:
| Alt | Rejected because |
|-----|------------------|
| Um `PatientProgramService` monolítico | Viola SRP; difícil testar |
| Lógica no Controller | Cheiro explícito da skill |

**UseCases**:
1. `ListPatientProgramsService`
2. `GetPatientProgramDetailService`
3. `RegisterPatientProgramViewService` (idempotente; falha não bloqueia UX no FE)
4. `StartOrResumePatientProgramExecutionService` (retoma se `in_progress`)
5. `SavePatientProgramSeriesService`
6. `UpdateUnfinishedExercisesService`
7. `SubmitPatientProgramFeedbackService` (rejeita dimensões desabilitadas)
8. `CompletePatientProgramService` (idempotente se já concluído)

---

## R3 — Mapeamento de status paciente

**Decision**: Status FE é **derivado** (não nova coluna de status paciente):

| Status FE | Regra |
|-----------|--------|
| `inactive` | `plan.status === cancelled` |
| `completed` | `patient_completed_count > 0` **ou** `plan.status === completed` |
| `scheduled` | `active` e `start_date` no futuro |
| `unavailable` | `active`, janela inválida (ex.: `end_date` no passado) e ainda não completed pelo paciente |
| `available` | `active`, dentro da janela (ou sem datas restritivas), `patient_completed_count === 0` |

Draft: **não listar / não detalhar** (404).

**Rationale**: Spec FR-003 + clarificação v1 sem reexecução; reutiliza campos existentes.

**Alternatives considered**: Coluna `patient_status` — rejeitada (duplica fonte de verdade).

---

## R4 — Schema de engajamento

**Decision**:
1. Colunas em `clinic_treatment_plans`: `outcome_pain_enabled`, `outcome_difficulty_enabled`, `outcome_satisfaction_enabled` (boolean, default `true`).
2. Tabela `clinic_treatment_plan_executions` — uma linha por tentativa; no máx. uma `in_progress` por (`treatment_plan_id`, `patient_id`).
3. Tabela `clinic_treatment_plan_execution_series` — séries por exercício na execução.
4. Tabela `clinic_treatment_plan_feedbacks` — feedback do ciclo (ligado a plan + opcionalmente execution); complete separado incrementa `patient_completed_count` e seta `completed_at` na execução / timestamp de conclusão.

**Rationale**: Tabelas no módulo dono; alinhadas ao prefixo `clinic_treatment_*`; cobrem resume, last load e feedback em duas etapas.

**Alternatives considered**:
| Alt | Rejected because |
|-----|------------------|
| JSON blob no plan | Dificulta last-load e testes; pior para evolução |
| Só atualizar plan sem histórico de séries | Spec exige persistir séries e last load |

---

## R5 — Last load

**Decision**: Ao montar contexto de execução, para cada exercício: última série da execução `in_progress`; senão última série de execução concluída mais recente do mesmo plan+patient; senão `null`.

**Rationale**: Clarificação Q4 opção A.

---

## R6 — Feedback vs complete

**Decision**: Endpoints separados. Feedback **não** muda status/contador. Complete exige ciclo elegível (programa available ou execução em andamento / feedback já enviado conforme regras do UseCase); se já `patient_completed_count > 0` (v1), retorna sucesso idempotente sem novo incremento.

**Rationale**: Clarificações Q1 e Q5.

**Nota implementação**: Definir no UseCase se complete requer feedback prévio quando alguma flag de outcome está ligada — **default**: se ≥1 flag habilitada, complete exige feedback persistido para o ciclo atual; se todas desabilitadas, complete permitido sem feedback.

---

## R7 — Frontend HTTP patient

**Decision**: Estender `AuthGuard` e `inferGuardFromApiUrl` para `/patient/*` → guard `patient`; repository `api-patient-programs.ts` substitui mock; hooks passam a mutações reais (incl. start/resume, series, unfinished).

**Rationale**: `api-client` skill; hoje só `admin`|`clinic`.

---

## R8 — Campos de prescrição ausentes no DB

**Decision**: v1 mapeia o que existe (`series*`, `repetitions*`, `load*`, `rest_time`, `notes`, `days_of_week`, `period`). Campos FE `intensity` / `duration*` / `maintainFor` ficam opcionais/`undefined` se não houver coluna. `period` DB string → FE `period: string[]` (array de 0–1 item) no mapper.

**Rationale**: Não bloquear API por campos Vedius sem coluna; evita migration especulativa.

---

## R9 — Eventos

**Decision**: v1 **sem** eventos obrigatórios para WhatsApp/dashboard. Opcional futuro: `PatientProgramCompleted` (IDs + clinicId) se Clinic precisar reagir. Complete/view ficam síncronos no UseCase.

**Rationale**: Spec fora de escopo para painel clínica; YAGNI.

---

## Resolved NEEDS CLARIFICATION

Nenhum pendente da Phase 0 — clarificações da sessão 2026-07-25 cobrem fluxos críticos; defaults acima fecham gaps técnicos.
