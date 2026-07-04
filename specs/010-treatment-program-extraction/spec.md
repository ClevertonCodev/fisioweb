# Feature Specification: Treatment Program Extraction

**Feature Branch**: `010-treatment-program-extraction`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Extrair a prescrição de exercícios do módulo Clinic para um novo módulo backend TreatmentProgram (Modular Monolith + Event-Driven), preservando as APIs REST existentes (paths, request shape, response shape). Backend é o único escopo; frontend não muda."

## Overview

A prescrição de exercícios (planos de tratamento, seus grupos e exercícios prescritos, rascunhos de montagem de programa, e a navegação no catálogo de programas do admin para importação) vive hoje dentro do módulo `Clinic`, junto de pacientes, agendamento, dashboard e demais capacidades. Isso concentra múltiplos bounded contexts em um único módulo, dificulta a evolução isolada da prescrição e cria acoplamento implícito — inclusive com `Admin` (catálogo de exercícios e programas), `Patient`, `Pdf` e `WhatsApp`.

Esta feature extrai a capacidade de prescrição de exercícios para um módulo backend dedicado `TreatmentProgram`, que passa a ser o **único dono** do código, rotas, migrations, factories, seeders, policies, eventos e testes da prescrição. A extração é puramente estrutural/arquitetural: **nenhum contrato HTTP muda** — os mesmos endpoints REST, os mesmos formatos de request e os mesmos formatos de response continuam funcionando, de modo que o frontend não precisa de nenhuma alteração.

O escopo inclui as entidades `TreatmentPlan`, `TreatmentPlanGroup`, `TreatmentPlanExercise` e `ClinicProgramDraft`, os fluxos de criação, atualização, ativação, conclusão/finalização, arquivamento e duplicação de plano, a conversão de plano em modelo (`to-model`), a montagem/rascunho de prescrição, a geração de PDF do plano e a navegação no catálogo de programas do admin para importação (endpoints `programs`), além de todos os controllers, form requests, services, repositories, contratos, policies, observer, rotas, factories, seeders e testes associados.

Como parte da extração, dois acoplamentos de regra de negócio existentes hoje no `Clinic` MUST ser corrigidos sem alterar comportamento observável:

1. O `TreatmentPlanService` importa hoje `Modules\Admin\Models\Exercise` diretamente para regra de negócio; após a extração, a validação/leitura de exercícios do catálogo MUST ocorrer por contrato público do `Admin` (ID + read model/DTO), não por Model privado.
2. O `SharedProgramController` (`clinic.programs.*`) lê hoje `Modules\Admin\Models\AdminProgram` diretamente; após a extração, a leitura do catálogo de programas MUST ocorrer por contrato público do `Admin`, preservando exatamente os mesmos paths e shapes de response.

Além disso, a notificação de ativação de plano (hoje disparada via `TreatmentPlanObserver` → `SendWhatsAppMessageJob`) e a contagem de programas ativos exibida no dashboard da clínica (hoje lida via `DashboardService`/repositório do `Clinic`) MUST continuar funcionando após a extração, agora respeitando a fronteira do novo módulo.

O sistema é local/dev (não está em produção), o que permite mover migrations e rodar `migrate:fresh --seed` sem estratégia de migração de dados em produção.

## Clarifications

### Session 2026-07-03

- Q: Os endpoints `clinic.programs.*` (SharedProgramController, catálogo de programas do Admin) vão para onde nesta extração? → A: Mover para `TreatmentProgram`, lendo o catálogo via contrato público do `Admin`.
- Q: Os endpoints `clinic.exercises.*` e `clinic.favorites` (ExerciseController, navegação/favoritos de exercícios) ficam onde? → A: Manter em `Clinic` nesta extração (reavaliar em extração futura).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Frontend continua funcionando sem mudanças (Priority: P1)

Um profissional ou administrador de clínica usa a prescrição de exercícios no SPA exatamente como antes: lista, cria, edita, duplica, ativa, conclui e arquiva planos de tratamento; salva e descarta o rascunho de montagem de programa; converte um plano em modelo; baixa o PDF do plano; e navega no catálogo de programas do admin para importar. Do ponto de vista do frontend e da API, nada mudou — inclusive o widget de "programas ativos" do dashboard continua exibindo o mesmo número.

