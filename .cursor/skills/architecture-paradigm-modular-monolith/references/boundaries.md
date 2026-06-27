# Boundaries, Contracts and ADRs

## Boundary Checklist

- Nomear o modulo por capacidade de negocio, nao por CRUD tecnico.
- Identificar a entidade/agregado dono e a tabela dona.
- Manter Services, Repositories, Models, Policies e Requests dentro do modulo dono.
- Expor o minimo necessario por ServiceInterface de aplicacao, DTO publico, rota HTTP, evento ou read model.
- Tratar `RepositoryInterface` em `Contracts/` como contrato interno do modulo, nao como API publica para outros modulos.
- Evitar imports cruzados para `Repositories`, `Models` e classes internas de outro modulo.
- Evitar regra de negocio em helpers globais, traits compartilhadas ou services genericos.

## Public Contract Options

Use `ServiceInterface` de aplicacao quando a colaboracao for sincrona dentro do mesmo processo Laravel e precisar resposta imediata. Nao use `RepositoryInterface` de outro modulo como contrato de integracao.

Use endpoint REST quando a interacao deve parecer externa ao backend ou quando o consumidor e HTTP.

Use DTO readonly quando o contrato atravessa modulo backend e precisa estabilidade. O DTO deve usar nomes idiomaticos PHP e nao vazar estrutura de tabela.

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
- Migration de um modulo alterando tabela claramente pertencente a outro modulo sem ADR.
- RepositoryInterface de um modulo sendo injetada em Service de outro modulo.

## Acceptable Exceptions

Permita excecao pequena e documentada quando o custo de criar contrato superar o risco, mas registre:

- Por que a excecao existe.
- Qual caminho remove a excecao.
- Qual teste evita crescer o acoplamento.
