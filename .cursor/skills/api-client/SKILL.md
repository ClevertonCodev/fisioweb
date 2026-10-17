---
name: api-client
description: Como usar o apiClient axios do fisioweb com JWT multi-guard. Cobre inferência automática de guard pela URL (`/admin/*` → admin, `/clinic/*` → clinic), interceptor que anexa Bearer token, interceptor de 401 com refresh automático e redirect para login, storage por guard (localStorage para sessão normal, sessionStorage para impersonation por aba), e regras para Repositories da camada `infrastructure/`. Use ao criar Repository novo, integrar com endpoint, debugar 401/refresh, ou adicionar fluxo de impersonation.
metadata:
  domain: infrastructure
  triggers: apiClient, axios, JWT, token, refresh, interceptor, 401, guard, impersonation, sessionStorage, auth
  scope: implementation
  output-format: code
  related-skills: frontend-ddd, security
---

# API Client (fisioweb)

`apiClient` é o axios singleton em `resources/js/infrastructure/api/client.ts`. **Único ponto** de saída HTTP do frontend — nada de `fetch` direto.

## Quando usar

- Criando Repository novo em `infrastructure/repositories/api-*.ts`.
- Adicionando endpoint que ainda não está coberto.
- Diagnosticando 401 / refresh inesperado.
- Mexendo em fluxo de impersonation (admin logando como clínica).
- Adicionando guard novo (raro — hoje só `admin` e `clinic`).

## O que **não** mexer

- `client.ts` em si — interceptors estão prontos. Mudança aqui afeta tudo.
- `auth.service.ts` — login/refresh/logout. Mudança quebra contexto de auth.

## Skill Map

| Estou fazendo | Carregue |
|--------------|----------|
| Estruturando feature (domain/application/infra) | [`frontend-ddd`](../frontend-ddd/SKILL.md) |
| Autorização (quem pode chamar o endpoint) | [`security`](../security/SKILL.md) |

## Como o guard é inferido

`apiClient` decide qual token enviar **automaticamente** pela URL do request:

| URL | Guard |
|-----|-------|
| `/admin/...` ou `/admin` | `admin` |
| `/clinic/...` ou `/clinic` | `clinic` |
| Qualquer outra (`/auth/login`, etc.) | Inferido pelo path do navegador (`/admin/*` → admin, `/clinica/*` → clinic) |

Você **nunca** seta `Authorization` manualmente. O interceptor faz isso.

## Storage layout

```
localStorage:
  auth_token_admin    → JWT admin
  auth_token_clinic   → JWT clinic
  auth_guard          → guard "default" (qual estava logado)

sessionStorage:       (apenas durante impersonation)
  auth_token          → JWT da clínica impersonada
  auth_guard          → 'clinic'
```

**Por que sessionStorage para impersonation:** isola por aba. Admin abre nova aba para entrar como clínica X; aba original continua como admin.

`getStoredAuth(guard?)` tem prioridade: sessionStorage > localStorage[guard] > inferência por path > qualquer guard disponível.

## Core mandates

### Deve fazer
- Sempre importar `apiClient` de `@/infrastructure/api/client`.
- Endpoints com path `/api/admin/...` ou `/api/clinic/...` — o axios injeta `baseURL: '/api'`, então no Repository você escreve `/admin/...` (sem `/api`).
- Tipar resposta: `await apiClient.get<{ data: ApiXxx }>(...)`.
- Em Repository, lidar com erro deixando subir — `apiClient.get()` lança `AxiosError` automaticamente.
- Para erros tipados, use `ApiErrorResponse` de `@/domain/api`.

### Não deve fazer
- `fetch()` direto em nenhum arquivo.
- Importar `apiClient` em página/componente — só em Repository (`infrastructure/repositories/`).
- Setar `Authorization` manual.
- Setar `Content-Type` manual (já vem como `application/json`).
- Bypassar o interceptor de 401 (ex.: lidar com 401 no Repository) — deixe ele redirecionar.

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| Repository templates, lidar com erro, impersonation, upload de arquivo | [`references/api-client.md`](references/api-client.md) | Implementar Repository ou debug |

## Output esperado

Ao criar Repository novo:

1. Tipos `ApiXxx` privados no topo (snake_case do backend).
2. Função `mapXxx(raw: ApiXxx): Xxx` que converte para entidade do domain.
3. Função `toApiPayload(dto: XxxWriteDto): Record<string, unknown>` para writes.
4. Constante `apiXxxRepository: XxxRepository = { list, getById, create, update, destroy }`.
5. Export no barrel `infrastructure/repositories/index.ts`.

## Quick decision

| Cenário | Como |
|---------|------|
| GET `/api/admin/exercises?search=x` | `apiClient.get('/admin/exercises', { params: { search: 'x' } })` |
| POST com payload | `apiClient.post('/admin/exercises', payload)` |
| Upload de arquivo | FormData + `apiClient.post(url, formData)` (axios detecta multipart) |
| Endpoint que devolve binário (PDF) | `apiClient.get(url, { responseType: 'blob' })` |
| Endpoint que pode aceitar 404 (busca opcional) | `try { return await ... } catch (e) { if (e.response?.status === 404) return null; throw e; }` |
| Forçar guard específico (raro) | Não tem API — o guard é inferido. Refatore URL para `/admin/*` ou `/clinic/*` |
| Impersonation: admin → clinic | `setSessionAuth(token, 'clinic')` antes do navigate |
| Sair da impersonation | `clearStoredAuth('clinic')` limpa session, localStorage admin permanece |
