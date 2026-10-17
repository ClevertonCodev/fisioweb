# ADR: ClinicScheduling physical extraction

## Contexto

O modulo `Clinic` concentra financeiro, agenda, cuidado clinico, usuarios, dashboard e outras responsabilidades. Apos o primeiro corte fisico (`ClinicFinance`, ver ADR-006), o segundo corte e a **agenda** (appointments), sem alterar rotas REST publicas nem nomes de tabelas existentes.

Alem do agendamento estar misturado em `Clinic`, havia acoplamento implicito: `GoogleCalendar`, `Dashboard` e o calculo de ocupacao acessavam diretamente o Model interno `Appointment`, e o `AppointmentService` chamava diretamente Job do GoogleCalendar e o `ActivityLogger` do Clinic.

## Decisao

Criar o modulo fisico `ClinicScheduling` como dono de consultas/agendamento da clinica: Model, Enum de status, Service, Repository, Policy, FormRequests, Controller, Job de notificacao, Factory, eventos de integracao, rotas e testes.

As rotas publicas continuam sob os mesmos paths `/api/clinic/appointments/*` com os mesmos shapes de request/response. A propriedade do backend muda de `Clinic` para `ClinicScheduling`, mas o frontend nao percebe diferenca.

A tabela existente permanece com o nome atual `clinic_appointments`. A migration que a cria pertence ao modulo dono e fica em `modules/ClinicScheduling/database/migrations/`.

### Fronteira e colaboracao entre modulos

- **Relacoes Eloquent cross-module por FQN inline** (`\Modules\Clinic\Models\ClinicUser::class` etc.), sem `use` no topo — mesma convencao de `ClinicFinance`, mantendo o `ModuleBoundaryTest` verde.
- **Event-Driven Architecture**: o `AppointmentService` deixou de chamar diretamente GoogleCalendar e ActivityLogger. Passou a despachar, via `DB::afterCommit`, quatro eventos de integracao `final readonly` com IDs + snapshot minimo + `occurredAt`:
  - `AppointmentScheduled` (create)
  - `AppointmentRescheduled` (qualquer update/PUT)
  - `AppointmentCancelled` (cancel)
  - `AppointmentCompleted` (status → completed)
- **Listeners** assumem as integracoes (dependencia invertida — `ClinicScheduling` nao importa esses modulos):
  - `GoogleCalendar\Listeners\SyncSchedulingToGoogle` (push/delete no Google).
  - `Clinic\Listeners\RecordSchedulingActivity` (log de atividade).
- **Read model publico** `ClinicScheduling\Contracts\Public\SchedulingReadServiceInterface` para `Dashboard` e `OccupancyRateService` lerem dados de agendamento sem importar o Model privado.

O modulo e registrado pelo mecanismo real do projeto (`module.json` + `modules_statuses.json`), sem tocar em `bootstrap/providers.php`.

### Correcao de roteamento

O catch-all do SPA em `routes/web.php` passou a excluir o prefixo `api/` (`->where('any', '^(?!api/).*$')`), evitando que rotas REST de modulos sejam sombreadas pela ordem de registro de providers. Nao altera nenhum path/shape REST nem o frontend.

## Consequencias

- Beneficios:
  - A agenda passa a ter dono claro e evolui isolada.
  - GoogleCalendar e ActivityLog viram consumidores por evento, nao por chamada direta.
  - Dashboard/ocupacao leem por contrato publico, nao pelo Model privado.
  - A extracao futura para microservico fica menos custosa.
- Custos:
  - Periodo curto de compatibilidade entre codigo legado e modulo novo.
  - Imports, policies, factories, seeders e testes remapeados.
  - `GoogleCalendar` ainda usa o Model `Appointment` de `ClinicScheduling` para push/pull (debito de readiness; idealmente via contrato publico de escrita).
- Regras que agentes devem preservar:
  - Nao renomear `clinic_appointments`; nao mudar paths/shapes REST.
  - Nao adicionar regra de agendamento em `modules/Clinic`.
  - Nao importar Models/Repositories privados de outro modulo em codigo de producao.
  - Eventos carregam IDs + snapshot minimo, nunca Model Eloquent.
  - Manter novas migrations de agendamento em `modules/ClinicScheduling/database/migrations/`.

## Extracao futura

Antes de virar microservico, `ClinicScheduling` precisara de contratos externos versionados, outbox/inbox, idempotencia obrigatoria nos consumidores, autenticacao entre servicos e observabilidade com logs correlacionados. O pull do GoogleCalendar deve passar a usar um contrato publico de escrita em vez do Model.
