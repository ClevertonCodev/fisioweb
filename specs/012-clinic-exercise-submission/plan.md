# Implementation Plan: Clinic Exercise Submission & Admin Approval

**Branch**: `012-clinic-exercise-submission` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-clinic-exercise-submission/spec.md`

## Summary

Permitir que o **admin da clínica** envie exercícios próprios (vídeo + metadados) pela aba Exercícios. O exercício nasce vinculado à clínica de origem (`clinic_id`) com `review_status = pending`, visível somente para aquela clínica. Um **admin do sistema** vê no dashboard um contador de exercícios pendentes, revisa e **aprova** (vira catálogo global, `clinic_id` continua registrado mas passa a ser visível para todas as clínicas) ou **rejeita** (permanece privado da clínica de origem, com badge "disponível apenas para a clínica que enviou").

Abordagem técnica: reutilizar a entidade existente `Modules\Admin\Models\Exercise` (`admin_exercises`) e o fluxo de upload presigned já existente do módulo Media (que a clínica já consome). Adicionar colunas de origem/revisão às migrations existentes (sem migration nova, conforme decisão do usuário), estender o contrato público do módulo Admin para submissão e revisão, e alterar a leitura da biblioteca da clínica para aplicar o filtro de visibilidade (globais aprovados + próprios).

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 12) no backend; TypeScript strict + React 19 no frontend

**Primary Dependencies**: Laravel 12, tymon/jwt-auth (guards `admin` + `clinic`), Eloquent; React 19, react-router-dom v6, TanStack Query v5, RHF + Zod, shadcn/ui, axios (`apiClient`)

**Storage**: MySQL/PostgreSQL via Eloquent; vídeos/thumbnails em Cloudflare R2 (fluxo presigned do módulo Media)

**Testing**: PHPUnit 11 + Mockery (backend, `RefreshDatabase`, `actingAs($user, 'guard')`); Vitest 4 + Testing Library (frontend)

**Target Platform**: SPA web (área admin + área clínica) sobre REST API Laravel

**Project Type**: Web application (backend modular monolith + frontend DDD SPA)

**Performance Goals**: Padrão da aplicação (biblioteca de exercícios paginada, sem N+1 — manter eager loading existente)

**Constraints**:
- **Sem migration nova** — modificar as migrations existentes (`admin_exercises`) e re-executar `migrate:fresh` + seeders (app existe só localmente, fase de criação).
- Backend é fonte de verdade para visibilidade e autorização; frontend apenas reflete/esconde.
- `apiClient` é o único caminho HTTP; sem `fetch` direto.
- Módulos não importam internals de outros módulos — clínica acessa exercícios via contrato público do Admin.

**Scale/Scope**: 1 migration alterada; ~2 novos endpoints clínica (submeter) + ~3 admin (listar pendentes, aprovar, rejeitar) + contador no dashboard; 1 nova página de envio na clínica + badge/status na biblioteca + card de revisão no dashboard admin.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

O arquivo `.specify/memory/constitution.md` está com placeholders não preenchidos (template). Não há princípios ratificados formais. Na ausência dele, aplicam-se os **Princípios não-negociáveis do CLAUDE.md** como gate substituto:

| Princípio (CLAUDE.md) | Status | Observação |
|-----------------------|--------|------------|
| 1. Backend é fonte de verdade | ✅ | Visibilidade e aprovação impostas no backend (Policy + query de escopo). Frontend só exibe badge/aviso. |
| 2. Backend limpo (Controller→Service→Repository→DTO) | ✅ | Submissão e revisão em Service; Repository faz filtro de visibilidade; FormRequest valida. |
| 3. Monólito modular (sem importar internals) | ✅ | Clínica usa contrato público do Admin (`ExerciseServiceInterface` estendido / novo contrato de submissão). Sem query direta em `admin_exercises` fora do módulo Admin. |
| 4. Camadas separadas no frontend (loader→application, nunca infra) | ✅ | Página usa hooks de `application/`; repositório em `infrastructure/`. |
| 5. `apiClient` único caminho HTTP | ✅ | Reutiliza `usePresignedUpload` + novos repositórios. |
| 6. Domain puro | ✅ | Entidade `exercise` do domínio ganha `reviewStatus`/`originClinicId` em camelCase; mapper snake↔camel na infra. |
| 7. Form 2+ campos → RHF + Zod | ✅ | Form de envio (nome/categoria/dificuldade/descrição/vídeo) usa RHF + Zod. |

**Resultado do gate**: PASS (sem violações; nenhuma entrada em Complexity Tracking necessária).

## Project Structure

### Documentation (this feature)

```text
specs/012-clinic-exercise-submission/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (REST contracts)
│   ├── clinic-exercise-submission.md
│   └── admin-exercise-review.md
└── checklists/
    └── requirements.md  # (from /speckit-specify)
