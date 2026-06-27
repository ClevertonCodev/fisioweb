---
name: security
description: Autorização ponta-a-ponta no fisioweb — Policies Laravel no backend (autoritativo) + permissions.ts no frontend (apenas UI). Cobre `authorizeResource` em controller, escrita de Policy com ownership por clinic_id, registro no `<Module>ServiceProvider::boot`, `can.xxx(role)` helpers, componentes `RequireClinicAdmin` e `RequireClinicUserSelfOrAdmin` para guardar rota. Use ao adicionar permissão, criar policy, esconder ação na UI por papel, ou auditar fluxo de autorização.
metadata:
  domain: security
  triggers: policy, autorização, permission, RequireClinicAdmin, authorizeResource, Gate, can, role, papel, ownership
  scope: implementation
  output-format: code
  related-skills: backend-module, frontend-ddd, php-testing
---

# Security (fisioweb)

Autorização tem **duas camadas**: backend (autoritativo) e frontend (apenas UX). Frontend nunca substitui backend.

## Princípio

> **Backend valida tudo. Frontend só esconde para não confundir o usuário.**

Se você esconde um botão no frontend mas não protege o endpoint, qualquer usuário com DevTools/curl burla. O backend **sempre** valida, mesmo que a UI já tenha impedido.

## Quando usar

- Adicionando permissão nova (papel novo, ação restrita).
- Criando Policy no backend para entidade nova.
- Adicionando `RequireClinicAdmin` em rota administrativa.
- Escondendo botão/menu por papel.
- Auditando se um endpoint está realmente protegido.

## Skill Map

| Estou fazendo | Carregue |
|--------------|----------|
| Estrutura de módulo Laravel (Service, Controller, FormRequest) | [`backend-module`](../backend-module/SKILL.md) |
| Frontend DDD (componentes, rotas) | [`frontend-ddd`](../frontend-ddd/SKILL.md) |
| Testes de Policy + componentes de guarda | [`php-testing`](../php-testing/SKILL.md), [`frontend-testing`](../frontend-testing/SKILL.md) |

## Layout

### Backend
- **Guards JWT**: `admin` e `clinic`. Middleware `auth:admin` / `auth:clinic` no grupo de rotas.
- **Policies**: `modules/<Module>/app/Policies/<Entity>Policy.php`.
- **Registro**: `<Module>ServiceProvider::boot()` com `Gate::policy(Model::class, Policy::class)` ou via `$policies` em um Provider.
- **Invocação**: `$this->authorizeResource(Model::class, 'param')` no construtor do Controller; ou `$this->authorize('action', $model)` em métodos pontuais.
- **Ownership**: a maioria das políticas valida `clinic_id` (multi-tenancy implícito).

### Frontend
- **`application/<contexto>/permissions.ts`**: helpers `can.xxx(role)` retornando boolean — espelha papéis do backend.
- **`components/<contexto>/RequireXxx.tsx`**: HOC de rota que redireciona se papel insuficiente.
- **AuthContext** (`contexts/AuthContext.tsx`): fornece `user`, `user.role`, `isLoading`.

## Papéis hoje

### Admin (`modules/Admin`)
Somente um papel: usuário do painel master. Acesso total nas rotas `admin/*`.

### Clinic (`modules/Clinic`)
Três papéis em `ClinicUser::role`:
- `admin` — proprietário da clínica
- `physiotherapist` — fisioterapeuta
- `secretary` — recepção/administrativo

## Core mandates

### Backend (deve fazer)
- Toda rota não-pública dentro de grupo `Route::middleware('auth:admin'|'auth:clinic')`.
- Controller que mexe em recurso usa `$this->authorizeResource(Model::class, 'paramName')` no construtor.
- Policies declaram métodos `viewAny`, `view`, `create`, `update`, `delete` retornando `bool`.
- Comparação de ownership por **id explícito**: `(int) $user->id === (int) $target->id`.
- Comparação por clinic: `$user->clinic_id === $target->clinic_id`.
- FormRequest `authorize()` retorna `true` quando o middleware/policy cobre — não duplicar regra.

### Backend (não deve fazer)
- Confiar em ID vindo de `$request->input('user_id')` sem validar ownership.
- `authorize()` no FormRequest com lógica complexa — passe a Policy.
- Política que retorna `bool|string` (mensagem) sem necessidade — bool suficiente.
- Endpoint sem `auth:<guard>` middleware "porque o frontend já protege".

### Frontend (deve fazer)
- `permissions.ts` em `application/<contexto>/` com helpers tipados por papel.
- Esconder UI usando os helpers: `{can.manageUsers(role) && <Button>...</Button>}`.
- Rotas restritas envolvidas em `<RequireClinicAdmin>` (ou similar).
- Tratar erro 403 do backend com toast "Sem permissão" — significa que o frontend deixou passar.

### Frontend (não deve fazer)
- Implementar lógica de autorização que o backend não tem.
- Confiar no frontend para bloquear ação destrutiva.
- Buscar permissões "do servidor" e cachear — papel vem do JWT (já está no `user`).

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| Templates: Policy + registro, `authorizeResource`, FormRequest com Policy, frontend `can` + `Require*` | [`references/policies.md`](references/policies.md) | Implementar autorização |

## Output esperado

Ao adicionar autorização nova:

1. **Policy** em `modules/<Module>/app/Policies/<Entity>Policy.php`.
2. **Registro** em `<Module>ServiceProvider::boot()` com `Gate::policy(...)`.
3. **Controller** com `$this->authorizeResource(...)` no construtor.
4. **Teste** da Policy em `modules/<Module>/tests/Unit/Policies/<Entity>PolicyTest.php`.
5. **Helper** `can.xxx(role)` em `application/<contexto>/permissions.ts`.
6. **Componente** `RequireXxx` em `components/<contexto>/` se precisa guardar rota inteira.
7. **Esconder UI** com `{can.xxx(role) && ...}` em pages e componentes.
8. **Teste** do helper em `resources/js/test/permissions.test.ts`.

## Quick decision

| Cenário | Use |
|---------|-----|
| Recurso CRUD novo | Policy + `authorizeResource` no construtor do controller |
| Ação fora do CRUD (ex.: `archive`, `reactivate`) | Adicionar método na Policy + `$this->authorize('archive', $entity)` no controller |
| Ownership por clinic_id | Policy compara `$user->clinic_id === $target->clinic_id` |
| Ownership por próprio user | Policy compara `$user->id === $target->id` |
| Papel específico (só admin) | `$user->role === 'admin'` no método da Policy |
| Frontend: esconder botão por papel | `{can.xxx(user?.role) && <Button>...</Button>}` |
| Frontend: bloquear rota inteira | `<RequireClinicAdmin>` envolvendo `<Route>` ou `element` |
| Frontend: redirect para "minha própria edição" | `<RequireClinicUserSelfOrAdmin userId={params.id}>` |
| Endpoint público | Fora de `Route::middleware('auth:*')->group(...)` |
| Tela inteira do admin | Já protegida por `RouteServiceProvider` + `auth:admin` middleware |
| 403 inesperado em produção | Auditar: Policy registrada? Controller chamando `authorize`? Middleware no grupo? |
