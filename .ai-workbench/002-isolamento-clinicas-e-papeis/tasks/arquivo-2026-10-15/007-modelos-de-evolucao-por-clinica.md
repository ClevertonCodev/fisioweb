# Modelos de evolução só do sistema ou da própria clínica

**Tipo:** Bug
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

O `generate-text` de evolução e a criação de evolução aceitam `evolution_template_id` e `checked_item_ids` de qualquer clínica, e a busca de itens de modelo não filtra por clínica. Com isso, o texto dos modelos privados de outra clínica aparece na resposta.

A correção só aceita modelo e itens de modelo do sistema (`is_system`) ou da própria clínica.

## O que construir

- ClinicalRecord, guard `clinic`. Gerar texto, criar evolução e editar evolução:
  - `evolution_template_id` precisa ser de modelo do sistema ou da clínica do usuário;
  - cada `checked_item_ids` precisa ser item de modelo do sistema ou da clínica do usuário;
  - fora disso, 422 com erro no campo, e nenhum texto é gerado.
- A busca de itens de modelo passa a receber a clínica e filtra por ela ou pelo sistema.
- Sem migration e sem mudança no SPA.

## Critérios de Aceite

- [ ] O teste que reproduz a falha foi escrito antes da correção e estava vermelho: o texto do item privado da B aparecia.
- [ ] `generate-text` com item de modelo privado da B devolve 422, e o texto do item não aparece no corpo.
- [ ] Criar ou editar evolução com `evolution_template_id` privado da B devolve 422.
- [ ] Modelo e itens do sistema e da própria clínica continuam funcionando no `generate-text` e na criação.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - `modules/ClinicalRecord/app/Http/Controllers/EvolutionTemplateController.php` (regra "sistema ou da clínica" na leitura de modelo);
  - `modules/ClinicalRecord/tests/Feature/ClinicalRecordIsolationTest.php`.
- **Skills:** `security`, `laravel-eloquent`, `php-testing`
- A validação fica no FormRequest ou no Service, nunca só no controller.

## Como testar na mão

1. Na clínica B, crie um modelo de evolução privado com um item de texto marcante ("TEXTO-SECRETO-B"). Anote o id do item.
2. Como fisio da A, numa evolução de paciente da A, chame `POST /api/clinic/evolutions/{id}/generate-text` com esse item → 422, sem "TEXTO-SECRETO-B" na resposta.
3. Na tela de evolução da A, gere o texto com um modelo do sistema → funciona como antes.
