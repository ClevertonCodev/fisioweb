# Phase 0 — Research: Clinic Scheduling Extraction

Resolve as decisões de design antes da implementação. Cada decisão segue o formato Decision / Rationale / Alternatives.

## R1. Mecanismo de registro do módulo

- **Decision**: Criar `modules/ClinicScheduling/module.json` com `providers: [Modules\ClinicScheduling\Providers\ClinicSchedulingServiceProvider]` e adicionar `"ClinicScheduling": true` em `modules_statuses.json`. `composer.json` do módulo com PSR-4 (`app/`, `database/factories/`, `database/seeders/`, `tests/`) e `extra.laravel.providers: []`. Rodar `composer dump-autoload`.
- **Rationale**: É exatamente o padrão de `ClinicFinance` e `GoogleCalendar`. `nwidart/laravel-modules` descobre o provider via `module.json` quando o módulo está habilitado em `modules_statuses.json`.
- **Alternatives**: Registrar em `bootstrap/providers.php` — **proibido** pelo enunciado e fora do padrão do projeto.

## R2. Relações Eloquent cross-module sem violar a fronteira

- **Decision**: No Model `Appointment` (agora em ClinicScheduling), declarar as relações com **FQN inline**: `belongsTo(\Modules\Clinic\Models\Clinic::class)`, `belongsTo(\Modules\Clinic\Models\ClinicUser::class)`, `belongsTo(\Modules\Patient\Models\Patient::class)`. **Não** usar `use Modules\Clinic\Models\...` no topo.
- **Rationale**: É a convenção real de `ClinicFinance` (`FinancialTransaction::clinic()` usa `\Modules\Clinic\Models\Clinic::class`). O `ModuleBoundaryTest` só flagra linhas `^use\s+Modules\\...\\Models\\`; FQN inline não dispara. Mantém eager loading e shape de response (`load(['patient','clinicUser'])`) idênticos.
- **Alternatives**: Read model puro sem relação Eloquent — quebraria o `load()` e o shape de response; rejeitado. Whitelist no boundary test — débito desnecessário, há convenção limpa.

## R3. FormRequests e Policy: remover `use` de Models de outros módulos

- **Decision**: Em `Store/UpdateAppointmentRequest`, o bloco `withValidator` usa hoje `use Modules\Clinic\Models\ClinicUser` e `use Modules\Patient\Models\Patient`. Substituir por: (a) validação por FK via `Rule::exists` (já presente) e (b) checagens multi-tenant via **query builder com FQN inline** (`\Modules\Patient\Models\Patient::query()...`) ou `DB::table('patients')`. Em `AppointmentPolicy`, trocar o type-hint `ClinicUser $user` por `$user` sem tipo (como `FinancialTransactionPolicy`).
- **Rationale**: Esses são arquivos de produção de ClinicScheduling e seriam escaneados pelo `ModuleBoundaryTest` estendido. FQN inline / sem type-hint mantém comportamento e passa no boundary test.
- **Alternatives**: Manter `use` e adicionar whitelist — rejeitado (há caminho limpo).

## R4. Integração com GoogleCalendar — inversão via eventos

- **Decision**: Remover do `AppointmentService` as chamadas diretas a `SyncAppointmentToGoogleJob` (push no create/update, delete no cancel). O service passa a despachar os 4 eventos via `DB::afterCommit`. Criar `Modules\GoogleCalendar\Listeners\SyncSchedulingToGoogle` que escuta `AppointmentScheduled`/`AppointmentRescheduled` (→ `SyncAppointmentToGoogleJob` upsert) e `AppointmentCancelled` (→ delete). Re-apontar os `use Modules\Clinic\Models\Appointment` / `AppointmentStatus` de GoogleCalendar para `Modules\ClinicScheduling\...`.
- **Rationale**: Inverte a dependência (ClinicScheduling deixa de importar `Modules\GoogleCalendar\Jobs\...`). GoogleCalendar continua dono da sua integração e reage a fatos de agendamento — EDA correto. Comportamento preservado: o mesmo Job roda nas mesmas transições.
- **Nuance preservada**: hoje o push só dispara se `clinicUser->isGoogleConnected()`; o listener/Job mantém esse guard (o Job já checa `isGoogleConnected()`). O delete usa `google_event_id` capturado — o evento `AppointmentCancelled` carrega `appointmentId`; o listener lê o `google_event_id` atual via Job (como hoje, que recarrega no dispatch). Manter o comportamento atual de capturar `google_event_id` antes do dispatch dentro do listener.
- **Alternatives**: Manter dispatch direto do Job no service — mantém ClinicScheduling acoplado a GoogleCalendar; rejeitado pela meta EDA. Reescrever GoogleCalendar para consumir só read model (sem o Model) — escopo grande; deferido (débito de readiness).

