# Implementation Plan: Download PDF do Programa de Tratamento

**Branch**: `014-program-pdf-download` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-program-pdf-download/spec.md`

## Summary

Habilitar **Baixar PDF** na área da clínica e evoluir o PDF do plano de tratamento para o layout de referência (capa com responsável + QR deep link do programa na área do paciente, exercícios com até 2 imagens de referência e grupo **Novo Grupo**, páginas de anotações mensais com teto de 3 meses). Inclui cadastro das imagens no admin de vídeos, reutilizando `admin_exercise_media` **sem migration nova**.

Abordagem: endpoint PDF já existe (`GET …/treatment-plans/{id}/pdf`); redesenhar blade + view-model no `TreatmentProgram`, habilitar FE espelhando download de evolução, gerar QR server-side, deep link estável `{slug}/paciente/programas/{id}` com landing/redirect mínima, e sync de imagens via Admin/Media (R2 presigned).

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 12); TypeScript strict + React 19

**Primary Dependencies**: Laravel 12, JWT guards `clinic`/`admin`/`patient`, Eloquent, `barryvdh/laravel-dompdf` (`Modules\Pdf`), biblioteca QR PHP; React 19, TanStack Query v5, react-router-dom v6, RHF+Zod onde forms novos, shadcn/ui, axios `apiClient`

**Storage**: MySQL/PostgreSQL; imagens em Cloudflare R2; `admin_exercise_media` + opcional `media_videos.metadata.reference_images`

**Testing**: PHPUnit 11 + Mockery (`RefreshDatabase`, `actingAs`); Vitest 4 + Testing Library

**Target Platform**: SPA clinic/admin (+ rota paciente mínima) sobre REST Laravel

**Project Type**: Web application (modular monolith + frontend DDD)

**Performance Goals**: PDF típico (≤20 exercícios) em &lt;30s (SC-002); eager-load sem N+1

**Constraints**:
- **Sem migration nova** (clarificação); `migrate:refresh --seed` OK em dev
- Sem envio WhatsApp/e-mail do PDF
- Anotações só impressas; máx. 3 meses
- Backend fonte de verdade; `apiClient` único HTTP; fronteiras modulares (Admin dono de `ExerciseMedia`; TreatmentProgram orquestra PDF; Pdf via contrato)
- Skills aplicadas: `frontend-ddd`, `frontend-ui-patterns`, `frontend-react`, `forms-shadcn`, `api-client`, `frontend-testing`, `backend-module`, `backend-clean-code`, `architecture-paradigm-modular-monolith`, `laravel-eloquent`, `php-modern`, `php-testing`, `security`

**Scale/Scope**: 1 endpoint PDF existente + redesign blade; 1–2 endpoints admin de reference images; deep link paciente mínimo; 2 páginas clinic (enable download) + AdminVideo Create/Edit; seeds já populam imagens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` é template sem princípios ratificados. Gate substituto = **Princípios não-negociáveis do CLAUDE.md / AGENTS.md**:

| Princípio | Status | Observação |
|-----------|--------|------------|
| 1. Backend fonte de verdade | ✅ | PDF e auth no backend; FE só dispara download |
| 2. Backend limpo | ✅ | Lógica de montagem do PDF em Service/view-model; Controller fino; preferir `PdfGeneratorInterface` |
| 3. Monólito modular | ✅ | Admin dono de mídia; TreatmentProgram não escreve `admin_*`; Patient só deep link/auth |
| 4. Camadas frontend | ✅ | Repository em infra; hook em application; pages sem `apiClient` |
| 5. `apiClient` único | ✅ | Blob download como evolutions |
| 6. Domain puro | ✅ | Sem shapes API em `domain/` |
| 7. Form 2+ campos → RHF+Zod | ✅ | Slots de imagem no admin seguem form da página; preferir RHF se reformar o form |

**Resultado do gate**: PASS (pós Phase 1: mantido). Ver [research.md](./research.md).

## Project Structure

### Documentation (this feature)

```text
specs/014-program-pdf-download/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── clinic-treatment-plan-pdf.md
│   ├── admin-exercise-reference-images.md
│   └── patient-program-deep-link.md
├── checklists/requirements.md
└── tasks.md                 # /speckit-tasks (ainda não)
```

### Source Code (repository root)

```text
modules/TreatmentProgram/
├── app/Http/Controllers/TreatmentPlanController.php   # downloadPdf: load clinicUser; PdfGeneratorInterface
├── app/Services/…                                       # view-model PDF (QR URL, meses anotações, Novo Grupo)
├── routes/clinic.php                                    # pdf já existe
└── tests/Feature/…TreatmentPlanPdf…                     # NOVO/ALTERAR

modules/Pdf/
└── Contracts/PdfGeneratorInterface.php                  # usar no download (como evolutions)

modules/Admin/
├── app/Models/ExerciseMedia.php                         # existente
├── app/Services/ExerciseService.php (ou novo service)   # sync reference images
├── app/Http/Controllers/…                               # endpoint reference-images
├── Database/Seeders/ExerciseSeeder.php                  # já seeds 2 imagens R2
└── routes/admin.php

modules/Media/
└── …                                                    # presigned upload reutilizado; metadata.reference_images opcional

resources/views/pdf/clinic/treatment/
└── treatment-plan.blade.php                             # capa responsável+QR; Novo Grupo; anotações

resources/js/
├── application/clinic/…                                 # downloadProgramPdf helper + hook
├── infrastructure/repositories/api-clinic-programs.ts   # downloadPdf blob
├── pages/clinic/program/ProgramDetailPage.tsx           # enable Baixar PDF
├── pages/clinic/program/ProgramHistoryTab.tsx           # enable Baixar PDF
├── pages/admin/exercises/AdminVideoCreatePage.tsx       # 2 imagens referência
├── pages/admin/exercises/AdminVideoEditPage.tsx         # idem
├── routes/…                                             # deep link /{slug}/paciente/programas/:id
└── test/…                                               # testes FE

# Paciente (mínimo)
resources/js/pages/patient/… ou rota sob clinic slug     # landing/redirect login
modules/Patient/…                                        # auth existente; endpoint stub se necessário
```

**Structure Decision**: Web app modular. PDF permanece view app-level (padrão 010). `TreatmentProgram` orquestra dados do plano + QR; `Admin` persiste imagens; `Pdf` gera bytes; FE clinic só consome blob; deep link paciente é contrato de URL + landing mínima, sem portal completo.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Deep link paciente sem SPA completa | Spec/SC-004 exigem QR para o programa | Omitir QR quebraria clarificação B |
| Staging em `video.metadata` | UI em vídeos sem migration | Coluna nova em `media_videos` proibida nesta fase |

## Phase 0 / Phase 1 outputs

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/](./contracts/) |
| Quickstart | [quickstart.md](./quickstart.md) |

## Implementation notes (for `/speckit-tasks`)

1. **P1 FE download** — destravar botões + repository blob (valor imediato com PDF atual).
2. **P1 PDF redesign** — cabeçalho responsável, QR, Novo Grupo, anotações ≤3 meses, eager-load.
3. **P1 Admin reference images** — upload + sync `ExerciseMedia` (seeds já cobrem demo).
4. **P1 Deep link** — rota + redirect login paciente.
5. **Tests** — Feature PDF (auth/404/content markers); Vitest botão/repositório; opcional admin media.

Detalhamento de tarefas: `/speckit-tasks`.
