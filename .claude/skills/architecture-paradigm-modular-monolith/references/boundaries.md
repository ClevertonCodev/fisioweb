# Boundaries, Contracts and ADRs

## Boundary Checklist

- Nomear o modulo por capacidade de negocio, nao por CRUD tecnico.
- Identificar a entidade/agregado dono e a tabela dona.
- Manter Services, Repositories, Models, Policies e Requests dentro do modulo dono.
- Expor o minimo necessario em `Contracts/`, DTOs publicos, rotas HTTP ou eventos.
- Evitar imports cruzados para `Repositories`, `Models` e classes internas de outro modulo.
- Evitar regra de negocio em helpers globais, traits compartilhadas ou services genericos.

## Public Contract Options

Use `ServiceInterface` quando a colaboracao for sincrona dentro do mesmo processo Laravel e precisar resposta imediata.

Use endpoint REST quando o consumidor natural for o frontend ou quando a interacao ja deve parecer externa.

Use DTO readonly quando o contrato atravessa modulo e precisa estabilidade. O DTO deve conter nomes de dominio em camelCase no frontend e nomes idiomaticos PHP no backend; nao vazar estrutura de tabela.

Use evento quando o modulo dono apenas informa que algo aconteceu e outros modulos decidem consequencias.

Use read model/projecao quando a leitura cruzada e frequente, mas o modulo consumidor nao deve controlar os dados originais.

## ADR Template

```markdown
# ADR: <titulo>

## Contexto

<Qual mudanca exige uma decisao de fronteira?>

## Decisao

<Modulo dono, contrato publico, fluxo de dados/eventos.>

## Consequencias

- Beneficios:
- Custos:
- Regras que agentes devem preservar:

## Extracao futura

<O que precisaria mudar para virar microservico?>
```

## Forbidden Dependency Smells

- Controller de um modulo instanciando Repository de outro modulo.
- Service de um modulo escrevendo em tabela de outro modulo.
- Listener recebendo Model Eloquent completo de outro modulo.
- Frontend importando entidade de dominio de outro contexto para representar outra regra.
- Migration de um modulo alterando tabela claramente pertencente a outro modulo sem ADR.

## Acceptable Exceptions

Permita excecao pequena e documentada quando o custo de criar contrato superar o risco, mas registre:

- Por que a excecao existe.
- Qual caminho remove a excecao.
- Qual teste evita crescer o acoplamento.
