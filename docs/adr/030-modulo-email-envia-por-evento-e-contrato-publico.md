# ADR 030: O módulo Email monta e envia; a origem autoriza e dispara um evento

## Contexto

Até a feature 022 o sistema mandava só dois e-mails (confirmação de cadastro da clínica e esqueci minha senha), com o layout padrão do Laravel. Tudo o que ia ao paciente saía do aparelho de quem usa (`wa.me`, `mailto:`). A 022 passa a mandar pelo servidor o programa, o questionário, os avisos de consulta e o lembrete, todos com a marca IVS MED, e quer um lugar só para os templates.

Os dados de cada e-mail têm donos diferentes: o programa é do `TreatmentProgram`, o questionário do `ClinicQuestionnaire`, a consulta do `ClinicScheduling`, o paciente do `Patient` e a clínica e o profissional do `Clinic`.

## Decisão

- Módulo novo **`Email`**, técnico como `Pdf` e `Cloudflare` (fora do mapa de capacidades com prefixo `Clinic`, porque também manda e-mail do sistema). Ele é dono dos templates, dos Mailables, do envio pela fila, da regra de quem recebe o lembrete, do link de sair dos lembretes e do log de envio.
- **A origem autoriza; o `Email` monta e envia.** Cada módulo de origem expõe a ação "enviar por e-mail", confere Policy, `clinic_id` e contato, e dispara um **evento de integração** só com ids: `TreatmentPlanEmailRequested`, `QuestionnaireEmailRequested`, `AppointmentEmailRequested` (com o tipo) e `AppointmentReminderDue`. O evento mora no módulo dono do fato.
- O listener do `Email` roda na fila e busca nome, e-mail, endereço, título e link por **contratos públicos de leitura** dos módulos donos, sempre com o `clinicId` do evento. Ele não importa Model, Repository nem lê tabela de outro módulo.
- **Tema único:** o `Email` aponta o markdown de e-mail do Laravel (`mail.markdown.paths` e `mail.markdown.theme`) para o layout IVS MED. Toda notificação `MailMessage`, inclusive as que já existiam (`VerifyClinicEmailNotification`, `ResetPassword`), sai com a marca sem depender do `Email`.
- **Logo embutido:** os templates referenciam `cid:ivsmed-logo`, e um listener de `MessageSending` do `Email` anexa o PNG como parte inline. Assim o logo aparece no Gmail e no Outlook mesmo sem o servidor estar acessível.
- **Lembrete de consulta:** o comando `clinic-scheduling:send-appointment-reminders` roda de hora em hora (`withoutOverlapping(55)`, `onOneServer`; o servidor precisa do `schedule:run` no cron) e dispara um `AppointmentReminderDue` por consulta que começa entre 23 e 24 h depois da hora cheia da rodada. A âncora na hora cheia faz uma rodada atrasada cobrir a mesma faixa. O `Email` grava cada horário lembrado em `email_appointment_reminders`, com único em (`appointment_id`, `starts_at`), antes de enviar: a mesma consulta é lembrada uma vez por horário, e remarcar para um horário ainda não lembrado permite um lembrete novo. Se o envio falha, a linha é apagada para a próxima tentativa da fila.
- **Reset de senha pela fila:** o link é montado na requisição (`QueuedResetPassword` guarda a URL pronta), porque o callback estático `ResetPassword::createUrlUsing` não existe no processo do worker.

## Consequências

- Benefícios:
  - Um lugar só para a cara dos e-mails; a origem não sabe de template.
  - O `Email` pode virar um worker separado no futuro: depende só de eventos e contratos públicos.
- Custos:
  - Cada e-mail novo pede um evento na origem, um contrato de leitura (se ainda não houver) e um listener no `Email`.
  - O conteúdo é lido na hora do envio, não no clique: se o item mudar entre os dois, o e-mail sai com o dado novo.
- Regras que agentes devem preservar:
  - O código de produção do `Email` só referencia `Contracts\Public`, `Data\Public` e `Events` de outros módulos (`tests/Architecture/ModuleBoundaryTest.php`, teste do módulo `Email`).
  - Evento leva ids, nunca Model.
  - O lembrete reserva a linha em `email_appointment_reminders` antes de enviar e só envia se a reserva entrou; não trocar por "enviar e depois gravar".
  - Não voltar a usar `ResetPassword::createUrlUsing` para o link do reset que vai pela fila.

## Validação

- `tests/Architecture/ModuleBoundaryTest.php` (cerca do `Email`)
- `modules/Email/tests/Feature/SystemEmailLayoutTest.php`
- `modules/Email/tests/Feature/SendAppointmentReminderTest.php` e `modules/ClinicScheduling/tests/Feature/AppointmentReminderCommandTest.php` (lembrete)
- `modules/Clinic/tests/Feature/PasswordResetTest.php` e `modules/Admin/tests/Feature/PasswordResetTest.php` (reset pela fila)