## R5. Pull do Google (PullGoogleCalendarJob escreve appointments)

- **Decision**: `PullGoogleCalendarJob` continua criando/atualizando `Appointment` diretamente, apenas re-apontando os imports para `Modules\ClinicScheduling\Models\Appointment` e `Enums\AppointmentStatus`. Documentar como débito de readiness (idealmente um contrato público de upsert em ClinicScheduling).
- **Rationale**: Minimiza risco e preserva o pull bidirecional. GoogleCalendar não é escaneado pelo boundary test, então não falha fitness. O débito fica registrado no checklist de readiness.
- **Alternatives**: Expor `SchedulingWriteServiceInterface` público para o pull — mais correto, porém amplia o escopo; deferido com next-step no checklist.

## R6. ActivityLog — inversão via listener

- **Decision**: Remover do `AppointmentService` as chamadas a `ActivityLoggerInterface`. Criar `Modules\Clinic\Listeners\RecordSchedulingActivity` que escuta os eventos e chama o `ActivityLogger` do próprio Clinic, registrando `AppointmentScheduled`/`Completed`/`Cancelled` com as mesmas descrições/`ActivityType` atuais.
- **Rationale**: `ActivityLog`/`ActivityType`/`ClinicActivity` pertencem ao Clinic. O listener mantém a regra dentro do dono e remove o acoplamento ClinicScheduling → `Modules\Clinic\Contracts\ActivityLoggerInterface`. Descrições/labels preservados.
- **Nuance**: hoje o ator é `Auth::guard('clinic')->id()` (resolvido dentro do `ActivityLogger`). Como o evento é despachado `afterCommit` na mesma request, o guard ainda está autenticado quando o listener (síncrono) roda. Os eventos também carregam `actorId` como snapshot para robustez/observabilidade. O subject (`ClinicActivity.subject_*`) hoje guarda a classe do Model; com listener, registrar `subject_type` = FQN do `Appointment` de ClinicScheduling + `subject_id` = `appointmentId` (preserva semântica; o valor textual da classe muda de namespace — aceitável, não faz parte do contrato REST).
- **Alternatives**: Mover ActivityLog para ClinicScheduling — não, é capability transversal do Clinic. Manter chamada direta ao contrato — acoplamento indesejado.

## R7. Read model público para Dashboard e OccupancyRate

- **Decision**: Criar contrato público `Modules\ClinicScheduling\Contracts\Public\SchedulingReadServiceInterface` implementado por `SchedulingReadService` (usa `AppointmentRepository`), com métodos que servem exatamente as necessidades atuais:
  - `appointmentsTodayCount(int $clinicId, ?int $clinicUserId, string $timezone): int`
  - `upcomingAppointmentsToday(int $clinicId, ?int $clinicUserId, string $timezone, int $limit): array` — retorna a lista já no shape do dashboard (`id, patient_name, patient_photo_url, title, starts_at, status`).
  - `occupancyIntervals(int $clinicId, int $clinicUserId, CarbonInterface $start, CarbonInterface $end): array` — retorna `[{starts_at, ends_at}]` (Carbon) para o cálculo de ocupação.
  - `DashboardRepository` e `OccupancyRateService` (em Clinic) passam a resolver e chamar esse contrato; removem `use Modules\Clinic\Models\Appointment` / `AppointmentStatus`.
- **Rationale**: Satisfaz FR-018 (Dashboard/Occupancy leem via contrato público, não pelo Model privado), preservando exatamente os números e shapes de response do dashboard. O contrato vive em `Contracts/Public/` para distinguir de contratos internos (Repository/Service interfaces internas).
- **Alternatives**: Dashboard importar o Model de ClinicScheduling por FQN inline — funcionaria no boundary test, mas viola FR-018 (a intenção explícita é contrato público). Rejeitado.

## R8. Eventos de integração — formato

- **Decision**: 4 classes `final readonly` em `modules/ClinicScheduling/app/Events`, espelhando `FinancialTransactionRecorded` (ClinicFinance): primitivos + `CarbonImmutable $occurredAt`, com `int $version`. Campos por evento conforme o snapshot mínimo do enunciado (id, clinicId, patientId?, professionalId?, actorId?, startsAt, endsAt, status, occurredAt). Dispatch sempre via `DB::afterCommit(fn () => Event::dispatch($event))`. Discovery de listeners ligado (`$shouldDiscoverEvents = true` nos EventServiceProviders dos módulos consumidores).
- **Rationale**: Casa com o padrão consolidado de ClinicFinance e com o formato pedido no enunciado. Snapshot mínimo, sem Model Eloquent.
- **Trigger de `AppointmentRescheduled`** (clarificação registrada na spec): disparar em **qualquer** `update`/PUT bem-sucedido.
- **Alternatives**: Eventos carregando o Model — proibido. Dispatch fora de afterCommit — quebra consistência; rejeitado.