**Why this priority**: É o critério de aceitação central da extração. Se qualquer endpoint, request ou response mudar, a feature falhou — o objetivo é refatorar a casa de máquinas sem mexer na fachada.

**Independent Test**: Executar a suíte existente de testes Feature e Unit de prescrição (planos, rascunhos, policies, observer) sem alterar asserções de HTTP/JSON e confirmar que todas passam após a extração; confirmar via `route:list --path=clinic` que os paths e nomes de rota de prescrição permanecem idênticos; confirmar que o endpoint de dashboard retorna o mesmo `active_programs`.

**Acceptance Scenarios**:

1. **Given** uma clínica com planos de tratamento, **When** o cliente chama `GET /api/clinic/treatment-plans` (com filtros `search`, `status`, `patient_id`, `physio_area_id`, `without_patient`), **Then** recebe a mesma estrutura de resposta (`{ "data": {...paginado} }`) com os mesmos campos de antes.
2. **Given** dados válidos de plano, **When** o cliente chama `POST /api/clinic/treatment-plans`, **Then** o plano é criado e a resposta tem o mesmo shape e status HTTP de antes.
3. **Given** um plano existente da própria clínica, **When** o cliente chama `GET /api/clinic/treatment-plans/{id}`, `PUT /api/clinic/treatment-plans/{id}` ou `DELETE /api/clinic/treatment-plans/{id}`, **Then** cada operação preserva request/response e regras atuais.
4. **Given** um plano existente, **When** o cliente chama `POST /api/clinic/treatment-plans/{id}/duplicate` ou `POST /api/clinic/treatment-plans/{id}/to-model`, **Then** a duplicação e a conversão em modelo funcionam com os mesmos shapes.
5. **Given** um plano existente, **When** o cliente chama `GET /api/clinic/treatment-plans/{id}/pdf`, **Then** o PDF é gerado e retornado com o mesmo arquivo/resposta HTTP de antes.
6. **Given** um usuário de clínica, **When** o cliente chama `GET`, `PUT` e `DELETE` em `/api/clinic/program-drafts`, **Then** leitura, upsert e descarte do rascunho funcionam com os mesmos shapes de request/response.
7. **Given** o catálogo de programas do admin, **When** o cliente chama `GET /api/clinic/programs` e `GET /api/clinic/programs/{id}`, **Then** listagem e detalhe retornam os mesmos shapes de response de antes.
8. **Given** um plano ou rascunho de outra clínica, **When** o cliente tenta acessá-lo, **Then** recebe `404` (isolamento multi-tenant preservado).
9. **Given** um usuário sem permissão para a ação, **When** tenta criar/editar/excluir, **Then** recebe `403`/`404` conforme policies atuais.
10. **Given** planos ativos na clínica, **When** o cliente chama `GET /api/clinic/dashboard`, **Then** o campo `active_programs` retorna o mesmo valor de antes.

---

### User Story 2 - Prescrição é um módulo com fronteira limpa (Priority: P1)

Um desenvolvedor que precisa evoluir a prescrição de exercícios encontra todo o código relacionado — controllers, services, repositories, contratos, requests, policies, models, migrations, factories, seeders, eventos e testes — dentro de `modules/TreatmentProgram`, e não espalhado em `Clinic`. O módulo `Clinic` não contém mais regra de negócio de prescrição.

**Why this priority**: É o valor estrutural da feature: ownership claro do bounded context, pré-requisito para evolução isolada e eventual extração como microserviço. É delicado porque encosta em catálogo do admin (exercícios e programas), paciente, PDF e WhatsApp.

**Independent Test**: Rodar os testes de arquitetura (fitness tests) que verificam ownership de namespaces, localização de migrations, ausência de rotas/regra de prescrição duplicadas em `Clinic`, e ausência de imports privados cross-module em código de produção; todos passam.

**Acceptance Scenarios**:

