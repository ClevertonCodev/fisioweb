---
name: frontend-ddd
description: Arquitetura DDD do frontend React/TypeScript do fisioweb — domain puro (camelCase, sem infra), application com ports + hooks + use-cases puros, infrastructure com mappers snake_case↔camelCase, pages EntityListPage/NewPage/EditPage com loader. Use ao criar feature nova no SPA, adicionar entidade no domain, escrever Repository no infrastructure, criar hook React Query em application, montar página List/New/Edit, ou refatorar componente que quebra a separação de camadas.
metadata:
  domain: architecture
  triggers: frontend, react, ddd, domain, application, infrastructure, ports, repository, mapper, loader, page, EntityListPage, EntityNewPage, EntityEditPage, camelCase
  scope: implementation
  output-format: code
  related-skills: frontend-react, frontend-testing, backend-module
---

# Frontend DDD (fisioweb)

Arquitetura obrigatória do `resources/js/`. Referência completa em `frontend-standards-fisio.md` e `CLAUDE.md`. Esta skill é o **resumo acionável + templates** prontos pra uso.

## Quando usar

- Criando feature nova no SPA (`pages/admin/<recurso>/` ou `pages/clinic/<recurso>/`).
- Adicionando entidade nova no `domain/`.
- Escrevendo Repository concreto no `infrastructure/repositories/`.
- Criando hook React Query novo em `application/`.
- Migrando feature que usa `mock-*` repository para API real.
- Refatorando página que está furando camada (ex.: importando `infrastructure/` direto).

## Skill Map — quando carregar outra skill

| Estou fazendo | Carregue |
|--------------|----------|
| Hooks customizados, useEffect, memo, useMemo, useCallback, useActionState, useOptimistic | [`frontend-react`](../frontend-react/SKILL.md) |
| Escrever teste de hook/página/repository com Vitest+RTL | [`frontend-testing`](../frontend-testing/SKILL.md) |
| Backend que vai servir esta feature | [`../backend-module/SKILL.md`](../backend-module/SKILL.md) |

## Estrutura de pastas — responsabilidade por camada

```
resources/js/
├── domain/<contexto>/           # Tipos puros de negócio, camelCase
│   └── <entity>.ts
├── application/<contexto>/      # Hooks + ports (DTOs de escrita) + use-cases puros
│   ├── ports.ts                  # Interface do Repository + WriteDtos
│   ├── use-<entities>.ts         # React Query hooks + funções puras
│   └── index.ts                  # Barrel
├── infrastructure/
│   ├── api/client.ts             # Axios + JWT interceptor (NUNCA editar)
│   └── repositories/
│       └── api-<context>-<entities>.ts   # Implementa Repository + mappers
├── pages/<contexto>/<recurso>/  # Composição de tela
│   ├── <Entity>ListPage.tsx
│   ├── <Entity>NewPage.tsx
│   └── <Entity>EditPage.tsx
├── routes/<contexto>/           # RouteObject[] com loaders
│   └── <recurso>-routes.tsx
└── components/<contexto>/       # Componentes específicos do contexto
```

| Camada | Pode | Não pode |
|--------|------|----------|
| `domain/` | Tipos de negócio puros (interface, type, union). camelCase. | Importar de application/infra. Conter `created_at`/`updated_at`. Conter shapes de API. Conter DTOs de escrita. Conter constantes de UI. |
| `application/ports.ts` | Definir `XxxRepository` interface + `XxxWriteDto`. Importar de `domain/`. | Importar de `infrastructure/`. |
| `application/use-<x>.ts` | Hooks React Query (useQuery/useMutation), funções puras (`listXxx`, `findXxxById`), constantes de UI (`featureTypes`). | Conter JSX. Tocar DOM. |
| `infrastructure/repositories/` | Implementar Repository, `apiClient.get/post`, `ApiXxx` interno privado, `toEntity()`/`toApiPayload()`. | Vazar `ApiXxx` para fora. Importar de `pages/`. |
| `routes/` | `RouteObject` + `loader` que chama **`application/`**. | Importar de `infrastructure/` direto. |
| `pages/` | Composição, useLoaderData/useRevalidator, hooks de `application/`, components. | `fetch()` direto. Importar `apiClient`. Regra de negócio crítica. |
| `components/` | UI reutilizável, Props bem tipados. | Importar `apiClient`. Acessar `useLoaderData`. |

## Core mandates

