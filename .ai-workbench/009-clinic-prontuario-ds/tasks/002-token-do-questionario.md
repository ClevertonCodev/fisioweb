# Token no link público do questionário

**Tipo:** História
**Plano:** `../plans/clinic-prontuario-ds.md`
**Issue:** ainda não criada

## Descrição

`GET` e `POST /api/questionnaires/{id}` são públicos e acham o envio pelo id sequencial. Qualquer pessoa testa 1, 2, 3 e lê ou responde o questionário pendente de outro paciente. A clínica ainda não gera um link para o paciente: o envio pela v1 só grava e fecha.

Esta fatia fecha o furo e deixa o endereço pronto: cada envio ganha um token, a clínica recebe `share_url`, e a API pública só responde a token. A tela em que o paciente responde não entra. Os botões Copiar / WhatsApp / E-mail entram na tarefa 004.

## O que construir

- **Dono:** módulo `ClinicQuestionnaire`.
- **Migration:** coluna `public_token` (UUID, único). Envio novo já nasce com token. Envio antigo ganha token no backfill da mesma migration.
- **Envio autenticado** (guard `clinic`): a resposta do criar (e do show/list do paciente) inclui `public_token` e `share_url` no envelope `data`.
- **URL:** `{APP_URL}/{slug da clínica}/paciente/questionarios/{public_token}`, no mesmo espírito do programa. A página atrás do endereço não é desta feature nem desta tarefa.
- **API pública (sem guard):** passa a achar pelo token. Id numérico, token inexistente ou envio inválido: 404. O POST público continua no contrato, para a tela futura; esta tarefa não constrói essa tela.
- **ADR:** o próximo número livre registra que o link público usa token, não id — e que a rota pública **não** some (a feature de isolamento ia apagá-la).
- **Front:** o mapper e o domain do questionário ganham `publicToken` e `shareUrl`. Sem botões ainda.
- **Sem fila, sem Twilio, sem e-mail pelo servidor.**

## Critérios de Aceite

- [ ] Envio novo pela API da clínica nasce com `public_token` e `share_url` no `data` (teste de feature).
- [ ] Envio antigo, depois da migration, tem token (teste da migration / backfill).
- [ ] `GET /api/questionnaires/1` (id numérico) devolve 404 (teste).
- [ ] `GET /api/questionnaires/{token}` de um envio pendente da própria base devolve 200 com o contrato público (teste).
- [ ] Token inexistente devolve 404 (teste).
- [ ] Usuário da clínica B não lê o envio da clínica A pela API autenticada (teste de isolamento; já existia, não regressar).
- [ ] O mapper do front converte `public_token` / `share_url` em `publicToken` / `shareUrl` (teste).
- [ ] O ADR do token está escrito em `docs/adr/`.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já. Pode correr em paralelo com a `001-consultas-e-programas-por-paciente`.

## Notas de Implementação

- **Branch:** `feat/clinic-prontuario-ds`
- **Exemplo no código:** `public_token` e `share_url` do programa de tratamento (`TreatmentPlan`, `ProgramPdfViewModelBuilder::deepLinkUrl`); `PatientQuestionnaireControllerTest` e `PatientQuestionnaireIsolationTest`.
- **Skills:** `security`, `architecture-paradigm-modular-monolith`, `laravel-eloquent`, `php-testing`, `api-client`, `frontend-ddd`, `frontend-testing`.
- Não devolver `clinicUser` (e-mail, documento) no GET público — o furo antigo. Se o show público ainda expõe isso, corte nesta tarefa.
- A tarefa 008 da feature 002 queria apagar as rotas públicas. Esta tarefa as mantém, só por token. O ADR deixa isso explícito para o agente seguinte não “cumprir” a 008 e apagar de novo.

## Como testar na mão

1. Entre como admin da clínica A e envie um questionário remoto para um paciente (`POST /api/clinic/patients/{id}/questionnaires`).
2. A resposta tem `data.public_token` (UUID) e `data.share_url` no formato `/{slug}/paciente/questionarios/{token}`.
3. Sem login: `GET /api/questionnaires/1` → 404.
4. Sem login: `GET /api/questionnaires/{token do passo 2}` → 200.
5. Sem login: `GET /api/questionnaires/00000000-0000-0000-0000-000000000000` → 404.
6. Abrir o `share_url` no navegador pode dar página inexistente — esperado. A tela do paciente não é desta tarefa.
