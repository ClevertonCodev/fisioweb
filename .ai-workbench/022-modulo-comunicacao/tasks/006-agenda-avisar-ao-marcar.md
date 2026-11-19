# Agenda: avisar o paciente ao marcar consulta

**Tipo:** História
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 9, 12, 14, 15, 20, 33
**Issue:** ainda não criada

## Descrição

Marcar uma consulta hoje não avisa o paciente. Esta tarefa cria o envio de e-mail da agenda:

- endpoint com o tipo do aviso;
- evento;
- listener;
- template "Consulta marcada".

Ao marcar uma consulta com paciente, a agenda abre o modal C, com "Avisar o paciente?" e a opção "Não avisar". Remarcar e cancelar vêm na tarefa 007 sobre esta base.

## O que construir

- **Endpoint `POST /api/clinic/appointments/{id}/email`, corpo `{ kind }`** (módulo `ClinicScheduling`, guard `clinic`, `AppointmentPolicy`: admin e secretária em qualquer consulta, fisioterapeuta só nas próprias), limitado a 5 por minuto por usuário.
  - Consulta buscada pela clínica do usuário autenticado; outra clínica dá 404.
  - Consulta sem paciente dá 422; paciente sem e-mail dá 422.
  - O `kind` aceita `scheduled`, `rescheduled` e `cancelled`. Nesta tarefa, só `scheduled` monta e-mail; os outros dois o endpoint já valida contra o status:
    - `cancelled` só para consulta cancelada;
    - `scheduled` e `rescheduled` só para consulta não cancelada;
    - incoerente dá 422.
  - Dispara `AppointmentEmailRequested` (versão, `clinicId`, `appointmentId`, `patientId`, `actorId`, `kind`, `occurredAt`) e responde 202.
- **Listener na fila no `Email`:**
  - Lê a consulta pelo `AppointmentReadService` que já existe e confere que o `clinicId` do snapshot é o do evento.
  - Lê paciente, clínica e profissional pelos contratos da tarefa 002.
  - Monta "Consulta marcada":
    - assunto "Consulta marcada para <dd/mm> às <hh:mm> · <clínica>";
    - data e horário no fuso da clínica, profissional e local;
    - botão "Como chegar", só quando a clínica tem endereço (link de busca do Google Maps com rua, número, cidade e UF);
    - "Precisa remarcar? Ligue para a clínica: <telefone>".
- **Agenda (front):**
  - Depois de marcar uma consulta com paciente, abre o modal C com o título "Avisar o paciente?", as linhas E-mail e WhatsApp (sem Copiar link, porque consulta não tem link) e o rodapé "Não avisar".
  - O texto pronto do WhatsApp é novo: data, horário e profissional.
  - Consulta sem paciente não abre o modal.
- **O mapper da consulta** passa a ler o e-mail e o celular do paciente, que a API já devolve.
- **O `AppointmentScheduledNotificationJob`** (que hoje só faz log, com TODO) fica como está. Removê-lo está anotado no `DEFERRED.md` da feature.
- **Sem migration.**

## Critérios de Aceite

- [ ] `POST /api/clinic/appointments/{id}/email` com `kind: scheduled` responde 202 e dispara `AppointmentEmailRequested` (`Event::fake`).
- [ ] Consulta de outra clínica dá 404. O fisioterapeuta, numa consulta de outro profissional, recebe o mesmo bloqueio que já recebe para editá-la.
- [ ] Consulta sem paciente dá 422; paciente sem e-mail dá 422; `kind` incoerente com o status dá 422; o sexto pedido no minuto dá 429.
- [ ] Com o listener (`Mail::fake`), o e-mail "Consulta marcada" tem a data e o horário no fuso da clínica (consulta gravada em UTC aparece no horário local), profissional, local e "Precisa remarcar? Ligue…".
- [ ] "Como chegar" aparece com endereço da clínica e some sem endereço (teste).
- [ ] O listener não envia se a consulta não for da clínica do evento.
- [ ] Na agenda, marcar uma consulta com paciente abre "Avisar o paciente?"; marcar sem paciente não abre; "Não avisar" fecha sem chamar a API (Vitest).
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-programa-por-email-no-detalhe` (componente do modal C, contratos de contato e o fluxo do listener).

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:**
  - `modules/ClinicScheduling/tests/Feature/AppointmentUpdateStatusTest.php` (outra clínica)
  - `modules/GoogleCalendar/app/Listeners/SyncSchedulingToGoogle.php` (leitura pelo `AppointmentReadService`)
  - `AgendaPage.tsx` (`handleSubmit`)
- **Referência visual:** e-mail "consulta-marcada" da variante A na branch `prototype/022-emails`.
- **Skills:** `architecture-paradigm-modular-monolith`, `laravel-queues`, `php-testing`, `frontend-ddd`, `design-system`, `frontend-testing`.

## Como testar na mão

1. Como secretária da clínica A (com endereço preenchido em Dados da clínica), marque uma consulta para um paciente com seu e-mail.
2. Abre "Avisar o paciente?". Clique em "Enviar" no E-mail: o e-mail chega com o horário certo e o "Como chegar" abre o mapa.
3. Marque uma consulta sem paciente: o modal não abre.
4. Como fisioterapeuta, tente o `POST` numa consulta de outro profissional: dá erro.
5. Por HTTP, logado na clínica B, faça `POST` na consulta da clínica A: dá 404.
