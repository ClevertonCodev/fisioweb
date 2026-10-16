# AGENTS.md

Orientação para Cursor neste repositório. **Detalhes vivem nas skills em `.cursor/skills/`** — este arquivo aponta para onde olhar.

## Project Overview

SaaS de gestão de clínica de fisioterapia. **Backend** Laravel 12 REST API com guards JWT separados (`admin` e `clinic`). **Frontend** SPA React 19 + TypeScript. Dois perfis principais: **admin** (gerencia clínicas, planos, funcionalidades, exercícios catálogo) e **clinic** (gerencia pacientes, programas de tratamento, agendamento).

## Commands

```bash
# Desenvolvimento — sobe Laravel + queue + Pail logs + Vite concorrentes
composer run dev

# Build / type check / lint / format
npm run build
npm run types
npm run lint
npm run format
./vendor/bin/pint     # PHP formatter

# Testes
composer run test     # PHPUnit (backend)
npm run test          # Vitest (frontend)
npm run test:watch
```

## Initial Setup

```bash
composer install && npm install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
npm run build
```

## Stack

| Área | Tecnologia |
|------|-----------|
| Backend | Laravel 12, PHP 8.2+, PHPUnit 11, Mockery 1.6 |
| Auth | JWT (tymon/jwt-auth) com guards `admin` + `clinic` |
| DB | MySQL/PostgreSQL via Eloquent |
| Filas | Laravel Queues (default redis/sync) |
| Storage | Cloudflare R2 (S3-compatible) |
| PDF | barryvdh/laravel-dompdf |
| Frontend | React 19, TypeScript strict, Vite |
| Roteamento | react-router-dom v6 (`createBrowserRouter` + loaders) |
| Estado servidor | TanStack Query v5 |
| HTTP | axios singleton (`apiClient` com JWT interceptor + auto-refresh) |
| Forms | React Hook Form + Zod |
| UI | shadcn/ui (Radix) + Tailwind + lucide-react |
| Toasts | sonner |
| Testes FE | Vitest 4 + @testing-library/react 16 |

## Estrutura de pastas (alto nível)

```
modules/                            # módulos backend (NÃO em app/Modules)
├── Admin/                          # admin auth, clinics, plans, features, exercises catalog
├── Clinic/                         # clinic auth, patients, treatment plans, scheduling
├── Patient/                        # paciente final
├── Media/                          # vídeo/mídia
├── Pdf/                            # geração de PDF
├── Cloudflare/                     # R2 storage
└── WhatsApp/                       # Twilio/WhatsApp

resources/js/                       # frontend SPA
├── domain/                         # entidades puras (camelCase)
├── application/                    # hooks React Query + ports + use-cases puros
├── infrastructure/                 # apiClient + repositórios concretos
├── pages/{admin,clinic}/<recurso>/ # páginas: EntityListPage/NewPage/EditPage
├── components/{ui,admin,clinic}/   # UI
├── contexts/AuthContext.tsx        # sessão JWT
├── routes/                         # RouteObject[] por contexto + recurso
└── App.tsx                         # createBrowserRouter
```

Path alias: `@` → `resources/js/` (definido em `tsconfig.json` e `vite.config.ts`).

## Skill Map — sempre consulte antes de implementar

Skills vivem em `.cursor/skills/`. Cada uma tem `SKILL.md` (resumo + decisão rápida) e `references/` (templates + exemplos detalhados).

### Backend
| Vou fazer | Skill |
|-----------|-------|
| SOLID, Clean Code, DTO, Service/UseCase, inversão de dependência e separação de camadas | [`backend-clean-code`](.cursor/skills/backend-clean-code/SKILL.md) |
| Fronteira entre módulos backend, contratos públicos, eventos, ADR e extração futura | [`architecture-paradigm-modular-monolith`](.cursor/skills/architecture-paradigm-modular-monolith/SKILL.md) |
| Criar recurso CRUD (Controller + Service + Repository + Contract + Request + Route) | [`backend-module`](.cursor/skills/backend-module/SKILL.md) |
| Modelar Eloquent (Model, scopes, casts, observers, relacionamentos, transações) | [`laravel-eloquent`](.cursor/skills/laravel-eloquent/SKILL.md) |
| Job async (WhatsApp, PDF, upload R2, e-mail) | [`laravel-queues`](.cursor/skills/laravel-queues/SKILL.md) |
| Tipos modernos (Enum, DTO readonly, Value Object, match, never) | [`php-modern`](.cursor/skills/php-modern/SKILL.md) |
| Testes PHPUnit + Mockery + Laravel fakes | [`php-testing`](.cursor/skills/php-testing/SKILL.md) |

### Frontend
| Vou fazer | Skill |
|-----------|-------|
| Estrutura DDD (domain → application → infra → page → route) | [`frontend-ddd`](.cursor/skills/frontend-ddd/SKILL.md) |
| Hooks customizados, performance, React 19 (useActionState, useOptimistic, use()) | [`frontend-react`](.cursor/skills/frontend-react/SKILL.md) |
| Testes Vitest + React Testing Library | [`frontend-testing`](.cursor/skills/frontend-testing/SKILL.md) |
| **UI: componentes, cores, sidebar, popover, cursor, layouts** | [`frontend-ui-patterns`](.cursor/skills/frontend-ui-patterns/SKILL.md) |
| **Telas v2: design system `@/components/ds` (tokens `--ds-*`, Poppins, dark mode)** | [`design-system`](.cursor/skills/design-system/SKILL.md) |
| ListPage com DataTable, Forms RHF+Zod, Dialog, componentes custom | [`forms-shadcn`](.cursor/skills/forms-shadcn/SKILL.md) |
| Usar `apiClient`, criar Repository, JWT multi-guard, impersonation | [`api-client`](.cursor/skills/api-client/SKILL.md) |

