# Checagem de clínica no controller base e usuários de outra clínica com 404

**Tipo:** Bug
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

O admin de uma clínica lê, altera e apaga usuários de outra clínica pelo `GET/PUT/DELETE /api/clinic/users/{id}`. O route model binding busca o usuário sem filtro de clínica, e o `Gate::before` aprova tudo para admin. Com um PUT trocando e-mail e senha, o admin da clínica A entra na conta de qualquer usuário da clínica B, inclusive do mestre. Só os endpoints de foto checam a clínica hoje.

A correção cria uma checagem única de clínica no controller base da clínica, que devolve 404 quando o model é de outra clínica, e a usa em show, update e destroy de usuários.

## O que construir

- Uma checagem no controller base da clínica (núcleo `app/Http/Controllers`) que recebe um model com `clinic_id` e aborta com 404 (`{"message": "<Recurso> não encontrado."}`) quando a clínica é diferente da do usuário logado. O recurso é sempre comparado como inteiro.
- Show, update e destroy de usuários da clínica (módulo Clinic, guard `clinic`) chamam essa checagem antes de qualquer Policy ou regra.
- Os endpoints de foto, que já checam a clínica, passam a usar a mesma checagem.
- Os testes `markTestIncomplete` de `ClinicUserIsolationTest` (show, update, destroy de outra clínica) deixam de ser incompletos.
- Sem migration e sem mudança no SPA.

## Critérios de Aceite

- [ ] O teste que reproduz a falha foi escrito antes da correção e estava vermelho: o PUT do admin da A no usuário da B devolvia 200.
- [ ] `GET /api/clinic/users/{id da B}` pelo admin da A devolve 404, sem e-mail nem papel no corpo.
- [ ] `PUT /api/clinic/users/{id da B}` com `email` e `password` novos devolve 404, e o registro da B continua igual no banco.
- [ ] `DELETE /api/clinic/users/{id da B}` devolve 404, e o registro da B continua existindo.
- [ ] O mesmo vale contra o usuário mestre da B.
- [ ] Show, update e destroy de usuário da própria clínica continuam funcionando (200).
- [ ] Os testes de foto continuam verdes.
- [ ] A checagem tem teste unitário próprio: mesma clínica passa; outra clínica dá 404; `clinic_id` como string não engana a comparação.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (branch única da feature)
- **Exemplo no código:**
  - `modules/ClinicScheduling/app/Http/Controllers/AppointmentController.php` (`authorizeClinic`, já devolve 404 independente do `Gate::before`);
  - `modules/Clinic/tests/Feature/ClinicUserIsolationTest.php` (duas clínicas, `adminA`/`adminB`).
- **Skills:** `security`, `backend-clean-code`, `php-testing`
- Atualizar no `DEFERRED.md` da raiz o item Crítico do `ClinicUserController` como resolvido.

## Como testar na mão

1. Com duas clínicas (seed), entre como admin da clínica A e pegue o token.
2. `PUT /api/clinic/users/{id de um usuário da clínica B}` com `{"email": "x@x.com", "password": "nova-senha-123"}` → deve devolver 404.
3. Tente logar na clínica B com `x@x.com` e a senha nova → deve falhar.
4. `DELETE /api/clinic/users/{id da B}` → 404, e o usuário continua aparecendo na tela "Usuários" da clínica B.
5. Na clínica A, edite um usuário da própria clínica pela tela "Usuários" → continua salvando.
