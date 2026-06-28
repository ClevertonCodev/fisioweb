# Feature Specification: Clinic Scheduling Extraction

**Feature Branch**: `007-clinic-scheduling-extraction`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Extrair todo o agendamento do módulo Clinic para um novo módulo backend ClinicScheduling, mantendo Modular Monolith + Event-Driven Architecture e preservando as APIs REST existentes (paths, request shape, response shape). Backend é o único escopo; frontend não muda."

## Overview

O agendamento de consultas (appointments) vive hoje misturado dentro do módulo `Clinic`, junto com pacientes, planos de tratamento, avaliações, evoluções e dashboard. Isso torna o bounded context de agendamento difícil de evoluir isoladamente e cria acoplamento implícito (Dashboard e GoogleCalendar acessam diretamente o Model `Appointment` interno de `Clinic`).

Esta feature extrai a capacidade de agendamento para um módulo backend dedicado `ClinicScheduling`, que passa a ser o **único dono** do código, rotas, migrations, factories, seeders e eventos de agendamento. A extração é puramente estrutural/arquitetural: **nenhum contrato HTTP muda** — os mesmos endpoints REST, os mesmos formatos de request e os mesmos formatos de response continuam funcionando, de modo que o frontend não precisa de nenhuma alteração.

O sistema é local/dev (não está em produção), o que permite mover migrations e rodar `migrate:fresh --seed` sem estratégia de migração de dados em produção.

## Clarifications

### Session 2026-06-27

- Q: Quando o evento `AppointmentRescheduled` deve ser disparado no caso de uso `update`? → A: Em qualquer update bem-sucedido (PUT /appointments/{id}), independentemente de qual campo mudou.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Frontend continua funcionando sem mudanças (Priority: P1)

Um usuário de clínica (recepcionista, fisioterapeuta ou admin de clínica) usa a agenda no SPA exatamente como antes: lista consultas por período, cria, visualiza, edita, muda status e cancela consultas. Do ponto de vista do frontend e da API, nada mudou.

**Why this priority**: É o critério de aceitação central da extração. Se qualquer endpoint, request ou response mudar, a feature falhou — o objetivo é refatorar a casa de máquinas sem mexer na fachada.

**Independent Test**: Executar a suíte existente de testes Feature de agendamento (índice, store, update status, autorização, visibilidade) sem alterar as asserções de HTTP/JSON e confirmar que todas passam após a extração; confirmar via `route:list --path=clinic` que os paths e nomes de rota de agendamento permanecem idênticos.

**Acceptance Scenarios**:

1. **Given** uma clínica com consultas cadastradas, **When** o cliente chama `GET /api/clinic/appointments?from=...&to=...`, **Then** recebe a mesma estrutura de resposta (`{ "data": [...] }`) com os mesmos campos de antes.
2. **Given** dados válidos de consulta, **When** o cliente chama `POST /api/clinic/appointments`, **Then** a consulta é criada com status inicial agendado e a resposta tem o mesmo shape e status HTTP `201` de antes.
3. **Given** uma consulta existente, **When** o cliente chama `PATCH /api/clinic/appointments/{id}/status` com uma transição válida, **Then** o status é atualizado e a resposta tem o mesmo shape de antes.
4. **Given** uma consulta de outra clínica, **When** o cliente tenta acessá-la, **Then** recebe `404` (isolamento multi-tenant preservado).
5. **Given** um fisioterapeuta, **When** ele lista consultas, **Then** vê apenas a própria agenda (regra de visibilidade preservada).

---

### User Story 2 - Agendamento é um módulo com fronteira limpa (Priority: P1)

Um desenvolvedor que precisa evoluir o agendamento encontra todo o código de agendamento — controllers, services, repositories, contratos, requests, policies, model, enum, migrations, factories, seeders, eventos e testes — dentro de `modules/ClinicScheduling`, e não espalhado em `Clinic`. O módulo `Clinic` não contém mais regra de agendamento.

**Why this priority**: É o valor estrutural da feature: ownership claro do bounded context, pré-requisito para evolução isolada e eventual extração como microserviço.

