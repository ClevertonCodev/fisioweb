# Favoritos só com exercício visível e sem dados de origem

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 38, 39
**Issue:** ainda não criada

## Descrição

Hoje favoritar aceita qualquer id de exercício, e a lista de favoritos devolve o registro inteiro sem o escopo de visibilidade. Qualquer usuário de qualquer clínica lê o exercício pendente ou rejeitado de outra clínica, com o vídeo e quem enviou (achado Médio `clinic/exercises-favorites/private-exercise-cross-clinic`).

## O que construir

- Favoritar e desfavoritar buscam o exercício com o escopo `visibleToClinic` da clínica do usuário. Fora dele, 404.
- A lista de favoritos aplica o mesmo escopo (o favorito antigo que ficou invisível some) e remove os mesmos campos que o index (`clinic_id`, `submitted_by_clinic_user_id`, `clinic` e `submittedByClinicUser`), mais o `review_status`.
- Sem migration. Sem mudança no SPA, que não usa esses campos.

## Critérios de Aceite

- [ ] Favoritar um exercício rejeitado ou pendente de outra clínica dá 404 (o teste `AuditFavoritesCrossClinicTest` da auditoria, invertido)
- [ ] O favorito gravado antes de o exercício ficar invisível não aparece na lista
- [ ] A lista não traz `clinic_id`, `submitted_by_clinic_user_id` nem `review_status`
- [ ] Favoritar um exercício aprovado ou da própria clínica continua 200
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Http/Controllers/ExerciseController.php` (o `index` já aplica o escopo e o `unset`)
- **Skills:** `php-testing`, `security-audit`

## Como testar na mão

1. Como secretária da clínica B, chame `POST /api/clinic/exercises/{id}/favorite` com o id de um exercício pendente da clínica A: deve dar 404.
2. Na biblioteca, favoritar um exercício aprovado continua funcionando.
