---
name: laravel-eloquent
description: Padrões Eloquent aplicados ao Laravel modular do fisioweb — modelos com casts e scopes, accessor/mutator com sintaxe Attribute, custom casts, eager loading sem N+1, chunk/lazy para datasets grandes, queries condicionais com when(), transações com DB::transaction, e Observers para reagir a eventos de model. Use ao modelar entidade nova, otimizar query lenta, refatorar accessor antigo, criar custom cast, reagir a evento de criação/atualização de model, ou diagnosticar N+1.
metadata:
  domain: framework
  triggers: model, eloquent, scope, accessor, mutator, cast, observer, with, withCount, chunk, lazy, N+1, DB::transaction, softdeletes
  scope: implementation
  output-format: code
  related-skills: backend-clean-code, architecture-paradigm-modular-monolith, backend-module, laravel-queues, php-testing, php-modern
---

# Laravel Eloquent (fisioweb)

Padrões Eloquent que já estão no codebase ou que cabem como evolução natural. Espelha como `Exercise`, `AdminProgram`, `AdminAssessmentTemplate`, `PatientFile` e outros Models estão estruturados em `modules/`.

## Quando usar

- Criando Model novo em `modules/<Module>/app/Models/`.
- Adicionando relacionamento (BelongsTo, HasMany, BelongsToMany, polymorphic).
- Otimizando listagem lenta — eager loading, `withCount`, subqueries.
- Refatorando "cast manual" no Service para `protected function casts()` ou Custom Cast.
- Reagindo a evento de model (post-create, post-update) com Observer — ver `TreatmentPlanObserver`.
- Modelando query reutilizável → vira Scope (`scopeActive`, `scopeForClinic`).
- Criando relacionamento ou query que toca Model/tabela de outro módulo — antes carregue [`architecture-paradigm-modular-monolith`](../architecture-paradigm-modular-monolith/SKILL.md).
- Decidindo se uma regra fica no Model, Service ou Repository — carregue [`backend-clean-code`](../backend-clean-code/SKILL.md).

## Contexto do projeto (importante)

- **Laravel 12**, Eloquent moderno.
- Casts via **método** `protected function casts(): array` (não a propriedade `$casts` antiga) — `Exercise` é referência.
- Scopes locais difundidos: `scopeActive` em `Exercise`, `AdminAssessmentTemplate`, `AdminProgram`. `scopeForClinic($query, int $clinicId)` em `PatientFile`. Use o padrão.
- **`SoftDeletes`** em uso (`Exercise`). Migration precisa de `softDeletes()`.
- **Observers** em uso: `TreatmentPlanObserver` (dispara `SendWhatsAppMessageJob` em mudança de status), `ClinicObserver`. Registro vai no `<Module>ServiceProvider::boot()`.
- **`DB::transaction()`** já é padrão em Services com múltiplas tabelas (ver `AdminProgramService::create`).
- **Sem Custom Casts** hoje — campo livre quando precisar serializar Value Object.
- **Sem Accessor com sintaxe `Attribute::make`** hoje — pode introduzir em Model novo sem regressão.
- Repositórios fazem o `with([...])` central (ver `ExerciseRepository::paginate`). Eager loading é responsabilidade do Repository, não do Controller.
- Models e Repositories pertencem ao módulo dono. Relações com Models de outro módulo exigem decisão explícita de ownership; não use Eloquent cross-module como atalho para regra de negócio.

## Core mandates

### Deve fazer
- Declarar `$fillable` explícito (nunca `protected $guarded = []`).
- Declarar casts via método `protected function casts(): array`.
- Tipar retorno de relacionamento: `: BelongsTo`, `: HasMany`, `: BelongsToMany`.
- Tipar parâmetros de Scope: `scopeForClinic($query, int $clinicId)`.
- Usar `with([...])` no Repository, **nunca** confiar em lazy loading dentro de loop.
- Usar `DB::transaction(...)` em Service quando criar/atualizar envolver múltiplas tabelas.
- Registrar Observer em `<Module>ServiceProvider::boot()` via `Model::observe(Observer::class)`.
- Manter escrita em tabelas do próprio módulo; escrita cross-module exige decisão arquitetural.

### Não deve fazer
- Acessar relacionamento dentro de loop sem `with()` (N+1).
- Colocar lógica de negócio em `boot()` ou closure de evento — extraia para Observer.
- Fazer `Model::all()` em listagem com filtro de usuário — sempre `->paginate()` no Repository.
- Usar `$guarded = []` — abre porta a mass assignment.
- Usar Accessor para formatar output que é responsabilidade da API Resource/frontend.
- Escrever em tabela de outro módulo via Model/Repository direto.
- Usar Observer de Model como contrato implícito entre módulos; para isso prefira evento de domínio/integração.

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| Padrões completos (modelo, scopes, casts, observers, queries, transações) | [`references/eloquent.md`](references/eloquent.md) | Implementar Model ou query |
| Responsabilidade de Model, Service e Repository | [`../backend-clean-code/SKILL.md`](../backend-clean-code/SKILL.md) | Evitar God Model, controller gordo ou repository com regra |
| Fronteira entre módulos backend | [`../architecture-paradigm-modular-monolith/SKILL.md`](../architecture-paradigm-modular-monolith/SKILL.md) | Relacionamento/query/transação toca outro módulo |
| Estrutura de módulo (Service/Repository) | [`../backend-module/SKILL.md`](../backend-module/SKILL.md) | Criar recurso CRUD |
| Tipos modernos (Enum em `$casts`, DTO de input) | [`../php-modern/SKILL.md`](../php-modern/SKILL.md) | Modelar status/tipo |
| Disparar Job a partir de Observer | [`../laravel-queues/SKILL.md`](../laravel-queues/SKILL.md) | Reagir a evento async |
| Testar Model + Scope | [`../php-testing/SKILL.md`](../php-testing/SKILL.md) | Cobrir Eloquent |

## Output esperado

Ao criar Model novo, entregue (nesta ordem):

1. **Migration** com FK, índices, `softDeletes()` se aplicável.
2. **Factory** em `modules/<Module>/database/factories/`.
3. **Model** com `$fillable`, `casts()`, relacionamentos tipados, scopes reutilizáveis.
4. **Observer** (se há reação a evento) + registro em `<Module>ServiceProvider`.
5. **Repository** que aplica eager loading no `paginate()`.
6. **Testes**: Unit para scopes/casts, Feature para fluxo completo.

## Quick decision

| Cenário | Use |
|---------|-----|
| Filtro reutilizável em N consultas | Local scope `scopeXxx($query, ...)` |
| Filtro global em todas as queries do Model | Global scope (cuidado — afeta tudo) |
| Status finito em coluna | Enum + cast `protected function casts()` (ver [`php-modern`](../php-modern/SKILL.md)) |
| JSON column → array | `'col' => 'array'` ou `'col' => AsArrayObject::class` |
| Value Object → coluna primitiva | Custom Cast em `modules/<Module>/app/Casts/` |
| Listagem com relacionamento | `with([...])` no Repository |
| Contar relacionamento sem carregar | `withCount('relation')` |
| Dataset grande para processar | `chunk(100, ...)` ou `lazy()` |
| Reagir a create/update/delete | Observer registrado no ServiceProvider |
| Cross-table create/update | `DB::transaction(fn() => ...)` no Service |
| Slug/auto-fill em create | Observer `creating()` |
| Soft delete | `use SoftDeletes;` + migration `softDeletes()` |
