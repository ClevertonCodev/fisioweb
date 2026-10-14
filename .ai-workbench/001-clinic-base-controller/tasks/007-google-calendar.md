# Rede de segurança e migração de GoogleCalendar

**Tipo:** Tarefa
**Plano:** `../plans/clinic-base-controller.md`
**Issue:** ainda não criada

## Descrição

O GoogleCalendarController lê o guard `clinic` direto nas ações autenticadas (connect, status, pull e disconnect). Os testes atuais cobrem o fluxo de conexão de um único usuário, mas não verificam que um usuário não enxerga nem mexe na conexão de outro, seja da mesma clínica ou de outra. Antes de migrar, escrevemos esses testes contra o código atual. Depois o controller passa a usar o controller base.

Cobre as histórias 13, 16, 17 e 18 do plano.

## O que construir

- **Rede de segurança (antes da migração, passando no código atual).** Com o usuário de A conectado ao Google:
  - `GET /api/clinic/google-calendar/status` do usuário de B mostra "não conectado";
  - `POST .../pull` do usuário de B é rejeitado como "não conectado" e não dispara sincronização da conta de A;
  - `DELETE /api/clinic/google-calendar` do usuário de B não desconecta a conta de A.
- **Migração:** o GoogleCalendarController estende o controller base, e as ações autenticadas usam os métodos novos. O callback público (`GET .../callback`) não lê o guard e não muda.
- Guard `clinic` nas ações autenticadas, que seguem sob `auth:clinic` e `clinic.guard`. A integração externa com o Google continua com fake nos testes. Não tem migration nem frontend.

## Critérios de Aceite

- [ ] Os testes novos de isolamento de conexão (status, pull e disconnect) existem e passam **antes** da migração. O commit de teste vem antes do commit de refatoração. (pendente: depende de como o usuário commitar — os testes foram escritos e confirmados verdes no código antigo antes de cada migração; ver sugestão de commits)
- [x] Nenhum `Auth::guard('clinic')` ou `auth('clinic')` sobra no GoogleCalendarController.
- [x] `GoogleCalendarConnectionTest` e `GoogleCalendarArchitectureTest` continuam verdes sem alteração.
- [x] Um usuário de outra clínica não vê, não sincroniza e não desconecta a conta Google de um usuário desta clínica.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-controller-base-e-modulo-clinic` (Criar ClinicAuthenticatedController e migrar Patient, ClinicProfile e Exercise)

## Notas de Implementação

- **Branch:** `feat/clinic-base-controller-google-calendar`
- **Exemplo no código:** `modules/GoogleCalendar/tests/Feature/GoogleCalendarConnectionTest.php`, com o padrão de fake da integração e `test_pull_rejected_when_not_connected`.
- **Skills:** `php-testing`, `laravel-queues` (se o pull despachar job, use `Queue::fake` e `assertNotPushed` para a conta de A).

## Como testar na mão

1. Com o usuário de A conectado ao Google Calendar (ou com tokens gravados manualmente no ambiente local), entrar como usuário de B.
2. Abrir a tela de integração: aparece "não conectado".
3. Clicar em desconectar como B: a conexão de A continua ativa (conferir o status como A).
