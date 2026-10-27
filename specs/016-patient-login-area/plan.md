# Implementation Plan: Patient Login Area

**Branch**: `feature/area-paciente` (`016-patient-login-area`) | **Date**: 2026-08-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-patient-login-area/spec.md`

## Summary

Entregar a **porta de entrada autenticada do paciente**: uma tela de login dedicada no SPA, ligada ao botão "Entrar" do `PatientNavbar` (hoje apontando para `/login`, rota inexistente), com identificador **CPF ou e-mail**, senha verificada de verdade, e resolução da clínica pelo slug da URL com escolha explícita como fallback.

O trabalho tem **três frentes de peso muito diferente**:

| Frente | Peso | Natureza |
|--------|------|----------|
| **Correção de segurança** no `AuthController` do paciente | 1 linha + request | Defeito — a senha digitada é descartada hoje |
| **Endurecimento** de `find-clinics` + rate limiting | pequeno | Fecha oráculo de CPF; primeiro throttle do projeto |
| **Tela de login + rotas + estado da barra** | maior | Frontend novo em camadas DDD |

**Abordagem modular** (`architecture-paradigm-modular-monolith`):

| Capacidade | Módulo dono | Contrato |
|------------|-------------|----------|
| Autenticação e identidade do paciente | **Patient** | HTTP `/api/patient/auth/*` (existente, estendido) |
| Slug → clínica para o contexto de login | **Clinic** (leitura pública mínima) | `slug`, `id`, `name` via relação já existente `Patient::clinic` |
| Programas do paciente (destino pós-login) | **TreatmentProgram** | **sem alteração** |

**Clean code** (`backend-clean-code`): Controller fino → FormRequest → Service → Repository. A regra de identificador/elegibilidade sai do Controller e vai para um Service dedicado; o Controller volta a só orquestrar.

**Frontend** (`frontend-ddd` + `forms-shadcn` + `frontend-ui-patterns`): `domain/` puro → `application/` hooks → `infrastructure/` repository → page sem `apiClient`. Formulário em **RHF + Zod** (regra 7 do projeto) — **não** copiar o `useState` do `ClinicLoginPage`, que é precedente legado.

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 12); TypeScript strict + React 19

**Primary Dependencies**: Laravel 12, `php-open-source-saver/jwt-auth` (guard `patient`), Eloquent, `Illuminate\Support\Facades\RateLimiter`; React 19, TanStack Query v5, react-router-dom v6, RHF + Zod, axios `apiClient`

**Storage**: MySQL/PostgreSQL — `patients` (`email` NOT NULL, `cpf` nullable, `password`, `is_active`, `status`, `unique(email, clinic_id)`, `unique(cpf, clinic_id)`), `clinics` (`slug` unique nullable). **Nenhuma migration nova.**

**Testing**: PHPUnit 11 + `RefreshDatabase` (`modules/Patient/tests/Feature/` — hoje só `.gitkeep`); Vitest 4 + RTL para repository, schema e página

**Target Platform**: SPA paciente (telefone dominante) + REST Laravel

**Project Type**: Web application (modular monolith + frontend DDD)

**Performance Goals**: Login em uma consulta indexada (`unique(cpf|email, clinic_id)`); descoberta de clínicas sem N+1 (eager-load `clinic:id,name,slug`)

**Constraints**:
- Backend é fonte de verdade — verificação de senha, elegibilidade e rate limit no Laravel; o frontend só orquestra a UX
- `Patient` **não** importa Model/Repository de `TreatmentProgram`; o destino pós-login é decidido no frontend
- **Nenhuma migration** — a coluna `password` e os índices necessários já existem
- **Nenhuma tela pública hoje pode virar autenticada** — a leitura do programa por token segue anônima (feature 015)
- Sessões `admin` / `clinic` / `patient` coexistem — `clearStoredAuth(guard)` já é por guard
- Skills: `security`, `backend-clean-code`, `backend-module`, `php-testing`, `api-client`, `frontend-ddd`, `forms-shadcn`, `frontend-ui-patterns`, `frontend-testing`

**Scale/Scope**: 2 endpoints alterados + 1 leitura de slug; 1 Service novo + 1 FormRequest alterado; ~6 arquivos frontend novos; 3 arquivos frontend alterados; 0 migrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` **não existe** neste projeto. Gate substituto = as "Regras inegociáveis" de `.cursor/rules/specify-rules.mdc` + skills de arquitetura.

| # | Princípio | Status | Observação |
|---|-----------|--------|------------|
| 1 | Multi-tenant — acesso filtrado por `clinic_id` | ✅ | Busca de paciente sempre escopada por clínica; sessão vinculada à clínica autenticada (FR-019) |
| 2 | Monólito modular — sem Model/Repository cruzado | ✅ | Tudo em `modules/Patient`; `Clinic` acessado só pela relação já existente `Patient::clinic` |
| 3 | Backend fonte de verdade | ✅ | Senha, elegibilidade, rate limit e não-enumeração no Laravel |
| 4 | Camadas frontend — página nunca importa `apiClient` | ✅ | `PatientLoginPage` → `use-patient-auth` → `api-patient-auth` |
| 5 | HTTP só via `apiClient`, guard inferido pela URL | ✅ | `/patient/*` → guard `patient` já inferido em `client.ts:16` |
| 6 | `domain/` puro — camelCase, sem `ApiXxx` | ✅ | `domain/patient/auth.ts` só com tipos; mapeamento na infra |
| 7 | Form com 2+ campos → RHF + Zod | ✅ | 3 campos → RHF + Zod; `ClinicLoginPage` (`useState`) **não** é o modelo a copiar |
| 8 | UI por tokens, `cursor-pointer` em clicáveis | ✅ | Só tokens (`bg-card`, `border-border`, `primary`); claro/escuro sem CSS condicional |
| 9 | PHP — Pint, Controller → Service → Repository | ✅ | Regra de identificador sai do Controller para Service dedicado |

**Resultado do gate**: **PASS** (mantido após Phase 1).

Decisões em [research.md](./research.md). Duas merecem registro explícito:

- **R3 é correção de defeito, não funcionalidade.** `AuthController::login` monta `'password' => $cpf` a partir do CPF do próprio request, descartando a senha digitada. Como `PatientService::create` grava `password = cpf`, o hash bate e o `attempt` passa — **conhecer o CPF basta para autenticar como o paciente**. A correção não exige migration nem re-hash.
- **R8 pede confirmação de produto.** Manter acesso para `status = alta` é a leitura mais defensável (alta é desfecho positivo; o paciente ainda quer rever o que fez), mas é decisão de produto, não técnica.

## Project Structure

### Documentation (this feature)

```text
specs/016-patient-login-area/
├── spec.md
├── plan.md                      # este arquivo
├── research.md                  # Phase 0 — R1..R11
├── data-model.md                # Phase 1
├── quickstart.md                # Phase 1
├── contracts/
│   ├── patient-auth-rest.md     # contrato HTTP
│   └── module-boundaries.md     # fronteiras + ADR curto
├── checklists/requirements.md
└── tasks.md                     # /speckit-tasks
```

### Source Code (repository root)

```text
modules/Patient/
├── routes/api.php                                        # ALTERAR — throttle nas rotas públicas
├── app/Http/Controllers/AuthController.php               # ALTERAR — corrige senha; delega ao Service
├── app/Http/Requests/LoginRequest.php                    # ALTERAR — identifier + password + clinic_id
├── app/Http/Requests/FindClinicsRequest.php              # NOVO — identifier (CPF ou e-mail)
├── app/Services/PatientAuthService.php                   # NOVO — identificador, elegibilidade, clínicas
├── app/Support/PatientIdentifier.php                     # NOVO — VO: normaliza e classifica (php-modern)
├── app/Providers/…                                       # ALTERAR — registrar rate limiters
└── tests/Feature/
    ├── PatientLoginTest.php                              # NOVO — senha, isolamento, elegibilidade
    ├── PatientFindClinicsTest.php                        # NOVO — não-enumeração
    └── PatientAuthThrottleTest.php                       # NOVO — limite e reset

modules/Clinic/
└── (sem alteração)                                       # slug lido pela relação existente

modules/TreatmentProgram/
└── (sem alteração)                                       # destino pós-login é decisão do frontend

resources/js/
├── domain/patient/auth.ts                                # NOVO — tipos puros
├── application/patient/
│   ├── patient-auth-paths.ts                             # NOVO — paths do login + validação do next
│   └── use-patient-auth.ts                               # NOVO — mutations dos dois passos
├── infrastructure/
│   ├── repositories/api-patient-auth.ts                  # NOVO — HTTP + mapeamento
│   ├── repositories/index.ts                             # ALTERAR — export
│   └── api/client.ts                                     # ALTERAR — redirectToLogin('patient')
├── pages/patient/auth/PatientLoginPage.tsx               # NOVO — RHF + Zod
├── routes/patient/auth-routes.tsx                        # NOVO — RouteObject[]
├── app.tsx                                               # ALTERAR — registrar rotas + /login
├── components/PatientNavbar.tsx                          # ALTERAR — estado autenticado + next
└── test/
    ├── api-patient-auth.test.ts                          # NOVO
    └── patient-login-page.test.tsx                       # NOVO
```

**Structure Decision**: A capacidade fica **inteiramente em `modules/Patient`**, que já é o dono da identidade (model `JWTSubject`, `AuthController`, provider `patients`). `TreatmentProgram` não é tocado — o login não conhece programa, e o destino pós-login é resolvido no frontend pelo parâmetro `next`. No frontend, a área `patient` ganha seu primeiro fatiamento por subdomínio (`pages/patient/auth/`, `routes/patient/auth-routes.tsx`), espelhando `pages/patient/program/` e `routes/patient/program-routes.tsx`.

## Complexity Tracking

Nenhuma violação de princípio a justificar.

Duas notas de escopo que **não** são violações, mas merecem registro:

1. **Rate limiting é greenfield.** Não há `throttle` nem `RateLimiter` em lugar nenhum do projeto (`routes/`, `modules/*/routes/`, `app/Providers/`). Esta feature introduz o primeiro. O padrão que ela estabelecer tende a virar referência para os logins de clínica e admin — que hoje também estão sem limite. Tratar o nome e o formato do limiter com esse peso.

2. **`modules/Patient/tests/Feature/` está vazio** (só `.gitkeep`). Os testes desta feature são os primeiros de Feature do módulo; vale conferir o bootstrap de `RefreshDatabase` + factory de `Patient` na primeira task, antes de empilhar casos.

## Phase 0 / Phase 1

- **Phase 0**: [research.md](./research.md) — R1 módulo dono · R2 identificador · R3 correção de senha · R4 senha padrão nem sempre é CPF · R5 resolução de clínica · R6 não-enumeração · R7 rate limiting · R8 elegibilidade · R9 rota e retorno · R10 camadas do frontend · R11 design
- **Phase 1**: [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)
- **Agent context**: bloco SPECKIT em `.cursor/rules/specify-rules.mdc` aponta para este `plan.md`

## Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Pacientes acostumados a entrar com qualquer senha passam a falhar | Suporte da clínica recebe chamados | A senha padrão (CPF) continua válida — quem digitar o CPF entra. Comunicar a clínica antes do deploy |
| Paciente estrangeiro sem CPF não sabe que a senha é o e-mail | Paciente travado, sem recuperação no v1 | Texto neutro na UI (R4); orientação para procurar a clínica |
| `clinics.slug` nulo em clínicas antigas | Caminho contextual falha | Fallback para escolha de clínica já previsto (FR-018) |
| Rate limit bloqueia paciente legítimo atrás de NAT | Paciente não entra | Chave `identifier + IP`, não só IP (R7); limite generoso no login |
| `next` malicioso | Open redirect | Allowlist de prefixo interno, rejeita `//` e URL absoluta (R9) |