1. **Given** a base de código pós-extração, **When** se inspecionam os controllers das rotas de prescrição, **Then** todos pertencem ao namespace `Modules\TreatmentProgram\Http\Controllers`.
2. **Given** a base de código pós-extração, **When** se procuram migrations de prescrição (`clinic_treatment_plans`, `clinic_treatment_plan_groups`, `clinic_treatment_plan_exercises`, `clinic_program_drafts` e a migration de patient engagement do plano), **Then** todas estão em `modules/TreatmentProgram/database/migrations` e não existem mais em `modules/Clinic/database/migrations`.
3. **Given** a base de código pós-extração, **When** se inspecionam as rotas de `Clinic`, **Then** não há rotas de prescrição duplicadas nem definidas em `Clinic`.
4. **Given** o código de produção de `TreatmentProgram`, **When** se analisa seus imports, **Then** ele não importa Models ou Repositories privados de `Admin`, `Patient`, `Media`, `Pdf` ou `WhatsApp` para regra de negócio.
5. **Given** controllers e services de prescrição, **When** se inspecionam suas dependências, **Then** controllers dependem de `ServiceInterface` (não concreto) e services dependem de `RepositoryInterface` (não concreto).
6. **Given** o `SharedProgramController` e o `TreatmentPlanService` pós-extração, **When** se inspecionam seus imports, **Then** eles não importam `Modules\Admin\Models\Exercise` nem `Modules\Admin\Models\AdminProgram` para regra de negócio; consomem contrato público do `Admin`.

---

### User Story 3 - Integrações reagem a eventos de prescrição (Priority: P2)

Consumidores presentes ou futuros (WhatsApp de ativação, dashboard, activity log, auditoria, relatórios) reagem a mudanças na prescrição através de eventos de integração públicos, em vez de acessar diretamente Models internos de `TreatmentProgram`. Em particular, a notificação de ativação de plano por WhatsApp passa a reagir ao evento `TreatmentPlanActivated`.

**Why this priority**: Garante que a fronteira nova seja real e não apenas cosmética; habilita Event-Driven Architecture e prepara o módulo para extração futura. É P2 porque o comportamento observável via API (P1) já estaria correto; os eventos tornam o desacoplamento durável.

**Independent Test**: Disparar cada caso de uso (criar, ativar, concluir, arquivar plano; criar/atualizar/converter rascunho) e verificar via fake de eventos que o evento de integração correspondente é despachado após o commit, carregando IDs + snapshot mínimo (sem Model Eloquent); verificar que o listener de WhatsApp reage a `TreatmentPlanActivated` e enfileira a mesma mensagem que antes.

**Acceptance Scenarios**:

1. **Given** uma criação de plano bem-sucedida, **When** a transação confirma, **Then** um evento `TreatmentPlanCreated` é despachado contendo versão, IDs (plano, clínica, paciente, profissional, ator), status e timestamp de ocorrência.
2. **Given** uma ativação de plano bem-sucedida, **When** a transação confirma, **Then** um evento `TreatmentPlanActivated` é despachado com o payload especificado (versão, plano, clínica, paciente, profissional, ator, status, `startedAt`, `occurredAt`).
3. **Given** um evento `TreatmentPlanActivated` despachado, **When** o listener de notificação reage, **Then** a mesma mensagem de WhatsApp que antes era disparada pelo observer é enfileirada, sem `TreatmentProgram` importar internals de `WhatsApp` além do job/contrato público de dispatch.
4. **Given** uma conclusão/finalização de plano bem-sucedida, **When** a transação confirma, **Then** um evento `TreatmentPlanCompleted` é despachado com o payload especificado (versão, plano, clínica, paciente, profissional, ator, status, `completedAt`, `occurredAt`).
5. **Given** um arquivamento de plano bem-sucedido, **When** a transação confirma, **Then** um evento `TreatmentPlanArchived` é despachado.
6. **Given** um rascunho de programa criado, atualizado ou convertido em plano, **When** a transação confirma, **Then** os eventos `ProgramDraftCreated`, `ProgramDraftUpdated` ou `ProgramDraftConvertedToTreatmentPlan` são despachados conforme o caso.
7. **Given** qualquer evento de prescrição, **When** ele é inspecionado, **Then** não carrega nenhuma instância de Model Eloquent, apenas dados primitivos/imutáveis.

