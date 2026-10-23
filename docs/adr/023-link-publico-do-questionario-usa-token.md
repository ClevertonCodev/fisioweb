# ADR: O link público do questionário usa token, não id

## Contexto

`GET` e `POST /api/questionnaires/{id}` eram públicos e achavam o envio pelo id sequencial. Qualquer pessoa testava 1, 2, 3 e lia ou respondia o questionário pendente de outro paciente. A resposta ainda podia trazer `clinicUser` (e-mail e documento do profissional).

A tarefa 008 da feature de isolamento (`002-isolamento-clinicas-e-papeis`) decidiu **apagar** essas rotas públicas. Esta feature do prontuário v2 precisa do link para o paciente, no mesmo espírito do programa de tratamento (`public_token` + `/{slug}/paciente/...`).

## Decisão

A rota pública **permanece**. Ela deixa de responder a id sequencial e passa a achar o envio só pelo `public_token` (UUID único).

- Coluna `public_token` em `clinic_patient_questionnaires` (módulo `ClinicQuestionnaire`). Envio novo já nasce com token. Envio antigo ganha token no backfill da mesma migration.
- URL de compartilhar: `{APP_URL}/{slug da clínica}/paciente/questionarios/{public_token}`. A API autenticada da clínica devolve `public_token` e `share_url` no envelope `data`.
- `GET /api/questionnaires/{token}` e `POST /api/questionnaires/{token}/answer` (sem guard): id numérico, token inexistente ou envio que não existe → 404. O GET público não devolve `clinicUser` nem documento/e-mail do profissional.
- A página em que o paciente responde **não** entra nesta decisão; o endereço e o contrato público já nascem prontos.
- A tarefa 008 da feature de isolamento **não** deve apagar essas rotas. Quem “cumprir” a 008 depois desta ADR está revertendo esta decisão.

## Consequências

- Benefícios:
  - Fecha a enumeração por id, sem tirar o caminho público que o link do paciente precisa.
  - O front da clínica não monta a URL: mostra o `share_url` que a API devolve.
- Custos:
  - Uma migration com backfill; rotas públicas continuam existindo e precisam de teste de 404 por id.
- Regras que agentes devem preservar:
  - Não voltar a resolver o envio público por `id`.
  - Não remover `routes/questionnaires.php` nem o `QuestionnaireAnswerController` para “cumprir” a tarefa 008.
  - Não devolver `clinicUser` no GET/POST públicos.
