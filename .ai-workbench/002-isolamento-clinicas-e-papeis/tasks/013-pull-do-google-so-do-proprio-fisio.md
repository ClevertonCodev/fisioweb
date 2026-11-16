# Pull do Google só altera as consultas do próprio fisio

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 48
**Issue:** ainda não criada

## Descrição

Hoje o pull do Google Agenda acha a consulta pelo `google_event_id` dentro da clínica, sem olhar o profissional. O pull do fisio A pode reatribuir (apagando o paciente) ou cancelar uma consulta do fisio B da mesma clínica (achado Baixo da auditoria).

## O que construir

- O contrato público de ClinicScheduling para eventos externos passa a receber o `clinic_user_id` do dono da conexão: a busca do id pelo evento externo, o upsert e o cancelamento.
- A consulta com o mesmo `google_event_id` de outro profissional não é tocada. Um evento novo cria uma consulta do dono da conexão. Um evento cujo id já está na consulta de outro profissional é ignorado, sem criar cópia para o dono da conexão (decisão no `decisoes.md`).
- O GoogleCalendar passa o profissional em todas as chamadas.
- A mudança de assinatura sai no mesmo commit nos dois módulos.

## Critérios de Aceite

- [x] O pull do fisio A com um evento cujo `google_event_id` já está na consulta do fisio B não muda a consulta do B (o teste `AuditGooglePullCrossUserTest` da auditoria, invertido; no repositório, `GooglePullCrossUserTest::test_pull_of_physio_a_does_not_touch_appointment_of_physio_b_with_same_event_id`)
- [x] O cancelamento vindo do Google do A não cancela a consulta do B
- [x] O pull do A continua criando e atualizando as consultas dele
- [x] O teste de fronteira de módulos continua verde
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/ClinicScheduling/app/Services/AppointmentExternalSyncService.php`; `modules/GoogleCalendar/app/Jobs/PullGoogleCalendarJob.php`
- **Skills:** `architecture-paradigm-modular-monolith`, `php-testing`, `laravel-queues`

## Como testar na mão

Coberto por teste: a integração com o Google é feita com fake. Na mão, só com duas contas Google de teste conectadas a dois fisios da mesma clínica.