---

### Edge Cases

- **Catálogo de exercícios (`Admin`)**: `TreatmentPlanExercise` referencia um exercício do catálogo admin. Validação/leitura de exercício em regra de negócio MUST usar `exercise_id` + contrato público `Admin` (read model/DTO), sem importar `Modules\Admin\Models\Exercise` em Service; Models de `TreatmentProgram` MAY declarar `belongsTo` cross-module com FQN inline (ADR-008) somente para eager load e serialização JSON.
- **Catálogo de programas (`Admin`)**: os endpoints `clinic.programs.*` leem `AdminProgram`. Após a extração MUST consumir contrato público de leitura do `Admin`, preservando exatamente paths, filtros (`search`, `physio_area_id`, `per_page`) e o shape de response (incluindo o paginador direto no `index` e o envelope `data` no `show`).
- **Paciente (`Patient`)** permanece em outro módulo. Validação de existência/pertencimento à clínica MUST usar `patient_id` + contrato público (`PatientServiceInterface`) no Service; Models MAY declarar `belongsTo` cross-module com FQN inline (ADR-008) para eager load e serialização.
- **Profissional (`ClinicUser`) e catálogo de áreas (`PhysioArea`/`PhysioSubarea` do Admin)**: respostas que hoje incluem `clinicUser`, `physioArea`, `physioSubarea` MUST continuar retornando os mesmos campos; relações `belongsTo` cross-module com FQN inline (ADR-008) são permitidas somente no Model, não em regra de negócio.
- **Notificação de ativação (WhatsApp)**: hoje o `TreatmentPlanObserver` dispara `SendWhatsAppMessageJob` ao ativar um plano. Após a extração, essa notificação MUST reagir ao evento `TreatmentPlanActivated` (listener), preservando exatamente a condição e o conteúdo da mensagem atuais, sem acoplar regra de negócio a internals privados de `WhatsApp`.
- **Contagem de programas ativos no dashboard (`Clinic`)**: o dashboard permanece em `Clinic` e exibe `active_programs`. Após a extração, `Clinic` MUST obter essa contagem por contrato público/read model de `TreatmentProgram`, sem consultar diretamente a tabela `clinic_treatment_plans` a partir de código do `Clinic`.
- **PDF do plano**: geração/download de PDF do plano depende da capacidade de PDF. Deve consumir contrato público do módulo `Pdf`, preservando o mesmo arquivo/resposta HTTP.
- **Rascunho por usuário**: o rascunho é escopado por `clinic_user_id`; leitura/upsert/descarte MUST continuar restritos ao próprio usuário e à sua clínica.
- **Conversão de rascunho em plano**: quando o rascunho é materializado em um `TreatmentPlan`, o evento `ProgramDraftConvertedToTreatmentPlan` MUST ser emitido; se o fluxo atual não persiste essa conversão explicitamente, o evento é emitido no ponto onde o plano é criado a partir do rascunho.
- **Plano de outra clínica**: tentativa de acessar/editar/excluir deve retornar `404`.
- **Seeders e factories**: dados demo de prescrição devem continuar disponíveis após `migrate:fresh --seed`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST expor todos os endpoints REST de prescrição nos mesmos paths, métodos HTTP e nomes de rota atuais, incluindo: `clinic.treatment-plans.*` (index, show, store, update, destroy, duplicate, to-model, pdf), `clinic.program-drafts.*` (show, upsert, destroy) e `clinic.programs.*` (index, show).
- **FR-002**: O sistema MUST preservar exatamente o shape de cada request de prescrição (mesmos campos, validações e regras de obrigatoriedade), incluindo os filtros de listagem e o payload de rascunho (`step`, `selectedIds`, `groups`, `savedAt`).
- **FR-003**: O sistema MUST preservar exatamente o shape de cada response de prescrição (mesmo envelope, mesmos campos, mesmos status HTTP), incluindo o paginador retornado por `clinic.programs.index`.
- **FR-004**: O sistema MUST preservar todas as regras de negócio atuais de prescrição: status do plano (draft/ativo/concluído/arquivado conforme valores atuais), transições de ativação/conclusão/arquivamento, duplicação, conversão em modelo (`to-model`), montagem de grupos/exercícios, geração de PDF, rascunho por usuário, e isolamento multi-tenant por clínica (404 para outra clínica).
- **FR-005**: Todo o código de prescrição MUST residir no módulo `TreatmentProgram` (Models, Controllers, FormRequests, Services, ServiceInterfaces, Repositories, RepositoryInterfaces, Policies, Observer, Events, Listeners, Routes, Factories, Seeders, Tests).
- **FR-006**: As migrations de prescrição MUST residir em `modules/TreatmentProgram/database/migrations` e NÃO MUST existir em `modules/Clinic/database/migrations`.
- **FR-007**: Os nomes de tabela de prescrição MUST permanecer inalterados (`clinic_treatment_plans`, `clinic_treatment_plan_groups`, `clinic_treatment_plan_exercises`, `clinic_program_drafts`).
- **FR-008**: O módulo `Clinic` MUST NOT conter mais rotas de prescrição nem regra de negócio de prescrição após a extração; não MUST haver rotas de prescrição duplicadas.
- **FR-009**: Os controllers das rotas de prescrição MUST pertencer ao namespace `Modules\TreatmentProgram\Http\Controllers`.
- **FR-010**: Controllers de prescrição MUST NOT conter regra de negócio nem queries; MUST depender de uma `ServiceInterface` (não de service concreto). Isso inclui refatorar o atual `ProgramDraftController`, que hoje faz query direta no controller, para o padrão Service+Repository.
- **FR-011**: O Service de prescrição MUST implementar sua `ServiceInterface`, orquestrar o caso de uso, delegar persistência/queries ao `RepositoryInterface` e disparar eventos.
- **FR-012**: O Repository de prescrição MUST encapsular todo o acesso a persistência; queries complexas MUST residir no Repository, não no Service.
- **FR-013**: O código de produção de `TreatmentProgram` MUST NOT importar Models ou Repositories privados de outros módulos para regra de negócio; comunicação cross-module MUST ocorrer apenas via ServiceInterface pública, DTO público, Integration Event ou read model. Exceção documentada (ADR-008/010): Models de `TreatmentProgram` MAY declarar `belongsTo`/`HasMany` cross-module com FQN inline exclusivamente para eager load e serialização JSON de responses — proibido em Services para decisões de negócio.
- **FR-014**: O `TreatmentPlanService` MUST NOT importar `Modules\Admin\Models\Exercise` para regra de negócio; a validação/leitura de exercícios do catálogo MUST usar `exercise_id` + contrato público de leitura do `Admin` (read model/DTO), preservando o comportamento atual.
- **FR-015**: Os endpoints `clinic.programs.*` MUST NOT ler `Modules\Admin\Models\AdminProgram` diretamente; MUST consumir contrato público de leitura do catálogo de programas do `Admin`, preservando paths, filtros e shapes de response atuais. A implementação desse(s) contrato(s) público(s) no módulo `Admin` faz parte do escopo desta extração.
- **FR-016**: O sistema MUST emitir eventos de integração para os casos de uso de prescrição: `TreatmentPlanCreated`, `TreatmentPlanActivated`, `TreatmentPlanCompleted`, `TreatmentPlanArchived`, `ProgramDraftCreated`, `ProgramDraftUpdated`, `ProgramDraftConvertedToTreatmentPlan`.
- **FR-017**: Cada evento de prescrição MUST carregar apenas IDs + snapshot mínimo (versão, identificadores de plano/rascunho, clínica, paciente, profissional, ator, status e timestamps relevantes como `startedAt`/`completedAt`, timestamp de ocorrência) e MUST NOT carregar instâncias de Model Eloquent. `TreatmentPlanActivated` e `TreatmentPlanCompleted` MUST seguir os payloads especificados na descrição da feature.
- **FR-018**: Os eventos MUST ser despachados apenas após o commit da transação (`DB::afterCommit`), nunca no Controller.
- **FR-019**: A notificação de ativação de plano por WhatsApp MUST ser preservada, reagindo ao evento `TreatmentPlanActivated` via listener, com a mesma condição e conteúdo atuais, sem acoplar regra de negócio a internals privados de `WhatsApp` (dispatch de job/contrato público é permitido).
- **FR-020**: O dashboard da clínica MUST continuar exibindo a contagem de programas ativos (`active_programs`) com o mesmo valor, obtendo-a por contrato público/read model de `TreatmentProgram`, sem que código do `Clinic` consulte diretamente as tabelas de prescrição.
- **FR-021**: A geração/download de PDF do plano MUST continuar funcionando via contrato público de PDF, preservando a resposta HTTP atual.
- **FR-022**: O registro do novo módulo MUST seguir o padrão real do projeto (`modules_statuses`), e o provider NÃO MUST ser registrado em `bootstrap/providers.php`.
- **FR-023**: Policies MUST continuar garantindo ownership por `clinic_id` e permissões por papel conforme comportamento atual; o rascunho MUST permanecer escopado por `clinic_user_id`.
- **FR-024**: Factories e seeders de prescrição MUST residir em `TreatmentProgram` e permitir popular dados via `migrate:fresh --seed`.
- **FR-025**: A suíte de testes de prescrição (Unit + Feature + Policies + Observer/Listener) MUST residir em `TreatmentProgram` e passar, validando comportamento preservado.
- **FR-026**: O código MUST seguir as convenções do projeto: `is_null()` / `! is_null()` em vez de `=== null` / `!== null`, e `empty()` / `! empty()` em vez de comparação com string vazia.
- **FR-027**: Testes de arquitetura (fitness tests) MUST ser criados/atualizados para garantir: ownership de namespace dos controllers; localização das migrations; ausência de rotas de prescrição em `Clinic`; ausência de imports privados cross-module (`Admin\Models\Exercise`, `Admin\Models\AdminProgram`, `Patient\Models\Patient`, `Media\Models\*`) em produção salvo exceção documentada em ADR; eventos sem Models Eloquent; inversão de dependência (Controller→ServiceInterface, Service→RepositoryInterface).