**Independent Test**: Rodar os testes de arquitetura (fitness tests) que verificam ownership de namespaces, localização de migrations e ausência de rotas/regra de agendamento duplicadas em `Clinic`; todos passam.

**Acceptance Scenarios**:

1. **Given** a base de código pós-extração, **When** se inspeciona os controllers das rotas de agendamento, **Then** todos pertencem ao namespace `Modules\ClinicScheduling\Http\Controllers`.
2. **Given** a base de código pós-extração, **When** se procura a migration de `clinic_appointments`, **Then** ela está em `modules/ClinicScheduling/database/migrations` e não existe mais em `modules/Clinic/database/migrations`.
3. **Given** a base de código pós-extração, **When** se inspeciona as rotas de `Clinic`, **Then** não há rotas de agendamento duplicadas nem definidas em `Clinic`.
4. **Given** o código de produção de `ClinicScheduling`, **When** se analisa seus imports, **Then** ele não importa Models/Repositories privados de outros módulos para regra de negócio.

---

### User Story 3 - Integrações reagem a eventos de agendamento (Priority: P2)

Consumidores de agendamento (Dashboard, ActivityLog, GoogleCalendar e futuros consumidores) reagem a mudanças de agendamento através de eventos de integração públicos e/ou contratos públicos, em vez de acessar diretamente o Model interno de agendamento.

**Why this priority**: Garante que a fronteira nova seja real e não apenas cosmética; habilita Event-Driven Architecture e prepara o módulo para extração futura. É P2 porque o comportamento observável (P1) já estaria correto mesmo com integração via contrato; os eventos tornam o desacoplamento durável.

**Independent Test**: Disparar cada caso de uso (agendar, reagendar/atualizar, cancelar, concluir) e verificar via fake de eventos que o evento de integração correspondente é despachado após o commit, carregando IDs + snapshot mínimo (sem Model Eloquent).

**Acceptance Scenarios**:

1. **Given** uma criação de consulta bem-sucedida, **When** a transação confirma, **Then** um evento `AppointmentScheduled` é despachado contendo IDs e snapshot mínimo (clínica, paciente, profissional, início, fim, status, ator, timestamp).
2. **Given** uma atualização de consulta via `PUT` bem-sucedida (qualquer campo), **When** a transação confirma, **Then** um evento `AppointmentRescheduled` é despachado.
3. **Given** um cancelamento de consulta, **When** a transação confirma, **Then** um evento `AppointmentCancelled` é despachado.
4. **Given** uma consulta marcada como concluída, **When** a transação confirma, **Then** um evento `AppointmentCompleted` é despachado.
5. **Given** qualquer evento de agendamento, **When** ele é inspecionado, **Then** não carrega nenhuma instância de Model Eloquent, apenas dados primitivos/imutáveis.

---

### Edge Cases