### Deve fazer
- `domain/` tem **somente** entidade pura em camelCase. Não há `_at`, não há `ApiXxx`, não há DTOs de escrita.
- `application/ports.ts` define o contrato `XxxRepository`.
- `application/use-<entity>.ts` exporta hooks React Query + funções puras `listXxx`/`findXxxById` que loaders consomem.
- `infrastructure/repositories/api-<x>-<y>.ts` define `ApiXxx` internos (snake_case), `mapXxx()`, e implementa a interface.
- Loader **importa de `@/application`**, nunca de `@/infrastructure`.
- Pages usam `useLoaderData` para dados iniciais + hooks de `application/` para mutations.
- HTTP só via `apiClient` de `@/infrastructure/api/client`.
- Forms com **React Hook Form + Zod** (mesmo que algumas pages legadas usem `useState` — não copie o padrão antigo).
- `queryKey` determinística e específica do contexto: `['admin', 'features', params]`.
- Mutations invalidam keys relacionadas no `onSuccess` e exibem `toast.error` no `onError`.

### Não deve fazer
- Importar `@/infrastructure/repositories/...` em página ou em loader.
- Colocar `created_at` / `updated_at` em entidade de `domain/`.
- Colocar `ApiXxxResponse` ou `XxxWriteDto` em `domain/`.
- Colocar `featureTypes` (constante de UI) em `domain/`.
- Usar `fetch()` direto — sempre `apiClient`.
- Usar `any` sem justificativa explícita.
- Duplicar parsing do mesmo payload em duas pages — extrair pra mapper na infra.
- Page A importar estado interno de Page B.
- Mock repository fora de `infrastructure/repositories/mock-*.ts`.

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| Templates completos (domain, ports, repo, hooks, mappers, pages, loader, route) | [`references/templates.md`](references/templates.md) | Implementar feature nova ponta-a-ponta |
| Padrão de Forms (RHF + Zod) | [`references/forms.md`](references/forms.md) | Criar/refatorar formulário |

## Output esperado

Ao criar feature nova (ex.: "Convênios"), entregue **nesta ordem**:

1. **Domain** `domain/clinic/agreement.ts` — entidade pura, camelCase.
2. **Ports** atualiza `application/clinic/ports.ts` — `AgreementsRepository` + `AgreementWriteDto`.
3. **Infra** `infrastructure/repositories/api-clinic-agreements.ts` — `ApiAgreement` privado + `mapAgreement` + impl.
4. **Barrel infra** `infrastructure/repositories/index.ts` exporta `apiClinicAgreementsRepository`.
5. **Application** `application/clinic/use-agreements.ts` — `listAgreements()`/`findAgreementById()` puras + `useAgreements`/`useCreateAgreement`/`useUpdateAgreement`/`useDeleteAgreement`.
6. **Barrel application** `application/clinic/index.ts` re-exporta tudo.
7. **Pages** `pages/clinic/agreement/AgreementListPage.tsx` + `AgreementNewPage.tsx` + `AgreementEditPage.tsx`.
8. **Routes** `routes/clinic/agreement-routes.tsx` — `RouteObject[]` com loader chamando `listAgreements`.
9. **Plug** rota no `routes/clinic-routes.tsx`.
10. **Tests** Vitest pelo repositório e por hook crítico — ver [`frontend-testing`](../frontend-testing/SKILL.md).

## Quick decision

| Cenário | Use |
|---------|-----|
| Entidade nova | `domain/<contexto>/<entity>.ts` em camelCase |
| Lista paginada | Repository retorna `{ data, meta }` + hook `useQuery` com `queryKey: [ctx, 'entities', params]` |
| Form de create | RHF + Zod + `useMutation` em `application/` |
| Loader inicial da lista | Função pura `listXxx()` em `application/`, chamada pelo `loader: async () => ({...})` |
| Mutation invalida 2+ keys | `queryClient.invalidateQueries` no `onSuccess` para cada key |
| Mapper snake↔camel | `function mapXxx(raw: ApiXxx): Xxx` no arquivo do repositório (privado) |
| Constante de UI (labels, options) | Exportada de `application/`, NUNCA de `domain/` |
| Tela com tab interno | Componente em `pages/<ctx>/<recurso>/components/` ou em `components/<ctx>/` |
| Página > 250 linhas | Quebrar em blocos em `pages/<ctx>/<recurso>/components/` |
| Reutilizar query em 2 pages | Hook único em `application/`, ambas chamam |