### Key Entities *(include if feature involves data)*

- **TreatmentPlan (Plano de tratamento/prescrição)**: prescrição de exercícios de um paciente por uma clínica. Atributos-chave: clínica, paciente (opcional — pode ser modelo sem paciente), profissional responsável, área/subárea de fisioterapia (catálogo admin), status (draft/ativo/concluído/arquivado), engajamento do paciente (ex.: `patient_viewed_at`), datas de início/conclusão. Relaciona-se com grupos e exercícios prescritos.
- **TreatmentPlanGroup (Grupo do plano)**: agrupamento ordenado de exercícios dentro de um plano.
- **TreatmentPlanExercise (Exercício prescrito)**: exercício do catálogo admin prescrito no plano, com parâmetros de prescrição (séries, repetições, etc.) e ordenação, opcionalmente vinculado a um grupo.
- **ClinicProgramDraft (Rascunho de programa)**: rascunho de montagem de prescrição por usuário de clínica (`draft_data` com passo, ids selecionados, grupos e timestamp), usado para autosave do assistente de criação.
- **Integration Events de Prescrição**: representações imutáveis e serializáveis (IDs + snapshot mínimo) dos fatos criar/ativar/concluir/arquivar plano e criar/atualizar/converter rascunho.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos endpoints REST de prescrição existentes continuam respondendo nos mesmos paths/métodos com os mesmos shapes de request e response (zero mudança de contrato observável pelo frontend), incluindo `treatment-plans`, `program-drafts` e `programs`.
- **SC-002**: O frontend exige **zero** alterações para continuar operando a prescrição de exercícios e o widget de programas ativos do dashboard após a extração.
- **SC-003**: 100% dos testes de prescrição (Unit + Feature + Policies + Observer/Listener) passam após a extração; nenhuma asserção de HTTP/JSON precisou ser relaxada para acomodar mudança de contrato.
- **SC-004**: Os testes de arquitetura (fitness tests) passam, confirmando: ownership de namespace, localização das migrations, ausência de rotas de prescrição em `Clinic`, ausência de imports privados cross-module (incluindo `Admin\Models\Exercise` e `Admin\Models\AdminProgram` em produção), eventos sem Models Eloquent, e inversão de dependência correta.
- **SC-005**: `migrate:fresh --seed` executa com sucesso e popula dados de prescrição a partir de `TreatmentProgram`.
- **SC-006**: 0 (zero) ocorrências de código de regra de negócio de prescrição remanescentes no módulo `Clinic`.
- **SC-007**: Cada um dos 7 casos de uso de prescrição com evento despacha seu evento de integração correspondente, após o commit, carregando apenas IDs + snapshot mínimo.
- **SC-008**: A notificação de ativação por WhatsApp continua sendo enfileirada exatamente nas mesmas condições de antes, agora via listener de `TreatmentPlanActivated`.
- **SC-009**: O endpoint de dashboard retorna o mesmo valor de `active_programs` de antes da extração, obtido por contrato público de `TreatmentProgram`.
- **SC-010**: Profissionais conseguem completar o fluxo principal de prescrição (montar rascunho → criar plano → ativar → gerar PDF) sem erro adicional ou passo extra em comparação com o comportamento anterior.