- **Dashboard e relatório de ocupação** (permanecem em `Clinic`) hoje consultam o Model `Appointment` diretamente. Após a extração, precisam ler dados de agendamento sem importar o Model privado de `ClinicScheduling` — via contrato público/read model exposto por `ClinicScheduling`, preservando os números atuais do dashboard.
- **GoogleCalendar** hoje importa internals de `Clinic` (`Appointment`, `AppointmentStatus`, `AppointmentService`). Após a extração, esses tipos passam a pertencer a `ClinicScheduling`; a integração precisa continuar funcionando (push/pull de eventos do Google e cancelamento) consumindo o módulo dono via contrato público, sem quebrar.
- **ActivityLog**: o agendamento registra atividades (agendada, concluída, cancelada). Após a extração, esse registro deve continuar acontecendo a partir do módulo dono do agendamento, sem que `ClinicScheduling` dependa de internals privados de `Clinic`.
- **Relações com Patient e ClinicUser**: uma consulta referencia paciente e profissional, que permanecem em `Clinic`. As respostas que hoje incluem dados de paciente/profissional (`load(['patient','clinicUser'])`) devem continuar retornando os mesmos campos.
- **Transição de status inválida** deve continuar retornando erro de validação com a mesma semântica.
- **Notificação de consulta agendada** (job assíncrono) deve continuar sendo disparada após o commit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST expor todos os endpoints REST de agendamento nos mesmos paths, métodos HTTP e nomes de rota atuais (`clinic.appointments.*`: index, store, show, update, status, cancel).
- **FR-002**: O sistema MUST preservar exatamente o shape de cada request de agendamento (mesmos campos, validações e regras de obrigatoriedade).
- **FR-003**: O sistema MUST preservar exatamente o shape de cada response de agendamento (mesmo envelope `data`, mesmos campos, mesmos status HTTP).
- **FR-004**: O sistema MUST preservar todas as regras de negócio de agendamento atuais: status inicial ao agendar, transições de status válidas/inválidas, cancelamento, visibilidade por papel (fisioterapeuta vê só a própria agenda) e isolamento multi-tenant por clínica (404 para outra clínica).
- **FR-005**: Todo o código de agendamento MUST residir no módulo `ClinicScheduling` (Models, Controllers, FormRequests, Services, ServiceInterfaces, Repositories, RepositoryInterfaces, Policies, Events, Routes, Factories, Seeders, Tests).
- **FR-006**: A migration que cria a tabela de agendamento MUST residir em `modules/ClinicScheduling/database/migrations` e NÃO MUST existir em `modules/Clinic/database/migrations`.
- **FR-007**: Os nomes de tabela de agendamento MUST permanecer inalterados (ex.: `clinic_appointments`).
- **FR-008**: O módulo `Clinic` MUST NOT conter mais rotas de agendamento nem regra de negócio de agendamento após a extração; não MUST haver rotas de agendamento duplicadas.
- **FR-009**: Os controllers das rotas de agendamento MUST pertencer ao namespace `Modules\ClinicScheduling\Http\Controllers`.
- **FR-010**: Controllers de agendamento MUST NOT conter regra de negócio nem queries; MUST depender de uma `ServiceInterface` (não de service concreto).
- **FR-011**: O Service de agendamento MUST implementar sua `ServiceInterface`, orquestrar o caso de uso, delegar persistência/queries ao `RepositoryInterface` e disparar eventos.
- **FR-012**: O Repository de agendamento MUST encapsular todo o acesso a Eloquent/SQL; queries complexas MUST residir no Repository, não no Service.
- **FR-013**: O código de produção de `ClinicScheduling` MUST NOT importar Models ou Repositories privados de outros módulos para regra de negócio; comunicação cross-module MUST ocorrer apenas via ServiceInterface pública, DTO público, Integration Event ou read model.
- **FR-014**: O sistema MUST emitir eventos de integração para os casos de uso de agendamento: `AppointmentScheduled` (ao criar), `AppointmentRescheduled` (em qualquer `update`/PUT bem-sucedido, independentemente de qual campo mudou), `AppointmentCancelled` (ao cancelar), `AppointmentCompleted` (ao concluir).
- **FR-015**: Cada evento de agendamento MUST carregar apenas IDs + snapshot mínimo (versão, id da consulta, clínica, paciente, profissional, ator, início, fim, status, timestamp de ocorrência) e MUST NOT carregar instâncias de Model Eloquent.
- **FR-016**: Os eventos MUST ser despachados apenas após o commit da transação (`DB::afterCommit`).
- **FR-017**: O registro do novo módulo MUST seguir o padrão real do projeto (`modules_statuses`), e o provider NÃO MUST ser registrado em `bootstrap/providers.php`.
- **FR-018**: Consumidores que permanecem em `Clinic` (Dashboard, relatório de ocupação) MUST obter dados de agendamento via contrato público/read model de `ClinicScheduling`, preservando os valores exibidos atualmente, sem importar o Model privado.
- **FR-019**: A integração com GoogleCalendar MUST continuar funcionando após a extração (sincronização e cancelamento de eventos), consumindo `ClinicScheduling` via contrato público em vez de internals de `Clinic`.
- **FR-020**: O registro de atividade (ActivityLog) relacionado a agendamento (agendada, concluída, cancelada) MUST continuar ocorrendo após a extração, sem que `ClinicScheduling` dependa de internals privados de `Clinic`.
- **FR-021**: A notificação assíncrona de consulta agendada MUST continuar sendo disparada após o commit, como hoje.
- **FR-022**: Factories e seeders de agendamento MUST residir em `ClinicScheduling` e permitir popular dados de agendamento via `migrate:fresh --seed`.
- **FR-023**: A suíte de testes de agendamento (Unit + Feature) MUST residir em `ClinicScheduling` e passar, validando comportamento preservado.
- **FR-024**: O código MUST seguir as convenções do projeto: `is_null()` / `! is_null()` em vez de `=== null` / `!== null`, e `empty()` / `! empty()` em vez de comparação com string vazia.

