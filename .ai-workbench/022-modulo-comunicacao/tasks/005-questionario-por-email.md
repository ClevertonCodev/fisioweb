# Enviar o questionário por e-mail ao enviar e no questionário pendente

**Tipo:** História
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 8, 16, 17, 19, 33
**Issue:** ainda não criada

## Descrição

Depois de enviar um questionário, o prontuário mostra Copiar link, WhatsApp e E-mail pelo `mailto:`. Esta tarefa liga o envio do link do questionário por e-mail pelo servidor, com o modal C, logo depois de enviar e no questionário que ainda está pendente.

## O que construir

- **Endpoint `POST /api/clinic/patients/{patient}/questionnaires/{questionnaire}/email`** (módulo `ClinicQuestionnaire`, guard `clinic`, Policy `view` do envio), limitado a 5 por minuto por usuário.
  - Paciente e envio buscados pela clínica do usuário autenticado, e o envio precisa ser do paciente da URL; senão, 404.
  - Envio que não está pendente ou já venceu dá 422; paciente sem e-mail dá 422.
  - Dispara `QuestionnaireEmailRequested` (versão, `clinicId`, `patientQuestionnaireId`, `patientId`, `actorId`, `occurredAt`) e responde 202.
- **Contrato público do `ClinicQuestionnaire`** com os dados do envio para o e-mail: título do modelo, número de perguntas, `expires_at`, status, paciente e `share_url`. Filtrado por `clinicId`.
- **Listener na fila no `Email`** monta o e-mail "Questionário enviado" no layout IVS MED:
  - assunto "Você tem um questionário para responder · <clínica>";
  - saudação;
  - título no corpo;
  - "Responder até <data>" (quando há prazo), número de perguntas e "cerca de N minutos";
  - botão "Responder questionário";
  - "Suas respostas vão direto para a clínica".

  Usa os contratos de contato da tarefa 002 e faz o mesmo log sem o e-mail.
- **Front:** depois de enviar o questionário e no questionário pendente do prontuário, os botões Copiar, WhatsApp e `mailto:` viram o modal C, que reaproveita o componente da 002. O WhatsApp continua com o texto pronto de hoje. Hook e método de repositório próprios.
- **Sem migration.**

## Critérios de Aceite

- [x] `POST …/questionnaires/{id}/email` de um envio pendente responde 202 e dispara `QuestionnaireEmailRequested` (`Event::fake`).
- [x] Paciente de outra clínica, envio de outra clínica ou envio de outro paciente dá 404.
- [x] Envio respondido ou vencido dá 422; paciente sem e-mail dá 422; o sexto pedido no minuto dá 429.
- [x] Com o listener (`Mail::fake`), o e-mail tem "De: <clínica> via IVS MED", sem Reply-To, assunto sem o título, prazo no fuso da clínica e botão com o `share_url`.
- [x] O contrato do envio não devolve nada para id de outra clínica.
- [x] Depois de enviar um questionário, o prontuário abre o modal C. O e-mail mostra "Enviado <hora>"; o questionário pendente tem "Enviar ao paciente" (Vitest).
- [x] Não sobra `mailto:` no fluxo do questionário.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-programa-por-email-no-detalhe` (componente do modal C, contratos de contato e o fluxo do listener).
- `004-pagina-publica-do-questionario` (a página para onde o link leva).

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:**
  - `modules/ClinicQuestionnaire/tests/Feature/PatientQuestionnaireIsolationTest.php`
  - `useQuestionnaireSend` no `questionnaire-form/shared.ts`
  - Os botões de compartilhar em `patient-record/parts.tsx`
- **Referência visual:** e-mail "questionário" da variante A na branch `prototype/022-emails`.
- **Skills:** `architecture-paradigm-modular-monolith`, `laravel-queues`, `php-testing`, `frontend-ddd`, `design-system`, `frontend-testing`.

## Como testar na mão

1. Como fisioterapeuta da clínica A, envie um questionário a um paciente com seu e-mail. Ao enviar, abre o modal C. Clique em "Enviar" no E-mail.
2. O e-mail chega, e o botão abre a página pública da tarefa 004.
3. No prontuário, o questionário pendente tem "Enviar ao paciente" para reenviar.
4. Por HTTP, logado na clínica B, faça `POST` no envio da clínica A: dá 404.