```

### Source Code (repository root)

```text
modules/Admin/                                  # dono da entidade Exercise
├── database/migrations/
│   └── 2026_02_28_000007_create_admin_exercises_table.php   # ALTERAR (colunas de origem/revisão)
├── database/seeders/ExerciseSeeder.php                       # ALTERAR (review_status=approved, clinic_id=null nos globais)
├── app/Models/Exercise.php                                   # ALTERAR (fillable, casts, consts, scopes, relação clinic)
├── app/Contracts/
│   ├── ExerciseServiceInterface.php                          # ALTERAR (métodos de escopo p/ clínica)
│   └── Public/ExerciseSubmissionServiceInterface.php         # NOVO (contrato público submit+review)
├── app/Services/
│   ├── ExerciseService.php                                   # ALTERAR
│   └── ExerciseSubmissionService.php                         # NOVO (submit, approve, reject, pendingCount)
├── app/Repositories/ExerciseRepository.php                   # ALTERAR (filtro de visibilidade por clínica)
├── app/Http/Controllers/ExerciseReviewController.php         # NOVO (admin: pending, approve, reject)
├── app/Http/Requests/ReviewExerciseRequest.php               # NOVO
├── app/Policies/ExercisePolicy.php                           # NOVO/ALTERAR (approve/reject = admin)
├── app/Providers/                                            # registrar policy + bind contrato
└── routes/admin.php                                          # ALTERAR (rotas de review + count)

modules/Clinic/
├── app/Http/Controllers/ExerciseController.php               # ALTERAR (index escopo por clínica; store submit)
├── app/Http/Requests/SubmitExerciseRequest.php               # NOVO
├── app/Policies/ (RequireClinicAdmin no FE; policy backend p/ submit)
└── routes/clinic.php                                         # ALTERAR (POST clinic/exercises)

resources/js/
├── domain/clinic/exercise.ts                                 # ALTERAR (reviewStatus, originClinicId, isOwnSubmission)
├── application/clinic/
│   ├── use-exercises.ts                                      # ALTERAR (badge/status)
│   └── use-submit-exercise.ts                                # NOVO (mutation + presigned upload)
├── infrastructure/repositories/api-clinic-exercises.ts       # ALTERAR (mapper + submit)
├── pages/clinic/
│   ├── ExercisesPage.tsx                                     # ALTERAR (botão "Enviar exercício" + badge)
│   └── ClinicSubmitExercisePage.tsx                          # NOVO (form estilo AdminVideoCreatePage + aviso)
├── components/ExerciseCard.tsx                                # ALTERAR (badge "somente sua clínica")
├── routes/clinic/*                                           # ALTERAR (rota da página de envio)
├── application/admin/use-admin-dashboard.ts (ou equivalente)  # ALTERAR/NOVO (contador pendentes)
├── infrastructure/repositories/api-admin-exercises.ts        # ALTERAR (pending/approve/reject)
└── pages/admin/
    ├── AdminDashboardPage.tsx                                # ALTERAR (card "exercícios a revisar")
    └── exercises/AdminExerciseReviewPage.tsx (ou aba)        # NOVO (lista pendentes + aprovar/rejeitar)
```

**Structure Decision**: Web application modular. A entidade `Exercise` permanece no **módulo Admin** (é o dono do catálogo). A submissão pela clínica e a revisão pelo admin são novos casos de uso **dentro do módulo Admin**, expostos via **contrato público** (`ExerciseSubmissionServiceInterface`) consumido pelo `Modules\Clinic\ExerciseController` — respeitando a fronteira modular já usada (Clinic já injeta `ExerciseServiceInterface` do Admin). O frontend segue o padrão DDD por camadas em `resources/js/`, reutilizando o fluxo de upload presigned do módulo Media (`usePresignedUpload`) que a clínica já possui.

## Complexity Tracking

> Sem violações de gate. Nenhuma justificativa de complexidade necessária.