### Key Entities *(include if feature involves data)*

- **Appointment (Consulta/Agendamento)**: representa uma consulta agendada de uma clínica. Atributos-chave (conceituais): clínica dona, paciente, profissional responsável, janela de horário (início/fim), status (agendada, concluída, cancelada e demais estados atuais), origem (sistema/externa) e referência opcional ao evento externo de calendário. Pertence a uma clínica; referencia um paciente e um profissional, ambos do módulo `Clinic`.
- **AppointmentStatus (Status de Consulta)**: conjunto fechado de estados e as transições válidas entre eles (incluindo regras dependentes de horário), governando o ciclo de vida do agendamento.
- **Integration Events de Agendamento**: representações imutáveis e serializáveis (IDs + snapshot mínimo) dos fatos de negócio agendar/reagendar/cancelar/concluir, consumidas por outros módulos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos endpoints REST de agendamento existentes continuam respondendo nos mesmos paths/métodos com os mesmos shapes de request e response (zero mudança de contrato observável pelo frontend).
- **SC-002**: O frontend exige **zero** alterações para continuar operando a agenda após a extração.
- **SC-003**: 100% dos testes de agendamento (Unit + Feature) passam após a extração; nenhuma asserção de HTTP/JSON precisou ser relaxada para acomodar mudança de contrato.
- **SC-004**: Os testes de arquitetura (fitness tests) passam, confirmando: ownership de namespace, localização das migrations, ausência de rotas de agendamento em `Clinic` e ausência de imports privados cross-module no código de produção de `ClinicScheduling`.
- **SC-005**: `php artisan migrate:fresh --seed` executa com sucesso e popula dados de agendamento a partir de `ClinicScheduling`.
- **SC-006**: 0 (zero) ocorrências de código de regra de negócio de agendamento remanescentes no módulo `Clinic`.
- **SC-007**: Cada um dos 4 casos de uso de agendamento despacha seu evento de integração correspondente, após o commit, carregando apenas IDs + snapshot mínimo.

## Assumptions

- O nome do módulo é `ClinicScheduling` (decisão fechada).
- Rotas públicas, shapes de request/response e nomes de tabela permanecem inalterados (decisões fechadas).
- Migrations de agendamento são movidas para o módulo dono `ClinicScheduling` (decisão fechada).
- O sistema é local/dev; `migrate:fresh --seed` é permitido e não há necessidade de plano de migração de dados em produção (decisão fechada).
- O frontend está fora de escopo e não será alterado (decisão fechada).
- `Patient` e `ClinicUser` permanecem no módulo `Clinic`; a relação consulta→paciente/profissional cruza fronteira de módulo e será resolvida por leitura via contrato público/read model ou por carga das relações preservando os campos atuais de response.
- Os consumidores existentes (Dashboard, OccupancyRate, GoogleCalendar, ActivityLog) serão adaptados para consumir `ClinicScheduling` por contrato público/read model/eventos — esta adaptação faz parte do escopo backend desta extração, pois é necessária para não importar Models privados cross-module.
- O provider do módulo é registrado pelo mecanismo `modules_statuses` do projeto, e não em `bootstrap/providers.php`.
- A documentação de arquitetura (ADR de extração, capability map, checklist de readiness) será criada/atualizada como parte da entrega.