## Assumptions

- O nome do módulo é `TreatmentProgram` (decisão fechada).
- Rotas públicas, shapes de request/response e nomes de tabela permanecem inalterados (decisões fechadas).
- Migrations de prescrição são movidas para o módulo dono `TreatmentProgram` (decisão fechada).
- O sistema é local/dev; `migrate:fresh --seed` é permitido e não há necessidade de plano de migração de dados em produção (decisão fechada).
- O frontend está fora de escopo e não será alterado (decisão fechada).
- "Prescrição de exercícios" inclui `TreatmentPlan` (com grupos e exercícios) e `ClinicProgramDraft` (decisão fechada).
- Os eventos principais são `TreatmentPlanActivated` e `TreatmentPlanCompleted`, com os payloads especificados; os demais eventos (`Created`, `Archived`, `ProgramDraft*`) seguem o mesmo padrão de IDs + snapshot mínimo (decisão fechada).
- Os endpoints `clinic.programs.*` (`SharedProgramController`, navegação/importação do catálogo de programas do admin) fazem parte do fluxo de prescrição e MOVEM para `TreatmentProgram`, passando a ler o catálogo via contrato público do `Admin` (decisão fechada — Clarify 2026-07-03).
- Os endpoints `clinic.exercises.*` e `clinic.favorites` (`ExerciseController`) são navegação/favoritos do catálogo de exercícios e **permanecem em `Clinic`** nesta extração, por não fazerem parte do ciclo de vida de plano/rascunho; podem ser reavaliados numa extração futura (decisão fechada — Clarify 2026-07-03).
- `Patient` permanece em módulo separado; Services de `TreatmentProgram` usam `patient_id` + `PatientServiceInterface`, não Model privado, para regra de negócio. Models MAY usar `belongsTo` cross-module com FQN inline (ADR-008).
- Catálogo de exercícios e de programas permanece no módulo `Admin`; `TreatmentProgram` consome via contrato(s) público(s) de leitura para validação e para os endpoints `programs`. A implementação desses contratos no `Admin` faz parte do escopo desta extração.
- `ClinicUser`, identidade da clínica, dashboard e configurações gerais permanecem em `Clinic`; a contagem de programas ativos do dashboard passa a ser obtida por contrato público de `TreatmentProgram`.
- A notificação de ativação por WhatsApp (hoje no `TreatmentPlanObserver`) passa a ser um listener de `TreatmentPlanActivated`; o dispatch do job de WhatsApp por contrato/job público é aceito.
- PDF do plano usa contrato público do módulo `Pdf`.
- O provider do módulo é registrado pelo mecanismo `modules_statuses` do projeto, e não em `bootstrap/providers.php`.
- Documentação de arquitetura (ADR 010, capability map, checklist de readiness) será criada/atualizada nas fases de plano e implementação.
