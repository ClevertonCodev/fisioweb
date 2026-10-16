---
name: php-modern
description: Recursos modernos de PHP 8.2+ aplicados ao Laravel modular do fisioweb. Use quando escrever PHP novo (Service, Repository, DTO, Value Object, Enum, FormRequest), refatorar arrays "stringly typed" para enums, criar DTOs readonly, modernizar match/switch, ou tipar retornos de função. Cobre strict types, enums com métodos, classes/propriedades readonly, atributos, match expressions, first-class callables, never type e union/intersection types.
metadata:
  domain: language
  triggers: PHP, PHP 8.2, PHP 8.3, enum, readonly, DTO, value object, match, never, strict types, Eloquent, Laravel
  scope: implementation
  output-format: code
  related-skills: backend-clean-code, architecture-paradigm-modular-monolith, backend-module, php-testing
---

# PHP Modern (fisioweb)

Recursos PHP 8.2+ aplicados ao padrão Service/Repository deste projeto Laravel modular. Esta skill **não** substitui o padrão arquitetural — ela mostra como escrever **dentro** dele com mais expressividade e segurança de tipo.

## Quando usar

- Criando Service/Repository novo em `modules/<Module>/` (ver skill [`backend-module`](../backend-module/SKILL.md)).
- Modelando entidade nova com status/tipo que hoje seria um conjunto de constantes.
- Recebendo payload complexo em Service e querendo tipar (substituir `array $data` por DTO). Para decidir se DTO/Service/Repository estão no lugar certo, carregue [`backend-clean-code`](../backend-clean-code/SKILL.md).
- Modelando conceito de domínio (Duration, Score, Money) — Value Object readonly.
- Mapeando valor → valor (label, cor, status HTTP) — usar `match` em vez de `if`/`switch`.
- Criando DTO/Enum/Value Object usado como contrato entre módulos — antes carregue [`architecture-paradigm-modular-monolith`](../architecture-paradigm-modular-monolith/SKILL.md).

## Contexto do projeto (importante)

- **PHP `^8.2`**, Laravel `^12.0`.
- O código **atual** do projeto **não usa `declare(strict_types=1)`**. Para arquivos novos em módulos novos, é aceitável adotar — só não misture dentro do mesmo módulo sem alinhar com o time.
- Construtores promovidos com `protected` injectado é o padrão dominante (ver `modules/Admin/app/Services/ExerciseService.php`). `private readonly` aparece em algumas classes (`AdminProgramService`) — ambos são aceitos.
- **Enums não estão difundidos hoje**: `Feature::ALLOWED_KEYS` e `Feature::TYPES` são arrays de constantes. Para entidades **novas**, prefira Enum tipado. Migrar entidades existentes exige plano de dados.
- Sem PHPStan/Psalm configurado. Tipagem forte ainda traz ganho via IDE.
- Tipos em `app/Data`, `app/Enums` e `app/ValueObjects` são internos ao módulo por padrão. Só trate como contrato público quando a skill de arquitetura definir esse papel.

## Core mandates

### Deve fazer
- Tipar **todos** os parâmetros e retornos de método (inclusive `void`, `never`, `?Type`).
- Promover propriedades no construtor.
- Usar `readonly` em propriedades que nunca devem mudar após construção (DTO, Value Object, configuração).
- Usar `Enum` tipado para status, tipos, categorias finitas em entidades novas.
- Usar `match` (não `switch`/`if/elseif`) para mapeamento valor → valor.
- Usar `never` no retorno de métodos que sempre lançam exception ou chamam `exit`.
- Checar null com `is_null()` / `!is_null()` — não usar `=== null` nem `!== null`.
- Checar string vazia com `empty()` / `!empty()` — não usar `=== ''` nem `!== ''`.

### Não deve fazer
- Adicionar `declare(strict_types=1)` em arquivo que já existe sem revisar callers.
- Introduzir Enum em entidade existente sem migration de dados.
- Usar Fibers — o projeto é Laravel síncrono, runtime não é async.
- Criar Attribute custom para roteamento/middleware — Laravel já tem `Route::` facade e middleware groups.
- Trocar `array $data` por DTO em CRUD trivial — overhead sem ganho.
- Exportar tipo interno de um módulo para outro sem definir ownership e estabilidade do contrato.

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| Features PHP 8.2+ adaptadas ao fisioweb | [`references/php-features.md`](references/php-features.md) | Tipos, enums, readonly, match, never, callable |
| DTO/Enum/VO atravessa módulos backend | [`../architecture-paradigm-modular-monolith/SKILL.md`](../architecture-paradigm-modular-monolith/SKILL.md) | Definir contrato público e estabilidade |
| SOLID, DTO por camada e inversão de dependência | [`../backend-clean-code/SKILL.md`](../backend-clean-code/SKILL.md) | Decidir onde colocar regra e como tipar sem acoplar |
| Padrão de módulo Laravel | [`../backend-module/SKILL.md`](../backend-module/SKILL.md) | Criar novo recurso CRUD |
| Testes (PHPUnit + Mockery) | [`../php-testing/SKILL.md`](../php-testing/SKILL.md) | Escrever testes para o código novo |

## Output esperado

Ao implementar uma feature, entregue (nesta ordem):

1. **Enum** (se houver status/tipo finito) em `modules/<Module>/app/Enums/`.
2. **DTO readonly** (se payload não-trivial) em `modules/<Module>/app/Data/`.
3. **Value Object** (se conceito de domínio) em `modules/<Module>/app/ValueObjects/`.
4. **Model** com `$casts` apontando para Enum, relacionamentos tipados.
5. **Service** com `match` para regras de mapeamento, `never` em helpers que lançam.
6. **Repository** com retornos `?Entity` / `Entity` / `LengthAwarePaginator` corretos.
7. **Test** cobrindo enum cases, DTO factories, regras de negócio do Service.

## Quick decision

| Cenário | Use |
|---------|-----|
| Status com 3-10 valores possíveis | `Enum: string` com `label()`, `badgeColor()` |
| Payload de criação com 5+ campos | `final readonly` DTO + `fromValidated()` |
| Conceito de domínio com regras (Money, Duration) | `final readonly` Value Object com método de comportamento |
| Mapeamento status → cor/label/preço | `match($enum)` exaustivo |
| Helper que sempre lança/encerra | retorno `: never` |
| CRUD trivial (1-3 campos) | Continue com `array $data` |
| Quer adicionar `strict_types` | Só em arquivo novo de módulo novo, alinhar antes |
| Valor é null? | `is_null($x)` / `!is_null($x)` |
| String vazia ou filtro opcional? | `empty($x)` / `!empty($x)` |
