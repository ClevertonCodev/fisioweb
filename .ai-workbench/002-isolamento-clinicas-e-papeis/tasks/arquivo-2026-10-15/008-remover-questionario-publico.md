# Remover o questionário público e validar `question_id` contra o template

**Tipo:** Bug
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

`GET /api/questionnaires/{id}` e `POST /api/questionnaires/{id}/answer` não exigem login e buscam o questionário por id sequencial. Qualquer pessoa testa os ids em sequência, lê os questionários pendentes de todas as clínicas e responde no lugar do paciente. Isso falsifica dado clínico e impede o paciente de responder depois. A resposta do POST ainda traz o `clinicUser`, com e-mail e documento do profissional.

Nenhuma tela do SPA usa essas rotas, e nenhum código gera link para elas. Hoje a clínica preenche as respostas pela rota autenticada. A decisão foi remover a rota pública. Questionário por link volta numa feature própria (DEFERRED da feature).

Além disso, a rota autenticada valida `question_id` só com `exists`, então aceita pergunta de qualquer template.

## O que construir

- ClinicQuestionnaire:
  - sai o arquivo de rotas públicas de questionário e o registro dele;
  - sai o `QuestionnaireAnswerController`;
  - sai a Request usada só por ele, se existir;
  - saem os testes exclusivos dele.
- O mapa de capacidades da arquitetura (`tests/Architecture/fixtures/clinic-capability-map.php`) e qualquer teste de compatibilidade de rota que cite as rotas públicas são atualizados.
- Responder questionário pela rota autenticada (`POST /api/clinic/patients/{patient}/questionnaires/{questionnaire}/answer`): cada `answers.*.question_id` precisa pertencer ao template daquele questionário, senão 422 e nada é gravado.
- Sem migration e sem mudança no SPA.

## Critérios de Aceite

- [ ] O teste que reproduz a falha foi escrito antes da correção e estava vermelho: o GET público com id numérico devolvia 200.
- [ ] `GET /api/questionnaires/{id}` e `POST /api/questionnaires/{id}/answer` devolvem 404, com ou sem token.
- [ ] Não sobra nenhuma referência ao controller removido (`grep` limpo), e `php artisan route:list` não lista as rotas públicas.
- [ ] Responder pela rota autenticada com `question_id` de outro template (da própria clínica ou da B) devolve 422, e nenhuma resposta é gravada.
- [ ] Responder com perguntas do próprio template continua funcionando, e o evento `QuestionnaireAnswered` continua sendo disparado.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - `modules/ClinicQuestionnaire/tests/Feature/PatientQuestionnaireControllerTest.php`;
  - `modules/ClinicQuestionnaire/tests/Unit/Events/ClinicQuestionnaireServiceEventsTest.php`, que hoje cita o fluxo público e precisa ser ajustado.
- **Skills:** `security`, `architecture-paradigm-modular-monolith`, `php-testing`
- Conferir se o service do questionário tem método usado só pela rota pública. Se tiver, removê-lo junto.

## Como testar na mão

1. Sem login, `GET /api/questionnaires/1` → 404.
2. Como admin da A, envie um questionário a um paciente pela ficha e responda pela tela ("Preencher") → funciona como antes.
3. Pela API, responda esse questionário com o `question_id` de uma pergunta de outro template → 422.