### Cross-cutting
| Vou fazer | Skill |
|-----------|-------|
| Autorização (Policies backend + permissions.ts + RequireClinicAdmin) | [`security`](.cursor/skills/security/SKILL.md) |
| Protótipo descartável para responder uma dúvida de desenho (lógica/estado em HTML único, ou variantes de UI via `?variant=`) | [`prototype`](.cursor/skills/prototype/SKILL.md) |

## Princípios não-negociáveis

1. **Backend é fonte de verdade.** Frontend nunca decide autorização efetiva, validação de segurança, ou regra de negócio crítica. Frontend esconde para UX; backend protege para valer.
2. **Backend limpo por padrão.** Controller não pensa; Service/UseCase decide; Repository busca/salva; DTO transporta; Entity/Model protege regra pequena; Interface desacopla. Veja [`backend-clean-code`](.cursor/skills/backend-clean-code/SKILL.md).
3. **Monólito modular no backend.** Módulos não importam internals de outros módulos para regra de negócio. Veja [`architecture-paradigm-modular-monolith`](.cursor/skills/architecture-paradigm-modular-monolith/SKILL.md).
4. **Camadas separadas no frontend.** Loader chama `application/`, nunca `infrastructure/`. Página não importa `apiClient`. Veja [`frontend-ddd`](.cursor/skills/frontend-ddd/SKILL.md).
5. **`apiClient` é o único caminho HTTP.** Sem `fetch` direto. Veja [`api-client`](.cursor/skills/api-client/SKILL.md).
6. **Domain puro.** `domain/` só tem entidade em camelCase, sem `_at`, sem `ApiXxx`, sem `WriteDto`, sem constantes de UI.
7. **Form com 2+ campos → RHF + Zod.** Algumas pages legadas usam `useState` (ex.: `FeatureNewPage`) — não copiar. Veja [`frontend-ddd/references/forms.md`](.cursor/skills/frontend-ddd/references/forms.md).

## Code Style

- **PHP:** Laravel Pint (`./vendor/bin/pint`). Sem `declare(strict_types=1)` por convenção atual — ver [`php-modern`](.cursor/skills/php-modern/SKILL.md). Null com `is_null()` / `!is_null()`; string vazia com `empty()` / `!empty()`.
- **JS/TS:** Prettier (4 espaços, single quotes, organized imports), ESLint, TypeScript strict.
- **Tipos:** entidades de negócio só em `domain/`. Sem `any` novo sem justificativa.

## Referências complementares

- `frontend-standards-fisio.md` — documento original de padrões frontend (mantido como histórico; a fonte canônica agora são as skills).

<!-- SPECKIT START -->
Current active Spec Kit plan: `specs/015-patient-program-experience/plan.md`.
Read this plan for feature scope, technical context, and validation artifacts
before implementing tasks for the active feature.
<!-- SPECKIT END -->

<!-- BEGIN ai-harness -->
## Ciclo de trabalho

Cada etapa tem uma skill em `.cursor/skills/`, e cada uma diz qual é a próxima:

`especificar` (opcional: cria `.ai-workbench/NNN-<slug>/` com `spec.md`, no
estilo do `/speckit-specify`; o usuário revisa) → `refinar` →
`escrever-plano` (cria a pasta, se ainda não existe, com `README.md` e
`plans/`) → `criar-tarefas` (salva em `tasks/` da feature) →
`implementar-tarefa` (teste primeiro, termina na Definição de Pronto) →
`revisao-adversaria`.

Cada feature tem a própria pasta em `.ai-workbench/` com `README.md`, `plans/`,
`tasks/`, `evidence/`, `review/` e `DEFERRED.md`; a raiz tem um `DEFERRED.md`
para o que não pertence a nenhuma feature. Detalhes na seção "Pasta de
trabalho" da Definição de Pronto.

## Definição de Pronto

Uma tarefa **não** está pronta só porque o código roda. Antes de dizer que
terminou, passe por cada item que se aplica de
`docs/ai-harness/DEFINITION_OF_DONE.md` e só afirme que está pronto quando todos
passarem, dizendo qual item pulou e por quê.

Dois itens são os mais fáceis de pular:

- **Smoke test com evidência** em `.ai-workbench/<feature>/evidence/<tarefa>/`, com o
  `SUMMARY.md` que o revisor lê, incluindo o caso de outra clínica. Pulou? Diga
  o motivo também no pedido ao revisor.
- **Revisão adversária** com a skill `revisao-adversaria`, até o veredito
  APROVADO, no máximo 3 rodadas.

`bash bin/verificar.sh` roda os testes e as verificações nos arquivos que
mudaram desde a `main`. O que ficar fora do escopo vai para o `DEFERRED.md` da
feature na hora em que a decisão for tomada.
<!-- END ai-harness -->
