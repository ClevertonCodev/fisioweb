---
name: frontend-react
description: Padrões React 19 + TypeScript modernos no SPA fisioweb — custom hooks com retorno tipado, useEffect com cleanup correto, useMemo/useCallback/React.memo aplicados onde rendem, useActionState e useOptimistic em forms, use() para promises, Error Boundaries por rota, code splitting com lazy(). Use ao escrever hook customizado, otimizar componente pesado, evitar re-render desnecessário, adicionar tratamento de erro em UI, ou usar feature do React 19.
metadata:
  domain: framework
  triggers: react, hook, useEffect, useMemo, useCallback, useState, memo, useTransition, useDeferredValue, useActionState, useOptimistic, use, lazy, Suspense, ErrorBoundary, render
  scope: implementation
  output-format: code
  related-skills: frontend-ddd, frontend-testing
---

# Frontend React (fisioweb)

Padrões React 19 + TypeScript no SPA. Foca em hooks customizados, performance, e features do React 19 aplicáveis a **SPA client-side** (sem RSC, sem Server Actions — o projeto não usa Next.js).

## Quando usar

- Escrevendo hook customizado em `application/` ou hook de UI em `hooks/`.
- Otimizando componente lento (renderiza muito, lista grande, animação).
- Eliminando re-render desnecessário (memo, useCallback).
- Adicionando Error Boundary numa rota ou seção.
- Usando feature React 19 (`useActionState`, `useOptimistic`, `use()`).
- Code splitting de uma rota pesada com `React.lazy` + `Suspense`.

## Skill Map — quando carregar outra skill

| Estou fazendo | Carregue |
|--------------|----------|
| Estruturando feature (domain/application/infra/pages) | [`frontend-ddd`](../frontend-ddd/SKILL.md) |
| Testando hook ou componente com Vitest+RTL | [`frontend-testing`](../frontend-testing/SKILL.md) |

## Contexto do projeto (importante)

- **React 19.2** + **TypeScript** strict.
- **NÃO é Next.js** — Vite + React Router DOM v6. Não há RSC, não há Server Actions, não há `'use server'`.
- **TanStack Query v5** é o gerenciador de estado de servidor. Para esse caso, não use `useEffect + fetch` nem `useReducer`.
- **AuthContext** carrega sessão JWT. Outras Context API novas devem ser raras — prefira hooks de `application/`.
- Sem Redux/Zustand/Jotai instalados. Não adicione.
- Estado local de UI (filtro, modal, paginação local) = `useState`.

## Core mandates

### Deve fazer
- Custom hooks com nome `useXxx` e retorno tipado explicitamente.
- Dependências de `useEffect`/`useMemo`/`useCallback` **exaustivas** (lint cobre).
- Cleanup function em `useEffect` que cria subscription/listener/timer.
- `useCallback` quando a função é passada como prop para componente `memo`-izado ou para deps de outro hook.
- `useMemo` para cálculos derivados caros (filter+sort+paginate de array grande).
- `React.memo` em componentes de lista renderizados em loop com props estáveis.
- Para forms com loading/erro nativo, considerar `useActionState` (React 19); para TanStack Query continuar com `useMutation`.
- Error Boundary por **rota administrativa** ou seção pesada.
- `React.lazy()` + `<Suspense>` para rotas grandes (programas, exercícios, dashboard de relatório).

### Não deve fazer
- `useEffect` para sincronizar com servidor — use React Query.
- `useState` em form com 2+ campos validados — use RHF (ver [`frontend-ddd/references/forms.md`](../frontend-ddd/references/forms.md)).
- `useCallback`/`useMemo` "preventivo" sem prop `memo` ou dep ligada. Otimização sem ganho = ruído.
- Adicionar Context Provider novo por feature — prefira hook em `application/`.
- Hook customizado retornando array `[a, b, c]` quando há 3+ valores. Use objeto `{ ... }`.
- Mutar estado: `state.push(x)`. Sempre `setState(prev => [...prev, x])`.
- Usar `useTransition`/`useDeferredValue` sem medir lentidão real.
- Importar `'use client'` / `'use server'` — não é Next.js.

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| Padrões de hook custom + dependências corretas + cleanup | [`references/hooks-patterns.md`](references/hooks-patterns.md) | Escrever hook customizado |
| Performance: useMemo/useCallback/memo/lazy/Suspense, quando rendem ganho | [`references/performance.md`](references/performance.md) | Otimizar componente lento |
| React 19 features aplicáveis ao SPA (useActionState, useOptimistic, use(), Error Boundary) | [`references/react-19.md`](references/react-19.md) | Forms com loading nativo, UI otimista, suspender promise |

## Output esperado

Ao otimizar/refatorar componente, entregue:

1. **Diagnóstico** — qual problema (re-render, lista lenta, fetch redundante).
2. **Aplicação focada** do padrão (não mexer no que está bom).
3. **Verificação**: `npm run types && npm run lint && npm run format`.
4. **Teste** (quando refatora hook) — ver [`frontend-testing`](../frontend-testing/SKILL.md).

## Quick decision

| Cenário | Use |
|---------|-----|
| Fetch + cache de dados do servidor | TanStack Query (`useQuery`) em `application/` |
| Mutation com feedback | TanStack Query (`useMutation`) em `application/` |
| Estado de UI local (filtro, modal aberto) | `useState` |
| Lógica reutilizável que toca DOM (debounce, mediaquery) | Custom hook em `hooks/` |
| Lógica reutilizável de servidor | Custom hook em `application/` |
| Filtro/sort/paginate local sobre array grande | `useMemo` com deps exatas |
| Função passada para `memo`-izado | `useCallback` |
| Componente em loop com props estáveis | `React.memo(Component)` |
| Input com filtro em lista grande (UI travando) | `useDeferredValue(input)` |
| Form com status nativo loading/erro | React 19 `useActionState` (opcional, sem React Query) |
| Botão "curtir" precisa parecer instantâneo | `useOptimistic` (ou `useMutation`'s `onMutate`) |
| Rota pesada raramente acessada | `React.lazy(() => import(...))` + `<Suspense>` |
| Erro inesperado em sub-árvore não quebrar app | Error Boundary |
| Sincronizar com API externa controlada (mediaQuery, localStorage) | `useSyncExternalStore` |