## R9. Job de notificação de agendamento

- **Decision**: Mover `AppointmentScheduledNotificationJob` para `modules/ClinicScheduling/app/Jobs`, re-apontando o import do Model para o `Appointment` de ClinicScheduling. Continuar despachando via `->afterCommit()` dentro do `AppointmentService::create` (é Job do próprio módulo — não é acoplamento cross-module).
- **Rationale**: É uma notificação do próprio agendamento; pertence ao dono. Comportamento idêntico ao atual.
- **Alternatives**: Convertê-lo em listener de `AppointmentScheduled` — possível, mas mantê-lo como dispatch direto reduz risco e preserva o teste atual. Pode virar listener no futuro.

## R10. Migrations e `migrate:fresh --seed`

- **Decision**: `git mv` da migration `2026_06_16_000001_create_clinic_appointments_table.php` para `modules/ClinicScheduling/database/migrations/` (conteúdo inalterado: tabela `clinic_appointments`, FKs para `clinics`/`patients`/`clinic_users`). Como as FKs dependem de `clinics`, `patients`, `clinic_users`, o timestamp da migration (`2026_06_16`) é posterior às migrations dessas tabelas — ordem de execução preservada. Sistema é local/dev: validar com `php artisan migrate:fresh --seed`.
- **Rationale**: O dono da tabela carrega a migration (FR-006). O carregamento é por `loadMigrationsFrom` no provider do módulo; o Laravel ordena por nome de arquivo (timestamp), então a ordem global continua correta independentemente do diretório.
- **Atenção a case-sensitivity** ([[git-case-sensitivity-modules]]): conferir o case real do diretório `database/migrations` antes de `git mv` (ClinicFinance usa minúsculo `database/migrations`).
- **Alternatives**: Duplicar/recriar migration — arriscaria divergência de schema; rejeitado.

## R11. Seeders / Factories

- **Decision**: Mover `AppointmentFactory` para `modules/ClinicScheduling/database/factories` (namespace `Modules\ClinicScheduling\Database\Factories`), re-apontando `Clinic`/`ClinicUser`/`Patient` por `use` (factories estão no whitelist `non_production` do boundary test — permitido compor fixtures cross-module). O `Appointment::newFactory()` aponta para a nova factory. Não há `AppointmentSeeder` dedicado hoje; o `DashboardDemoSeeder` (Clinic) cria appointments para demo — manter em Clinic, mas após a extração ele deve criar via factory de ClinicScheduling (factory cross-module é permitida para seeders no whitelist). Avaliar mover a parte de appointments do `DashboardDemoSeeder` é opcional; mínimo: ajustar imports para a nova factory.
- **Rationale**: Factories/seeders já têm exceção de boundary documentada (`module-boundary-whitelist.php` → `non_production`). Mantém `migrate:fresh --seed` populando agendamento.
- **Alternatives**: Criar `AppointmentSeeder` novo em ClinicScheduling — opcional; só se necessário para o seed funcionar.

## R12. Fitness tests

- **Decision**:
  - Estender `ModuleBoundaryTest` para escanear `modules/ClinicScheduling/app` (novo método/loop espelhando `findClinicFinanceViolations`), assertando zero imports privados cross-module.
  - Criar `modules/ClinicScheduling/tests/Feature/SchedulingRouteCompatibilityTest` espelhando `FinanceRouteCompatibilityTest`: as URIs `api/clinic/appointments*` existem com os mesmos métodos e os owners começam com `Modules\ClinicScheduling\Http\Controllers\Appointment`.
  - Estender `ExtractionReadinessTest` com `test_clinic_scheduling_migrations_live_in_the_owner_module` (glob `*clinic_appointments*` ausente em Clinic, presente em ClinicScheduling) e readiness criteria para ClinicScheduling.
  - Flipar `scheduling.status` para `extracted` em `clinic-capability-map.php` e alinhar `owns` (apenas `appointments` por enquanto) e `routes` (`/api/clinic/appointments/*`).
  - Adicionar bloco `ClinicScheduling` em `extraction-readiness.php`.
- **Rationale**: Cobre exatamente os fitness tests obrigatórios do enunciado, reusando a infra existente (que já previa `scheduling`).
- **Alternatives**: Criar suíte nova do zero — rejeitado; reusar o padrão consolidado.
