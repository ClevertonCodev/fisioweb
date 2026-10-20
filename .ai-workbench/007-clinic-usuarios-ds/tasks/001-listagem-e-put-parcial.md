# Listagem com 2FA/Google, PUT parcial e travas de mestre e último admin

**Tipo:** História
**Plano:** `../plans/clinic-usuarios-ds.md`
**Issue:** ainda não criada

## Descrição

A lista v2 precisa dos sinais de verificação em duas etapas e de Google Agenda em cada cartão, e precisa gravar só `{ role }` ou só `{ status }` sem mandar o documento. Hoje o `GET /api/clinic/users` não devolve esses timestamps, o `PUT` exige `document` em qualquer update, o service não impede desativar o mestre nem rebaixar/desativar o último administrador ativo, e três testes de isolamento (`show`/`update`/`destroy` de outra clínica) estão `incomplete` porque o `Gate::before` libera o admin de outra clínica no Model resolvido pelo id.

Esta fatia fecha o contrato da API e as recusas. Sem ela, o arraste e o desativar da lista quebram com 422 ou vazam dado entre clínicas.

## O que construir

- Módulo dono: `Clinic`. Guard `clinic`. Sem migration, sem fila, sem tela nova. (Revisto em 2026-10-20 na revisão adversária: ADR 022.) A migration de `deleted_at` (soft delete) entrou pela 004.
- `GET /api/clinic/users`: cada item traz `two_factor_confirmed_at` e `google_connected_at` (timestamp ou null), além dos campos que já saem. Segredos (secret de 2FA, códigos, tokens do Google) não saem. Continua filtrado por `clinic_id`. Fisioterapeuta e secretária recebem 403.
- `PUT /api/clinic/users/{id}`: `document` deixa de ser obrigatório (`sometimes`, como nome e e-mail). Dá para mandar só `{ role }` ou só `{ status }`.
- Recusas 422 no service:
  - mestre não muda de função para nada que não seja administrador (já existe);
  - mestre não é desativado;
  - o último administrador **ativo** não perde o papel `admin` nem é desativado.
  - com dois admins ativos, rebaixar ou desativar um deles é permitido.
- Isolamento: `GET`/`PUT`/`DELETE` num id de outra clínica não vazam o nome e não alteram o banco (404, no mesmo padrão das fotos). Os três `markTestIncomplete` saem.
- No SPA, o mapper da listagem preenche `twoFactorEnabled` e `googleConnected` a partir dos timestamps; se o campo faltar, assume falso. Sem mudança de tela nesta tarefa.

## Critérios de Aceite

- [x] `GET /api/clinic/users` como admin da clínica A traz só usuários de A e inclui `two_factor_confirmed_at` e `google_connected_at` (teste; um usuário com os dois preenchidos e outro com null).
- [x] Fisioterapeuta e secretária recebem 403 no index (teste).
- [x] Não autenticado no index recebe 401 (teste).
- [x] `PUT` só com `{ "role": "secretary" }` (sem `document`) muda a função de um não-mestre que não é o último admin ativo (teste).
- [x] `PUT` só com `{ "status": false }` desativa um não-mestre que não é o último admin ativo (teste).
- [x] Mestre: `role` diferente de admin → 422; `status` inativo → 422; `DELETE` → 422; o registro não muda (teste).
- [x] Último admin ativo: `role` diferente de admin → 422; `status` inativo → 422; `DELETE` → 422 (teste).
- [x] Com dois admins ativos, rebaixar ou desativar um deles devolve 200 e grava (teste).
- [x] Admin da clínica B em `GET`/`PUT`/`DELETE` no id de um usuário da clínica A: 404, sem o nome no JSON, banco de A intacto. Os três testes `incomplete` passam a ser testes de verdade (teste).
- [x] O mapper do frontend converte os timestamps em booleanos e a ausência em `false` (teste do Repository).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/user-listagem-ds`
- **Exemplo no código:** `ClinicUserIsolationTest` (duas clínicas, `actingAs($user, 'clinic')`); o `uploadPhoto`/`deletePhoto` do `ClinicUserController`, que já conferem `clinic_id` e devolvem 404; `ClinicUserService` (mestre não muda de função, último admin não é excluído).
- **Skills:** `php-testing`, `backend-clean-code`, `security`, `api-client`, `frontend-testing`.
- O `Gate::before` libera o admin em qualquer ability: a checagem de `clinic_id` tem que vir **antes** do `authorize` no `show`/`update`/`destroy`, como nas fotos. Não mude o `Gate::before`. (Revisto em 2026-10-20 na revisão adversária: ADR 022.) A checagem de `clinic_id` veio antes do `authorize`, como pedido; o `Gate::before` só passou a exigir admin ativo.
- "Último administrador ativo" conta só quem tem papel admin **e** `status` ativo. Um admin já inativo não impede rebaixar o que restou ativo.
- O seeder só cria admins. Nos testes, use a factory com `role` e `mestre`.

## Como testar na mão

1. `fisio-app url`. Entrar na Clínica Cleverton como admin (credenciais do `DatabaseSeeder`).
2. `GET /api/clinic/users` com o token: cada item tem `two_factor_confirmed_at` e `google_connected_at`. Confira no `fisio-app psql` que um usuário com 2FA confirmada aparece com timestamp, não com null.
3. `PUT /api/clinic/users/{id de um fisioterapeuta}` só com `{ "role": "secretary" }`: 200, função gravada. Repetir só com `{ "status": false }`: 200, inativo.
4. Tentar o mesmo `PUT` de role no mestre: 422. Tentar desativar o mestre: 422.
5. Entrar na Clínica Start e `GET`/`PUT`/`DELETE` no id de um usuário da Cleverton: 404, e o registro da Cleverton não muda.
6. Entrar como fisioterapeuta da Cleverton e chamar `GET /api/clinic/users`: 403.
