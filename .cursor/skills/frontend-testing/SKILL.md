---
name: frontend-testing
description: Testes do frontend React do fisioweb com Vitest + @testing-library/react. Use ao testar custom hook (renderHook), Repository (mockando apiClient), página com interação (userEvent), formulário com RHF + Zod, ou hook React Query. Cobre estrutura em resources/js/test/, padrão de vi.mock para infrastructure, MSW-less com vi.mock do apiClient, asserts do testing-library/jest-dom, e integração com React Router (browser-router helper).
metadata:
  domain: testing
  triggers: vitest, test, teste frontend, testing-library, renderHook, userEvent, vi.mock, screen, waitFor, fireEvent
  scope: implementation
  output-format: code
  related-skills: frontend-ddd, frontend-react
---

# Frontend Testing (fisioweb)

Padrão de testes do SPA. Stack: **Vitest 4 + @testing-library/react v16 + @testing-library/user-event v14**. Sem MSW — mocks via `vi.mock` no `apiClient` ou no Repository.

## Quando usar

- Testando hook customizado em `application/` (ex.: `usePatient`, `useProgramDraft`).
- Testando Repository em `infrastructure/repositories/` (mappers snake↔camel).
- Testando página com interação (filtro, submit form, navegação).
- Testando componente complexo isolado.
- Cobrindo função pura em `lib/` ou `application/`.

## Comandos

```bash
npm run test                              # vitest run (CI)
npm run test:watch                        # modo watch (dev)
npx vitest run resources/js/test/x.ts     # filtrar por arquivo
npx vitest run -t "nome do teste"         # filtrar por nome
```

## Skill Map — quando carregar outra skill

| Estou testando | Carregue contexto de |
|----------------|----------------------|
| DDD (entidade, port, mapper, página) | [`frontend-ddd`](../frontend-ddd/SKILL.md) |
| Hook customizado / performance | [`frontend-react`](../frontend-react/SKILL.md) |

## Contexto do projeto (importante)

- Testes vivem em `resources/js/test/` (não em `__tests__` ao lado dos arquivos).
- `setup.ts` importa `@testing-library/jest-dom` e poliyfilla `IntersectionObserver`.
- Helper `browser-router.tsx` em `resources/js/test/` para envolver com Router.
- Pattern dominante: `vi.mock('@/infrastructure/repositories/...')` ou `vi.mock('@/infrastructure/api/client')`.
- Testes em **português** no `describe`/`it` (`it('no mount prefere draft do backend ...')`).
- `vi.clearAllMocks()` em `beforeEach` ou `afterEach` para isolar.

## Core mandates

### Deve fazer
- Testes em `resources/js/test/<nome>.test.ts` (lógica/repo) ou `<nome>.test.tsx` (componente).
- Importar com alias `@/...`.
- Mockar dependência externa via `vi.mock('@/...')` no topo do arquivo (hoist).
- `clearAllMocks` entre testes.
- `userEvent.setup()` por teste para interação realista (não use `fireEvent` para click/type).
- `renderHook` para hooks; `render` para componentes.
- `waitFor` para asserts assíncronos (após mutation, fetch, debounce).
- `screen.getByRole`/`getByLabelText`/`getByText` em vez de `getByTestId` (mais robusto).
- Asserts de UI via `expect(el).toBeInTheDocument()` / `.toHaveTextContent(...)` / `.toBeDisabled()`.
- Setup de QueryClientProvider quando o componente usa hooks de React Query.

### Não deve fazer
- Mockar `fetch` direto — não usamos `fetch`, usamos `apiClient`. Mocke o apiClient.
- Usar `getByTestId` quando há accessible name.
- Esquecer `clearAllMocks` (testes vazam estado).
- Asserts síncronos após ação que dispara fetch (vai falhar não-determinístico).
- Testar implementação interna do hook — teste comportamento observável.

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| Templates: Repository, hook React Query, página com loader, form, MSW-less | [`references/testing.md`](references/testing.md) | Implementar teste novo |

## Output esperado

Ao adicionar teste, entregue:

1. Arquivo em `resources/js/test/<nome>.test.ts(x)`.
2. Imports com alias `@/...`.
3. Mocks no topo (hoist) com `vi.mock`.
4. `describe` agrupando por unidade.
5. `it` por comportamento — nome em português descrevendo o caso.
6. `npm run test` passa.

## Quick decision

| Cenário | Use |
|---------|-----|
| Testar mapper do Repository (snake → camel) | `.test.ts`, mock `apiClient`, asserta retorno |
| Testar hook React Query (cache, mutation) | `.test.tsx`, `renderHook` + `QueryClientProvider` wrapper |
| Testar página com filtros | `.test.tsx`, mock hooks de `application/`, render com `browser-router` helper |
| Testar form RHF + Zod | `userEvent.type/click`, `waitFor` para mensagens de erro |
| Testar interação que dispara fetch | `userEvent.click` + `waitFor(() => expect(mock).toHaveBeenCalled())` |
| Testar hook que usa `localStorage` | `localStorage.clear()` em `beforeEach`, manipular direto |
| Testar componente shadcn com Portal (Select, Dialog) | `userEvent.click(screen.getByRole('combobox'))` e busca options no body |
| Testar custom hook isolado | `renderHook(() => useX())` + `act()` para state updates |
| Testar Error Boundary | render dispara `throw` em filho, asserta fallback |
| Mock condicional (sucesso vs erro) | `mockResolvedValueOnce` / `mockRejectedValueOnce` |
