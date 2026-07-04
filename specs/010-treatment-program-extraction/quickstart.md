# Quickstart — Validação da extração TreatmentProgram

Guia para validar que a extração preservou comportamento e fronteiras. Não contém código de implementação (ver `tasks.md`).

## Pré-requisitos

```bash
composer install
# módulo habilitado em modules_statuses.json: "TreatmentProgram": true
```

## 1. Formatação e boot

```bash
./vendor/bin/pint
php artisan config:clear && php artisan route:clear
php artisan about        # backend sobe sem erro de provider
```

## 2. Rotas preservadas (contrato REST)

```bash
php artisan route:list --path=clinic
```

**Esperado** — todas presentes, apontando para `Modules\TreatmentProgram\Http\Controllers`:
- `clinic.treatment-plans.{index,pdf,show,store,update,destroy,duplicate,to-model}`
- `clinic.program-drafts.{show,upsert,destroy}`
- `clinic.programs.{index,show}`

**Não deve** haver rota de prescrição/programa apontando para `Modules\Clinic\...` (sem duplicação).

## 3. Migrations no módulo dono

```bash
ls modules/TreatmentProgram/database/migrations   # 5 arquivos (4 create + 1 alter engagement)
ls modules/Clinic/database/migrations | grep -E 'treatment|program_draft'   # vazio
php artisan migrate:fresh --seed                   # verde; popula planos demo
```

## 4. Fitness tests (arquitetura)

```bash
vendor/bin/phpunit tests/Architecture
```

**Cobre**: controllers ∈ `TreatmentProgram`; migrations no módulo; rotas preservadas/sem duplicação; sem import de `Admin\Models\Exercise`/`AdminProgram`, `Patient\Models\Patient`, `Media\Models\*` em Services/Repositories/Controllers de produção; eventos sem Model Eloquent; Controller→ServiceInterface, Service→RepositoryInterface.

## 5. Testes do módulo (comportamento preservado)

```bash
vendor/bin/phpunit modules/TreatmentProgram/tests
```

**Cobre** (25 métodos migrados + novos): CRUD de plano, duplicate, to-model, PDF, 404 cross-clinic, policies (viewAny/view/create/update/delete/duplicate), rascunho (show/upsert/destroy por usuário), notificação de ativação (ex-observer → listener), e eventos afterCommit.

## 6. Dashboard não quebrou (preocupação explícita)

```bash
vendor/bin/phpunit --filter Dashboard modules/Clinic/tests
# manual: GET /api/clinic/dashboard → active_programs mantém o mesmo valor
# manual: GET /api/clinic/dashboard/activities → feed inclui program_created/program_completed/exercises_added
```

## 7. Cenários de aceitação (mapa)

| Cenário (spec) | Validação |
|----------------|-----------|
| US1 — REST inalterado | passos 2, 5 |
| US1 — dashboard `active_programs` | passo 6 |
| US2 — fronteira limpa | passos 3, 4 |
| US3 — eventos afterCommit sem Model | passos 4, 5 |
| US3 — WhatsApp via listener de `TreatmentPlanActivated` | passo 5 (teste do listener) |

## Definition of Done

- [ ] `pint` limpo; backend sobe.
- [ ] `route:list --path=clinic` idêntico ao baseline; controllers em `TreatmentProgram`; sem duplicação no Clinic.
- [ ] Migrations de prescrição só em `modules/TreatmentProgram`; `migrate:fresh --seed` verde.
- [ ] `tests/Architecture` verde (incl. novo `TreatmentProgramRouteCompatibilityTest`).
- [ ] `modules/TreatmentProgram/tests` verde.
- [ ] Dashboard `active_programs` + feed de atividades inalterados.
- [ ] ADR-010, capability map e readiness checklist atualizados.
