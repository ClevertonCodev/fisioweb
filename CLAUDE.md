# CLAUDE.md

Orientação para Claude Code neste repositório. **Detalhes vivem nas skills em `.claude/skills/`, `.cursor/skills/` e `.agents/skills/`** (Antigravity; mesmo conteúdo; as três canônicas) — este arquivo aponta para onde olhar.

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

# Navegador headless (skill qa-navegador; 1ª vez: cd tools/screenshot && npm install)
node tools/screenshot/screenshot.mjs 'http://localhost:8000/clinica/pacientes' impl
node tools/screenshot/flow.mjs roteiro.json            # fluxo caçando erro (--video só para bug)
node tools/screenshot/frames.mjs video.webm --at 8,17  # vídeo → storyboard.png
```

## Várias tarefas ao mesmo tempo (Docker por worktree)

`bin/fisio-app` dá a cada pasta (checkout ou `git worktree`) o próprio PHP,
Postgres e fila no Docker, com portas sorteadas: `fisio-app new <tarefa>` cria a
worktree `../fisioweb-<tarefa>` e sobe tudo; `fisio-app remove <tarefa>` apaga.
Numa worktree, o `CLAUDE.local.md` da pasta diz como testar e ver no navegador.
Detalhes em [`docker/README.md`](docker/README.md).

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

Skills vivem em **`.claude/skills/`** (Claude Code), **`.cursor/skills/`** (Cursor) e **`.agents/skills/`** (Antigravity). **As três árvores são canônicas** — sem symlink entre elas. Cada uma tem `SKILL.md` (resumo + decisão rápida) e `references/`. Ao criar ou alterar uma skill, atualize **os três** caminhos e rode `bash bin/verificar-skills.sh`. O Antigravity tem ainda os subagentes em `.agents/agents/` e as regras em `.agents/rules/`.

### Backend
| Vou fazer | Skill |
|-----------|-------|
| SOLID, Clean Code, DTO, Service/UseCase, inversão de dependência e separação de camadas | [`backend-clean-code`](.claude/skills/backend-clean-code/SKILL.md) |
| Fronteira entre módulos backend, CRUD dentro do módulo, contratos públicos, eventos, ADR e extração futura | [`architecture-paradigm-modular-monolith`](.claude/skills/architecture-paradigm-modular-monolith/SKILL.md) |
| Modelar Eloquent (Model, scopes, casts, observers, relacionamentos, transações) | [`laravel-eloquent`](.claude/skills/laravel-eloquent/SKILL.md) |
| Job async (WhatsApp, PDF, upload R2, e-mail) | [`laravel-queues`](.claude/skills/laravel-queues/SKILL.md) |
| Tipos modernos (Enum, DTO readonly, Value Object, match, never) | [`php-modern`](.claude/skills/php-modern/SKILL.md) |
| Testes PHPUnit + Mockery + Laravel fakes | [`php-testing`](.claude/skills/php-testing/SKILL.md) |

### Frontend
| Vou fazer | Skill |
|-----------|-------|
| Estrutura DDD (domain → application → infra → page → route) | [`frontend-ddd`](.claude/skills/frontend-ddd/SKILL.md) |
| Hooks customizados, performance, React 19 (useActionState, useOptimistic, use()) | [`frontend-react`](.claude/skills/frontend-react/SKILL.md) |
| Testes Vitest + React Testing Library | [`frontend-testing`](.claude/skills/frontend-testing/SKILL.md) |
| **UI: componentes, cores, sidebar, popover, cursor, layouts** | [`frontend-ui-patterns`](.claude/skills/frontend-ui-patterns/SKILL.md) |
| **Telas v2: design system `@/components/ds` (tokens `--ds-*`, Poppins, dark mode)** | [`design-system`](.claude/skills/design-system/SKILL.md) |
| ListPage com DataTable, Forms RHF+Zod, Dialog, componentes custom | [`forms-shadcn`](.claude/skills/forms-shadcn/SKILL.md) |
| Usar `apiClient`, criar Repository, JWT multi-guard, impersonation | [`api-client`](.claude/skills/api-client/SKILL.md) |

### Cross-cutting
| Vou fazer | Skill |
|-----------|-------|
| Autorização (Policies backend + permissions.ts + RequireClinicAdmin) | [`security`](.claude/skills/security/SKILL.md) |
| Protótipo descartável para responder uma dúvida de desenho (lógica/estado em HTML único, ou variantes de UI via `?variant=`) | [`prototype`](.claude/skills/prototype/SKILL.md) |
| Testar tela no navegador, smoke test de tela, caçar bug, gravar ou assistir vídeo de bug (`tools/screenshot/`, Chromium headless) | [`qa-navegador`](.claude/skills/qa-navegador/SKILL.md) |

### Diagnóstico e arquitetura
| Vou fazer | Skill |
|-----------|-------|
| Levantar pontos de melhoria e candidatos a refatoração (relatório HTML com antes e depois; só o usuário chama) | [`improve-codebase-architecture`](.claude/skills/improve-codebase-architecture/SKILL.md) |
| Desenhar a interface de um módulo, decidir onde fica a costura, desenhar duas vezes antes de refatorar | [`codebase-design`](.claude/skills/codebase-design/SKILL.md) |
| Auditar o débito técnico com arquivo e linha em `.ai-workbench/TECH_DEBT_AUDIT.md` (só o usuário chama) | [`tech-debt-audit`](.claude/skills/tech-debt-audit/SKILL.md) |
| Explicar uma área antiga em linguagem simples, glossário (`docs/glossario.md`) e ADR | [`domain-modeling`](.claude/skills/domain-modeling/SKILL.md) |
| Investigar bug, teste falhando ou comportamento estranho antes de sair corrigindo | [`systematic-debugging`](.claude/skills/systematic-debugging/SKILL.md) |

## Princípios não-negociáveis

1. **Backend é fonte de verdade.** Frontend nunca decide autorização efetiva, validação de segurança, ou regra de negócio crítica. Frontend esconde para UX; backend protege para valer.
2. **Backend limpo por padrão.** Controller não pensa; Service/UseCase decide; Repository busca/salva; DTO transporta; Entity/Model protege regra pequena; Interface desacopla. Veja [`backend-clean-code`](.claude/skills/backend-clean-code/SKILL.md).
3. **Monólito modular no backend.** Módulos não importam internals de outros módulos para regra de negócio. Veja [`architecture-paradigm-modular-monolith`](.claude/skills/architecture-paradigm-modular-monolith/SKILL.md).
4. **Camadas separadas no frontend.** Loader chama `application/`, nunca `infrastructure/`. Página não importa `apiClient`. Veja [`frontend-ddd`](.claude/skills/frontend-ddd/SKILL.md).
5. **`apiClient` é o único caminho HTTP.** Sem `fetch` direto. Veja [`api-client`](.claude/skills/api-client/SKILL.md).
6. **Domain puro.** `domain/` só tem entidade em camelCase, sem `_at`, sem `ApiXxx`, sem `WriteDto`, sem constantes de UI.
7. **Form com 2+ campos → RHF + Zod.** Algumas pages legadas usam `useState` (ex.: `FeatureNewPage`) — não copiar. Veja [`frontend-ddd/references/forms.md`](.claude/skills/frontend-ddd/references/forms.md).

## Code Style

- **PHP:** Laravel Pint (`./vendor/bin/pint`). Sem `declare(strict_types=1)` por convenção atual — ver [`php-modern`](.claude/skills/php-modern/SKILL.md). Null com `is_null()` / `!is_null()`; string vazia com `empty()` / `!empty()`.
- **JS/TS:** Prettier (4 espaços, single quotes, organized imports), ESLint, TypeScript strict.
- **Tipos:** entidades de negócio só em `domain/`. Sem `any` novo sem justificativa.

## Referências complementares

- `frontend-standards-fisio.md` — documento original de padrões frontend (mantido como histórico; a fonte canônica agora são as skills).

<!-- BEGIN ai-harness -->
## Ciclo de trabalho

Cada etapa tem uma skill em `.claude/skills/` / `.cursor/skills/`, e cada uma diz qual é a próxima:

`refinar` (grava cada decisão no `decisoes.md` da feature) → `escrever-plano`
(cria a pasta, se ainda não existe, com `README.md` e `plans/`) →
`criar-tarefas` (salva em `tasks/` da feature e confere que toda história do
plano virou tarefa) → `implementar-tarefa` (teste primeiro, termina na
Definição de Pronto) → `revisao-adversaria`.

Cada feature tem a própria pasta em `.ai-workbench/` com `README.md`,
`decisoes.md`, `plans/`, `tasks/`, `evidence/`, `review/` e `DEFERRED.md`; a
raiz tem um `DEFERRED.md` para o que não pertence a nenhuma feature. Detalhes
na seção "Pasta de trabalho" da Definição de Pronto.

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
