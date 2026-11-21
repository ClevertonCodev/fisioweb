# Disparar o lembrete de consulta por e-mail 24 h antes

**Tipo:** História
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 29, 32, 33
**Issue:** ainda não criada

## Descrição

Com as chaves da tarefa 008, esta tarefa manda o lembrete automático: o único e-mail que sai sem ninguém clicar. Um comando de hora em hora acha as consultas que começam daqui a 23 a 24 h. O módulo `Email` decide quem recebe e garante que cada consulta seja lembrada uma vez por horário.

## O que construir

- **Comando de hora em hora no `ClinicScheduling`,** registrado no provider do módulo com `withoutOverlapping` e `onOneServer`, como os de `ClinicFinance` e `GoogleCalendar`.
  - Acha as consultas com paciente, com status marcada ou confirmada, que começam entre 23 h e 24 h depois da rodada.
  - Dispara um `AppointmentReminderDue` por consulta (versão, `clinicId`, `appointmentId`, `patientId`, `startsAt`, `occurredAt`).
  - Consulta marcada a menos de 23 h do horário não recebe lembrete.
- **Tabela do `Email` de lembretes enviados:** `clinic_id`, `appointment_id`, `starts_at` lembrado e data do envio, com único em (`appointment_id`, `starts_at`).
- **Listener na fila no `Email`.** Só envia se:
  - a consulta é da clínica do evento e o `starts_at` do snapshot é o do evento;
  - a chave da clínica está ligada;
  - o paciente tem e-mail e o lembrete ligado.

  Antes de enviar, grava na tabela pelo índice único; se já existe, não envia. Lê tudo pelos contratos públicos, com o `clinicId` do evento.
- **Template "Lembrete":**
  - assunto "Lembrete: consulta amanhã às <hh:mm> · <clínica>";
  - "Sua consulta é amanhã", com data, horário no fuso da clínica, profissional e local;
  - "Como chegar" quando há endereço;
  - "Não vai conseguir ir? Avise a clínica pelo <telefone>";
  - no rodapé, o link "Não quero mais receber lembretes". O endereço do link é montado aqui e a página dele vem na tarefa 010.
- **Migration:** só a tabela de lembretes enviados, no `Email`.
- **Operação:** o servidor precisa do `schedule:run` no cron. No smoke local, roda-se o comando à mão.

## Critérios de Aceite

- [x] O comando está agendado de hora em hora com `withoutOverlapping` e `onOneServer` (teste no `Schedule`).
- [x] Com `travelTo`, o comando dispara `AppointmentReminderDue` só para consultas com paciente, marcada ou confirmada, entre 23 e 24 h à frente. Fora da janela, cancelada ou sem paciente não dispara (teste).
- [x] Clínica com o lembrete desligado não recebe e-mail; paciente com o lembrete desligado ou sem e-mail não recebe (teste com `Mail::fake`).
- [x] Rodar o comando de novo na mesma janela não manda um segundo lembrete para a mesma consulta (teste).
- [x] Remarcar a consulta para outro horário e rodar o comando na nova janela manda um lembrete novo (teste).
- [x] O lembrete mostra o horário no fuso da clínica, "Como chegar" só com endereço e o link "Não quero mais receber lembretes".
- [x] O listener não envia quando a consulta não é da clínica do evento.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `006-agenda-avisar-ao-marcar` (layout dos e-mails de consulta e leitura da consulta no listener).
- `008-configuracao-do-lembrete` (chaves da clínica e do paciente).

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:**
  - `modules/ClinicFinance/tests/Feature/FinanceRecurrenceTest.php` (schedule e comando com `travelTo`)
  - `GoogleCalendarServiceProvider` (como o módulo registra o schedule)
- **Referência visual:** e-mail "lembrete" da variante A na branch `prototype/022-emails`.
- **Skills:** `laravel-queues`, `laravel-eloquent`, `architecture-paradigm-modular-monolith`, `php-testing`.

## Como testar na mão

1. Na clínica A, ligue o lembrete em Dados da clínica.
2. Marque uma consulta para daqui a 23 h e meia, para um paciente com seu e-mail e o lembrete ligado.
3. Rode o comando do lembrete à mão, com o worker da fila no ar. O lembrete chega.
4. Rode de novo: não chega um segundo.
5. Desligue o lembrete do paciente e marque outra consulta na mesma janela: não chega.
