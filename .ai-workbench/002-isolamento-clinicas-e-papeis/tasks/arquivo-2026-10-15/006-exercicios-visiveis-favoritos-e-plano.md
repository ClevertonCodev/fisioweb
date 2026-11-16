# Favoritos e plano só com exercício visível para a clínica

**Tipo:** Bug
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

Três pontos deixam uma clínica alcançar exercícios pendentes ou rejeitados enviados por outra:

- `toggleFavorite` busca o exercício sem o escopo `visibleToClinic`;
- a listagem de favoritos devolve o registro completo, com `clinic_id`, `review_status` e `submitted_by_clinic_user_id`;
- `exercises.*.exercise_id` do plano aceita qualquer exercício que exista.

Com isso, a clínica B favorita por id um exercício privado da A e passa a vê-lo, e pode ainda colocá-lo num plano.

A correção aplica o `visibleToClinic` (aprovado no catálogo ou da própria clínica) nos três pontos e tira os campos de origem da listagem.

## O que construir

- Favoritar e desfavoritar (módulo Clinic, guard `clinic`, qualquer papel): exercício fora do escopo visível devolve 404, e nada é gravado.
- Listagem de favoritos: traz só exercícios ainda visíveis para a clínica e não traz `clinic_id`, `review_status` nem `submitted_by_clinic_user_id`.
- Plano de tratamento (TreatmentProgram): cada `exercises.*.exercise_id` precisa estar no escopo visível da clínica, senão 422.
  - A validação consulta o Admin por contrato público, sem importar o model `Exercise`.
  - Se o contrato de leitura ainda não existir em `Contracts/Public`, ele nasce aqui.
- Sem migration e sem mudança no SPA.

## Critérios de Aceite

- [ ] O teste que reproduz a falha foi escrito antes da correção e estava vermelho.
- [ ] A clínica B favoritando exercício pendente ou rejeitado da A recebe 404, e nenhum favorito é criado.
- [ ] A listagem de favoritos da B não traz exercício privado da A, mesmo que um favorito antigo exista no banco.
- [ ] A listagem de favoritos não tem `clinic_id`, `review_status` nem `submitted_by_clinic_user_id` em nenhum item.
- [ ] Plano com exercício pendente da B devolve 422. Plano com exercício aprovado, ou pendente da própria clínica, é aceito.
- [ ] Favoritar exercício aprovado do catálogo continua funcionando.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - o escopo `visibleToClinic` no model `Exercise` do Admin;
  - `modules/Clinic/tests/Feature/ExerciseIsolationTest.php` e `ExerciseSubmissionTest.php`.
- **Skills:** `security`, `architecture-paradigm-modular-monolith`, `php-testing`
- O Eloquent direto no `ExerciseController` continua; ele está no DEFERRED como Minor.
- Aproveitar e corrigir o Minor do `DEFERRED.md` da raiz: `ExerciseSubmissionTest::test_pending_exercise_is_not_visible_to_other_clinic` deve conferir `assertCreated()` no POST e `assertOk()` no GET.
- Marcar o item Crítico de favoritos do `DEFERRED.md` da raiz como resolvido.

## Como testar na mão

1. Na clínica A, envie um exercício pela tela "Enviar exercício". Ele fica pendente; anote o id.
2. Como usuário da B, `POST /api/clinic/exercises/{id}/favorite` → 404.
3. Na tela "Exercícios" da B, os favoritos não mostram esse exercício.
4. Como B, crie um plano pela API com esse `exercise_id` → 422.
5. Na B, favorite um exercício aprovado do catálogo → funciona, e ele aparece nos favoritos.
