# Implementation Plan: Agendamento de Consultas com Google Calendar

**Branch**: `002-appointment-scheduling` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-appointment-scheduling/spec.md`

## Summary

Implementar agendamento de consultas no módulo Clinic com sincronização bidirecional por usuário com o Google Calendar. Abordagem: **backend primeiro** (entidade `Appointment`, CRUD via padrão Controller→Service→Repository→Contract→Request→Policy, máquina de transição de status, conexão OAuth Google por `ClinicUser`, Jobs de push para o Google e Command agendado de polling reverso), **depois** religar o frontend já mockado (`domain/clinic/appointment.ts`, `application/clinic/use-appointments.ts`, novo Repository concreto em `infrastructure/`) removendo `mock-appointments.ts`. Notificação fisio+paciente apenas como evento enfileirado (entrega de canal fora de escopo).

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 12) no backend; TypeScript strict + React 19 no frontend.

**Primary Dependencies**: Laravel 12, tymon/jwt-auth (guard `clinic`), Laravel Queues (`database` por default), **google/apiclient** (novo — OAuth2 + Google Calendar API). Frontend: TanStack Query v5, axios `apiClient`, React Hook Form + Zod, shadcn/ui, FullCalendar (já presente em `styles/fullcalendar.css`).

**Storage**: MySQL/PostgreSQL via Eloquent. Nova tabela `clinic_appointments`; colunas Google OAuth adicionadas à migration existente `create_clinic_users_table` (sem migration de alteração — ver Constraints).

**Testing**: PHPUnit 11 + Mockery (backend, `modules/Clinic/tests/`), Vitest 4 + Testing Library (frontend, `resources/js/test/`).

**Target Platform**: SPA web + REST API (servidor Linux/local dev).

**Project Type**: Web application (backend Laravel modular + frontend SPA React).

**Performance Goals**: Criação de consulta percebida como instantânea (UI otimista/refetch); push ao Google assíncrono (até ~1 min, FR-015/SC-002); polling reverso a cada ~5 min (FR-016/SC-004).

**Constraints**:
- **Backend é fonte de verdade** para autorização e regras (princípio 1 do CLAUDE.md).
- **Sem migrations incrementais**: sistema em dev, sem produção/teste → editar a migration `create_clinic_users_table` para os campos Google e recriar com `migrate:fresh`; a tabela `clinic_appointments` é nova (create migration única). Prefixo de tabela `clinic_` (ver memória de case-sensitivity).
- Multi-tenant: todo acesso filtrado por `clinic_id` (FR-021).
- Frontend respeita separação de camadas (loader→application, page nunca importa `apiClient`).

**Scale/Scope**: Escala de clínica (dezenas de profissionais, milhares de consultas/ano). Escopo: 1 entidade nova + integração OAuth/Calendar + religar 5 telas/visões já mockadas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

O arquivo `.specify/memory/constitution.md` está como template não preenchido (sem princípios ratificados). Na ausência de constituição formal, adoto como gates os **Princípios não-negociáveis do CLAUDE.md**:

| Gate | Status | Observação |
|------|--------|-----------|
| 1. Backend é fonte de verdade | ✅ PASS | Autorização via Policy + Gate::before; transição de status validada no Service. |
| 2. Camadas separadas no frontend | ✅ PASS | loader→`application/`; Repository em `infrastructure/`; page sem `apiClient`. |
| 3. `apiClient` é o único caminho HTTP | ✅ PASS | Novo `AppointmentsRepository` concreto usa `apiClient`. |
| 4. Domain puro | ✅ PASS | `domain/clinic/appointment.ts` já é camelCase; manter sem infra. Remover `sendCalendarInvite` (desconsiderado). |
| 5. Form 2+ campos → RHF+Zod | ✅ PASS | Modal Nova Consulta com RHF + Zod. |

Sem violações. Nenhuma entrada em Complexity Tracking necessária.

## Project Structure

### Documentation (this feature)

```text
specs/002-appointment-scheduling/
├── plan.md              # Este arquivo
├── spec.md              # Especificação
├── research.md          # Phase 0 — decisões técnicas
├── data-model.md        # Phase 1 — entidades e schema
├── quickstart.md        # Phase 1 — guia de validação
├── contracts/           # Phase 1 — contratos REST
│   ├── appointments.md
│   └── google-calendar.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
modules/Clinic/
├── app/
│   ├── Models/
│   │   └── Appointment.php                      # novo (clinic_appointments)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AppointmentController.php        # novo (CRUD + cancel + status)
│   │   │   └── GoogleCalendarController.php     # novo (connect/callback/disconnect)
│   │   └── Requests/
│   │       ├── StoreAppointmentRequest.php      # novo
│   │       ├── UpdateAppointmentRequest.php     # novo
│   │       └── UpdateAppointmentStatusRequest.php # novo
│   ├── Services/
│   │   ├── AppointmentService.php               # novo (regras + transições + dispatch)
│   │   └── GoogleCalendarService.php            # novo (OAuth + push/pull Calendar)
│   ├── Repositories/
│   │   └── AppointmentRepository.php            # novo
│   ├── Contracts/
│   │   ├── AppointmentServiceInterface.php      # novo
│   │   ├── AppointmentRepositoryInterface.php   # novo
│   │   └── GoogleCalendarServiceInterface.php   # novo
│   ├── Policies/
│   │   └── AppointmentPolicy.php                # novo (ownership por clinic_id + role)
│   ├── Enums/
│   │   └── AppointmentStatus.php                # novo (enum + transições válidas)
│   ├── Jobs/
│   │   ├── SyncAppointmentToGoogleJob.php       # novo (push create/update/delete)
│   │   └── PullGoogleCalendarJob.php            # novo (polling reverso por usuário)
│   ├── Console/
│   │   └── (schedule do PullGoogleCalendarJob via registerCommandSchedules)
│   └── Providers/
│       └── ClinicServiceProvider.php            # editar: bind + Gate::policy + schedule
├── database/migrations/
│   ├── 2026_02_27_000003_create_clinic_users_table.php   # EDITAR: colunas Google
│   └── 2026_06_16_000001_create_clinic_appointments_table.php # novo
├── routes/clinic.php                            # editar: rotas appointments + google
└── tests/                                       # Feature + Unit (PHPUnit)

resources/js/
├── domain/clinic/appointment.ts                # ajustar (remover sendCalendarInvite)
├── application/clinic/
│   ├── ports.ts                                 # editar AppointmentsRepository (CRUD)
│   └── use-appointments.ts                      # editar (real repo + mutations)
├── infrastructure/repositories/
│   ├── appointments-repository.ts              # novo (apiClient + mappers)
│   ├── mock-appointments.ts                     # remover
│   └── index.ts                                 # editar wiring
├── components/clinic/agenda/
│   ├── CalendarView.tsx / CalendarSidebar.tsx   # religar a dados reais
│   └── AppointmentModal.tsx                      # RHF + Zod + create/edit
└── pages/clinic/AgendaPage.tsx                  # loader real
```

**Structure Decision**: Web application modular. Backend segue o padrão de vertical slice existente em `modules/Clinic` (Controller→Service→Repository→Contract→Request→Policy, bindings no `ClinicServiceProvider`). Frontend segue DDD já estabelecido (domain→application→infrastructure→page) e reaproveita a tela de Agenda mockada, trocando o repositório mock pelo concreto.

## Complexity Tracking

> Sem violações de gates — seção não aplicável.
