# Enviar o programa por e-mail pelo detalhe do programa, com o modal "Enviar ao paciente"

**Tipo:** História
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 2, 3, 4, 5, 6, 7, 16, 17, 18, 22, 23, 33, 36, 37
**Issue:** ainda não criada

## Descrição

Hoje o detalhe do programa só tem um botão solto de WhatsApp, e o e-mail sai pelo `mailto:` do computador de quem usa. Esta tarefa monta o caminho completo do envio de e-mail ao paciente, que as próximas tarefas reaproveitam:

- endpoint na origem que autoriza;
- evento de integração só com ids;
- listener na fila do `Email`, que busca os dados por contratos públicos;
- template do programa;
- modal "Enviar ao paciente" (variante C).

O primeiro uso é no detalhe do programa.

## O que construir

- **Endpoint `POST /api/clinic/treatment-plans/{id}/email`** (módulo `TreatmentProgram`, guard `clinic`, os três papéis como a Policy `view` de hoje), limitado a 5 por minuto por usuário.
  - Busca o programa filtrando pela clínica do usuário autenticado; outra clínica dá 404.
  - Programa sem paciente ou em rascunho dá 422; paciente sem e-mail dá 422.
  - Dispara `TreatmentPlanEmailRequested` (versão, `clinicId`, `treatmentPlanId`, `patientId`, `actorId`, `occurredAt`) e responde 202 com `{ data: { queued: true } }`.
- **Contratos públicos de leitura,** cada um filtrando por `clinicId` na própria busca:
  - `Patient`: contato do paciente (nome, apelido quando usa apelido, e-mail, celular e `receives_appointment_reminder_email`, criado na 008).
  - `Clinic`: contato da clínica (nome, telefone, endereço, fuso e `appointment_reminder_email_enabled`, criado na 008) e nome e papel do profissional.
  - `TreatmentProgram`: dados do programa para o e-mail (título, mensagem, início, fim, número de exercícios, status, paciente, `share_url`).
- **Listener na fila no `Email`** (3 tentativas, espera de 10, 30 e 60 s):
  - Lê os contratos com o `clinicId` do evento; se o item não for da clínica, não envia e registra.
  - Monta o e-mail "Programa enviado" com o layout da tarefa 001:
    - "De: <clínica> via IVS MED", sem Reply-To;
    - assunto "Seu programa de exercícios está disponível · <clínica>";
    - saudação com apelido ou primeiro nome;
    - título, início, válido até e número de exercícios;
    - mensagem do profissional em citação, com nome e papel;
    - botão "Abrir meu programa";
    - "Este link é só seu…";
    - rodapé com telefone e endereço da clínica.
  - Datas no fuso da clínica.
  - Log de "envio feito" ou "falhou" com tipo, `clinic_id`, id do programa e `patient_id`, sem o e-mail.
- **Componente "Enviar ao paciente" (variante C),** reutilizável:
  - Uma linha por canal: E-mail (envia pelo endpoint e mostra "Enviado <hora>" e "Reenviar"), WhatsApp (abre `wa.me` com o texto pronto e mostra "Aberto <hora>") e Copiar link.
  - Canal sem contato fica desabilitado, com o motivo no lugar do endereço.
  - Rodapé "Fechar", que vira "Concluir" depois de um envio.
  - Erro da API vira toast.
- **Detalhe do programa:** o botão "WhatsApp" vira "Enviar ao paciente", que abre o componente. Programa em rascunho mantém o botão desabilitado com "Rascunho: o paciente ainda não recebeu".
- **Front:** hook de mutation em `application/`, método no repositório do programa em `infrastructure/`. O `mailto:` do programa sai.
- **Sem migration.**

## Critérios de Aceite

- [x] `POST /api/clinic/treatment-plans/{id}/email` de um programa ativo com paciente com e-mail responde 202 e dispara `TreatmentPlanEmailRequested` com os ids certos (`Event::fake`).
- [x] Programa de outra clínica dá 404 e não dispara evento.
- [x] Programa em rascunho ou sem paciente dá 422; paciente sem e-mail dá 422.
- [x] O sexto pedido no mesmo minuto pelo mesmo usuário dá 429.
- [x] Com o listener rodando (`Mail::fake`), o e-mail vai para o e-mail do paciente:
  - De "<clínica> via IVS MED" `<naoresponda@ivsmed.com>`, sem Reply-To;
  - assunto sem o título do programa;
  - corpo com título, datas no fuso da clínica, número de exercícios, mensagem, botão com o `share_url` e telefone da clínica.
- [x] Paciente que usa apelido é chamado pelo apelido na saudação.
- [x] Os contratos de contato do paciente, de contato da clínica e do programa não devolvem nada quando o id é de outra clínica (teste de cada contrato).
- [x] O listener não envia quando o programa do evento não é da clínica do evento.
- [x] O log do envio tem o tipo, `clinic_id`, id do programa e `patient_id`, e não tem o e-mail do paciente.
- [x] No detalhe do programa, "Enviar ao paciente" abre o modal C. E-mail mostra "Enviado <hora>" e "Reenviar"; sem e-mail, o botão fica desabilitado com "Paciente sem e-mail cadastrado"; WhatsApp e Copiar link funcionam (Vitest).
- [x] O teste de fronteira continua passando: o `Email` só usa contratos públicos e os eventos não referenciam Model.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-modulo-email-e-emails-do-sistema` (módulo `Email` e layout IVS MED).

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:**
  - `modules/GoogleCalendar/app/Listeners/SyncSchedulingToGoogle.php`: listener de outro módulo que lê por contrato público.
  - `modules/TreatmentProgram/tests/Feature/TreatmentPlanIsolationTest.php`: 404 de outra clínica.
  - `modules/TreatmentProgram/app/Events/TreatmentPlanActivated.php`: formato do evento.
  - `ProgramPdfViewModelBuilder` (`deepLinkUrl`): onde o `share_url` é montado hoje.
- **Referência visual:** branch `prototype/022-emails`, `send-to-patient-prototype/VariantC.tsx` e o e-mail "programa" da variante A.
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-clean-code`, `laravel-queues`, `php-testing`, `frontend-ddd`, `design-system`, `api-client`, `frontend-testing`, `security-audit`.

## Como testar na mão

1. Entre como fisioterapeuta da clínica A e abra `/clinica/programas/<id>` de um programa ativo com paciente que tenha seu e-mail do Gmail.
2. Clique em "Enviar ao paciente" e depois em "Enviar" na linha do E-mail. A linha mostra "Enviado <hora>", e o e-mail chega com o layout IVS MED.
3. No Gmail, confira que "Responder" não vai para lugar nenhum útil: o remetente é o `naoresponda`, e o texto não pede resposta.
4. Abra "WhatsApp" e confira o texto pronto no WhatsApp Web.
5. Abra um rascunho: o botão fica desabilitado.
6. Por HTTP, logado na clínica B, faça `POST` no programa da clínica A: dá 404.
