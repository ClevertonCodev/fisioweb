---
name: php-testing
description: Escrever testes PHPUnit + Mockery para o Laravel modular do fisioweb. Use ao criar testes Unit ou Feature em qualquer módulo (Admin, Clinic, Patient, Media etc.), testar Controller via HTTP, mockar Repository/Service via Interface, montar fixtures com Eloquent Factory + RefreshDatabase, ou autenticar com guard JWT (`admin`/`clinic`). Cobre estrutura de testes em modules, namespace Modules, `actingAs($user, 'guard')`, envelope `data` em assertions JSON, snake_case em nomes de teste e Mockery vs createMock.
metadata:
  domain: testing
  triggers: phpunit, pest, test, teste, mockery, refreshDatabase, factory, actingAs, assertion, composer test
  scope: implementation
  output-format: code
  related-skills: backend-clean-code, architecture-paradigm-modular-monolith, backend-module, php-modern
---

# PHP Testing (fisioweb)

Padrão de testes para o Laravel modular deste projeto. Stack: **PHPUnit 11.5+ + Mockery 1.6+**. Sem Pest e sem PHPStan configurados.

## Quando usar

- Cobrindo Service ou Repository novo com Unit tests.
- Testando Controller via Feature test (HTTP + DB).
- Mockando dependências via Contracts (`<Entity>RepositoryInterface`, `<Entity>ServiceInterface`).
- Adicionando fixtures com Factory (`<Entity>::factory()->create()`).
- Cobrindo autorização (Policies + middleware `auth:<guard>`).
- Cobrindo contrato/evento entre módulos ou evitando regressão de dependência cross-module — carregue [`architecture-paradigm-modular-monolith`](../architecture-paradigm-modular-monolith/SKILL.md).
- Testando se Controller fica fino, Service decide e Repository só persiste — carregue [`backend-clean-code`](../backend-clean-code/SKILL.md).

## Core mandates

### Deve fazer
- Colocar testes em `modules/<Module>/tests/Unit/` ou `modules/<Module>/tests/Feature/`.
- Namespace: `Modules\<Module>\Tests\Unit\` ou `Modules\<Module>\Tests\Feature\`.
- Estender `Tests\TestCase` (raiz do projeto).
- Usar `RefreshDatabase` em qualquer teste que toque o DB.
- Métodos de teste em **snake_case**: `test_index_returns_paginated_exercises()`.
- Autenticar com guard correto: `$this->actingAs($user, 'admin')` ou `$this->actingAs($user, 'clinic')`.
- Asserções JSON respeitando wrapper `data` (e `data.data` quando o controller retorna paginator).
- Mockar Repository/Service via Interface, nunca a classe concreta.
- Em teste de Service, mockar RepositoryInterface apenas do próprio módulo. Para outro módulo, mockar contrato público definido pela arquitetura, evento ou endpoint/read model.

### Não deve fazer
- Adicionar `declare(strict_types=1)` no teste (projeto não usa).
- Usar `App\` namespace — é `Modules\<Module>\`.
- Mockar Eloquent Model (use Factory).
- Testar via classe concreta de Repository (use Interface no `createMock`).
- Usar teste para legitimar dependência direta em Model/Repository de outro módulo.
- Acessar `$response->json('data')` esperando array de itens quando o controller retorna paginator (é `data.data`).
- Esquecer de chamar `parent::setUp()` no `setUp()`.

## Comandos

```bash
composer run test                  # roda toda a suite (limpa config + phpunit)
./vendor/bin/phpunit               # phpunit direto
./vendor/bin/phpunit --filter test_index_returns_paginated   # filtrar por nome
./vendor/bin/phpunit modules/Clinic/tests/Feature/           # rodar um módulo
```

## Estrutura de pastas

```
modules/<Module>/tests/
├── Unit/                  # Service, Repository, helper sem HTTP nem DB pesado
│   └── <Entity>ServiceTest.php
└── Feature/               # Controller + HTTP + DB
    └── <Entity>ControllerTest.php
```

`phpunit.xml` já registra ambas as suites para todos os módulos via glob `modules/*/tests/{Unit,Feature}`.

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| Templates completos (Unit Service, Feature Controller, Data Provider, Mockery, fakes do Laravel) | [`references/testing-quality.md`](references/testing-quality.md) | Implementar testes |
| Testes alinhados a SOLID e separação de camadas | [`../backend-clean-code/SKILL.md`](../backend-clean-code/SKILL.md) | Definir o que mockar e onde testar regra |
| Teste de contrato/evento entre módulos backend | [`../architecture-paradigm-modular-monolith/SKILL.md`](../architecture-paradigm-modular-monolith/SKILL.md) | Definir o que deve ser protegido |
| Padrão de módulo Laravel | [`../backend-module/SKILL.md`](../backend-module/SKILL.md) | Entender estrutura do código sob teste |
| Tipos modernos (Enum/DTO/VO) | [`../php-modern/SKILL.md`](../php-modern/SKILL.md) | Testar Enums e DTOs |
| Eloquent (Factory, scopes, observers) | [`../laravel-eloquent/SKILL.md`](../laravel-eloquent/SKILL.md) | Testar Model/Scope/Observer |
| Queues (`Queue::fake`, `assertPushed`) | [`../laravel-queues/SKILL.md`](../laravel-queues/SKILL.md) | Testar dispatch de Job |

## Output esperado

Ao implementar uma feature, entregue (mínimo):

1. **Unit test do Service** — mock do Repository via Interface, cobre cases de regra de negócio (criação, update, delete, erro).
2. **Feature test do Controller** — `RefreshDatabase`, `actingAs($user, 'guard')`, cobre index/show/store/update/destroy + 401/404/422.
3. **Factory** se a entidade ainda não tiver (`modules/<Module>/database/factories/<Entity>Factory.php`).

## Quick decision

| Quero testar | Tipo | Use |
|--------------|------|-----|
| Regra de negócio em Service isolada | Unit | `createMock(RepositoryInterface)` |
| Validação de FormRequest | Feature | `postJson()` + `assertJsonValidationErrors()` |
| Autorização (Policy + guard) | Feature | `actingAs($user, 'guard')` + `assertForbidden/Unauthorized()` |
| Paginação/filtros do index | Feature | `getJson()` + `$response->json('data.data')` |
| Persistência após store/update | Feature | `assertDatabaseHas()` |
| Comportamento de Enum/VO puro | Unit | Sem mock, instancia direto |
| Múltiplas variações de input | Unit | `#[DataProvider]` |
| Comportamento condicional complexo de mock | Unit | Mockery (`shouldReceive`/`andReturn`/`andThrow`) |
