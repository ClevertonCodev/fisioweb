# Feature Specification: Clinical Record Extraction

**Feature Branch**: `008-clinical-record-extraction`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Extrair o prontuário digital do módulo Clinic para um novo módulo backend ClinicalRecord, mantendo Modular Monolith + Event-Driven Architecture e preservando as APIs REST existentes (paths, request shape, response shape). Backend é o único escopo; frontend não muda."

## Overview

O prontuário digital (avaliações clínicas, evoluções, arquivos do paciente e templates de evolução) vive hoje dentro do módulo `Clinic`, junto com pacientes, agendamento, planos de tratamento, dashboard e demais capacidades. Isso concentra múltiplos bounded contexts em um único módulo, dificulta evolução isolada do prontuário e cria acoplamento implícito — inclusive com `Patient`, armazenamento de arquivos e geração de PDF.

Esta feature extrai a capacidade de prontuário digital para um módulo backend dedicado `ClinicalRecord`, que passa a ser o **único dono** do código, rotas, migrations, factories, seeders, policies, eventos e testes do prontuário. A extração é puramente estrutural/arquitetural: **nenhum contrato HTTP muda** — os mesmos endpoints REST, os mesmos formatos de request e os mesmos formatos de response continuam funcionando, de modo que o frontend não precisa de nenhuma alteração.

O escopo inclui: `Assessment`, `AssessmentAnswer`, `AssessmentAnswerOption`, `PatientEvolution`, `PatientEvolutionCheckedItem`, `PatientFile`, `EvolutionTemplate`, `EvolutionTemplateSection` e `EvolutionTemplateItem`, além de todos os controllers, form requests, services, repositories, policies, rotas, factories, seeders e testes associados. Endpoints de leitura do catálogo de templates de avaliação do admin (`assessment-templates`) permanecem nos mesmos paths, pois fazem parte do fluxo de criação de avaliações, mas os dados de catálogo continuam pertencendo ao módulo `Admin`.

O sistema é local/dev (não está em produção), o que permite mover migrations e rodar `migrate:fresh --seed` sem estratégia de migração de dados em produção.

## Clarifications

### Session 2026-06-27

- Q: Quando `EvolutionRecorded` deve ser disparado além de create e update? → A: Também em `POST /evolutions/{id}/sign` (assinatura), além de create e PUT.
- Q: Como `ClinicalRecord` deve consumir o catálogo Admin na criação/validação de avaliações? → A: Criar contrato público Admin (ex.: `AssessmentTemplateReadServiceInterface`) consumido por `ClinicalRecord` para validação e endpoints `assessment-templates`.
- Q: Relações Eloquent cross-module nos Models de `ClinicalRecord` — o que é permitido? → A: Seguir ADR-008: `belongsTo` cross-module com FQN inline permitido somente em Models (eager load/serialização JSON); Services/Repositories de regra de negócio usam IDs + contratos públicos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Frontend continua funcionando sem mudanças (Priority: P1)

Um profissional ou administrador de clínica usa o prontuário digital no SPA exatamente como antes: lista e cria avaliações por paciente, edita rascunhos, assina avaliações, registra evoluções clínicas (incluindo geração de texto e download de PDF), gerencia templates de evolução, anexa e remove arquivos do paciente, e consulta o catálogo de templates de avaliação. Do ponto de vista do frontend e da API, nada mudou.

**Why this priority**: É o critério de aceitação central da extração. Se qualquer endpoint, request ou response mudar, a feature falhou — o objetivo é refatorar a casa de máquinas sem mexer na fachada.

**Independent Test**: Executar a suíte existente de testes Feature e Unit de prontuário (avaliações, evoluções, arquivos, templates, policies) sem alterar asserções de HTTP/JSON e confirmar que todas passam após a extração; confirmar via listagem de rotas que os paths e nomes de rota de prontuário permanecem idênticos.

**Acceptance Scenarios**:

1. **Given** um paciente com avaliações, **When** o cliente chama `GET /api/clinic/patients/{patient}/assessments`, **Then** recebe a mesma estrutura de resposta (`{ "data": [...] }`) com os mesmos campos de antes.
2. **Given** dados válidos de avaliação, **When** o cliente chama `POST /api/clinic/patients/{patient}/assessments`, **Then** a avaliação é criada em rascunho e a resposta tem o mesmo shape e status HTTP `201` de antes.
3. **Given** uma avaliação em rascunho, **When** o cliente chama `PUT /api/clinic/assessments/{id}` ou `POST /api/clinic/assessments/{id}/sign`, **Then** a avaliação é atualizada ou assinada conforme regras atuais, com o mesmo shape de resposta.
4. **Given** um paciente com evoluções, **When** o cliente chama `GET /api/clinic/patients/{patient}/evolutions` e `POST /api/clinic/patients/{patient}/evolutions`, **Then** listagem e criação funcionam com os mesmos shapes de request/response.
5. **Given** uma evolução existente, **When** o cliente chama `POST /api/clinic/evolutions/{id}/generate-text`, `POST /api/clinic/evolutions/{id}/sign` ou `GET /api/clinic/evolutions/{id}/pdf`, **Then** cada ação retorna o mesmo resultado e status HTTP de antes.
6. **Given** um paciente com arquivos, **When** o cliente chama `GET/POST/DELETE` nos endpoints de `patients/{patient}/files`, **Then** listagem, upload e remoção funcionam com os mesmos shapes.
7. **Given** templates de evolução da clínica, **When** o cliente usa CRUD em `/api/clinic/evolution-templates`, **Then** todas as operações preservam request/response atuais.
8. **Given** um registro de outra clínica, **When** o cliente tenta acessá-lo, **Then** recebe `404` (isolamento multi-tenant preservado).
9. **Given** um usuário sem permissão para a ação, **When** tenta criar/editar/assinar/excluir, **Then** recebe `403` conforme policies atuais.

---

### User Story 2 - Prontuário é um módulo com fronteira limpa (Priority: P1)

Um desenvolvedor que precisa evoluir o prontuário encontra todo o código relacionado — controllers, services, repositories, contratos, requests, policies, models, migrations, factories, seeders, eventos e testes — dentro de `modules/ClinicalRecord`, e não espalhado em `Clinic`. O módulo `Clinic` não contém mais regra de negócio de prontuário.

**Why this priority**: É o valor estrutural da feature: ownership claro do bounded context, pré-requisito para evolução isolada e eventual extração como microserviço. É mais delicado que extrações anteriores porque encosta em paciente, profissional, upload de arquivos e PDF.

**Independent Test**: Rodar os testes de arquitetura (fitness tests) que verificam ownership de namespaces, localização de migrations, ausência de rotas/regra de prontuário duplicadas em `Clinic`, e ausência de imports privados cross-module; todos passam.

**Acceptance Scenarios**:

1. **Given** a base de código pós-extração, **When** se inspecionam os controllers das rotas de prontuário, **Then** todos pertencem ao namespace `Modules\ClinicalRecord\Http\Controllers`.
2. **Given** a base de código pós-extração, **When** se procuram migrations de prontuário (`clinic_assessments`, `clinic_assessment_answers`, `clinic_assessment_answer_options`, `clinic_patient_evolutions`, `clinic_patient_evolution_checked_items`, `clinic_patient_files`, `clinic_evolution_templates`, `clinic_evolution_template_sections`, `clinic_evolution_template_items`), **Then** todas estão em `modules/ClinicalRecord/database/migrations` e não existem mais em `modules/Clinic/database/migrations`.
3. **Given** a base de código pós-extração, **When** se inspecionam as rotas de `Clinic`, **Then** não há rotas de prontuário duplicadas nem definidas em `Clinic`.
4. **Given** o código de produção de `ClinicalRecord`, **When** se analisa seus imports, **Then** ele não importa Models ou Repositories privados de outros módulos para regra de negócio.
5. **Given** controllers e services de prontuário, **When** se inspecionam suas dependências, **Then** controllers dependem de `ServiceInterface` (não concreto) e services dependem de `RepositoryInterface` (não concreto).

---

### User Story 3 - Integrações reagem a eventos de prontuário (Priority: P2)

Consumidores presentes ou futuros (auditoria, activity log, integrações de arquivo, relatórios) reagem a mudanças no prontuário através de eventos de integração públicos, em vez de acessar diretamente Models internos de `ClinicalRecord`.

**Why this priority**: Garante que a fronteira nova seja real e não apenas cosmética; habilita Event-Driven Architecture e prepara o módulo para extração futura. É P2 porque o comportamento observável via API (P1) já estaria correto; os eventos tornam o desacoplamento durável.

**Independent Test**: Disparar cada caso de uso (criar/atualizar/completar avaliação, registrar evolução, anexar/remover arquivo) e verificar via fake de eventos que o evento de integração correspondente é despachado após o commit, carregando IDs + snapshot mínimo (sem Model Eloquent).

**Acceptance Scenarios**:

1. **Given** uma criação de avaliação bem-sucedida, **When** a transação confirma, **Then** um evento `AssessmentCreated` é despachado contendo versão, IDs (avaliação, clínica, paciente, profissional, ator, template), status e timestamp de ocorrência.
2. **Given** uma atualização de avaliação em rascunho bem-sucedida, **When** a transação confirma, **Then** um evento `AssessmentUpdated` é despachado.
3. **Given** uma assinatura de avaliação bem-sucedida, **When** a transação confirma, **Then** um evento `AssessmentCompleted` é despachado.
4. **Given** uma evolução criada, atualizada (`PUT`) ou assinada (`POST .../sign`) com sucesso, **When** a transação confirma, **Then** um evento `EvolutionRecorded` é despachado contendo versão, IDs, template, data registrada e timestamp de ocorrência.
5. **Given** um arquivo anexado ao paciente com sucesso, **When** a transação confirma, **Then** um evento `PatientFileAttached` é despachado.
6. **Given** um arquivo removido com sucesso, **When** a transação confirma, **Then** um evento `PatientFileDeleted` é despachado.
7. **Given** qualquer evento de prontuário, **When** ele é inspecionado, **Then** não carrega nenhuma instância de Model Eloquent, apenas dados primitivos/imutáveis.

---

### Edge Cases

- **Paciente (`Patient`)** permanece em outro módulo. Validação de existência e pertencimento à clínica MUST usar `patient_id` + contrato público (`PatientServiceInterface`) no Service; Models de `ClinicalRecord` MAY declarar `belongsTo` cross-module com FQN inline (ADR-008) somente para eager load e serialização JSON.
- **Profissional (`ClinicUser`)** permanece em `Clinic`. Respostas que hoje incluem dados do profissional (`clinicUser`) MUST continuar retornando os mesmos campos; relação `belongsTo` cross-module com FQN inline (ADR-008) é permitida somente no Model, não em regra de negócio do Service.
- **Catálogo de templates de avaliação (`Admin`)**: criação de avaliação referencia template do admin; leitura do catálogo via endpoints `assessment-templates` e validação de payload MUST consumir contrato público Admin (`AssessmentTemplateReadServiceInterface` ou equivalente), sem importar Models privados de `Admin` em Service ou regra de negócio.
- **Upload de arquivos**: anexo de `PatientFile` depende de armazenamento externo. Upload não deve acoplar diretamente internals de `Cloudflare`/`Media`; deve usar contrato público existente (`FileServiceInterface` ou equivalente) e emitir `PatientFileAttached` após persistência bem-sucedida.
- **PDF de evolução**: geração/download de PDF de evolução depende de capacidade de PDF. Deve consumir contrato público do módulo `Pdf`, não service concreto acoplado, preservando o mesmo arquivo/resposta HTTP.
- **Avaliação já assinada**: tentativa de editar avaliação assinada deve continuar retornando erro de validação com a mesma semântica.
- **Evolução assinada**: regras atuais de edição/exclusão após assinatura devem ser preservadas.
- **Template de evolução em uso**: exclusão ou alteração de template referenciado por evoluções existentes deve manter comportamento atual (validação ou soft constraints existentes).
- **Arquivo de outro paciente ou clínica**: tentativa de acessar/remover deve retornar `404`.
- **Seeders e factories**: dados demo de prontuário devem continuar disponíveis após `migrate:fresh --seed`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST expor todos os endpoints REST de prontuário nos mesmos paths, métodos HTTP e nomes de rota atuais, incluindo: `clinic.patients.assessments.*`, `clinic.assessments.*`, `clinic.patients.evolutions.*`, `clinic.evolutions.*`, `clinic.evolution-templates.*`, `clinic.patients.files.*` e `clinic.assessment-templates.*`.
- **FR-002**: O sistema MUST preservar exatamente o shape de cada request de prontuário (mesmos campos, validações e regras de obrigatoriedade).
- **FR-003**: O sistema MUST preservar exatamente o shape de cada response de prontuário (mesmo envelope `data`, mesmos campos, mesmos status HTTP).
- **FR-004**: O sistema MUST preservar todas as regras de negócio atuais de prontuário: status de avaliação (rascunho/assinada), restrição de edição pós-assinatura, assinatura de evolução, geração de texto, download de PDF, CRUD de templates de evolução, upload/remoção de arquivos, e isolamento multi-tenant por clínica (404 para outra clínica).
- **FR-005**: Todo o código de prontuário MUST residir no módulo `ClinicalRecord` (Models, Controllers, FormRequests, Services, ServiceInterfaces, Repositories, RepositoryInterfaces, Policies, Events, Routes, Factories, Seeders, Tests).
- **FR-006**: As migrations de prontuário MUST residir em `modules/ClinicalRecord/database/migrations` e NÃO MUST existir em `modules/Clinic/database/migrations`.
- **FR-007**: Os nomes de tabela de prontuário MUST permanecer inalterados (`clinic_assessments`, `clinic_assessment_answers`, `clinic_assessment_answer_options`, `clinic_patient_evolutions`, `clinic_patient_evolution_checked_items`, `clinic_patient_files`, `clinic_evolution_templates`, `clinic_evolution_template_sections`, `clinic_evolution_template_items`).
- **FR-008**: O módulo `Clinic` MUST NOT conter mais rotas de prontuário nem regra de negócio de prontuário após a extração; não MUST haver rotas de prontuário duplicadas.
- **FR-009**: Os controllers das rotas de prontuário MUST pertencer ao namespace `Modules\ClinicalRecord\Http\Controllers`.
- **FR-010**: Controllers de prontuário MUST NOT conter regra de negócio nem queries; MUST depender de uma `ServiceInterface` (não de service concreto).
- **FR-011**: O Service de prontuário MUST implementar sua `ServiceInterface`, orquestrar o caso de uso, delegar persistência/queries ao `RepositoryInterface` e disparar eventos.
- **FR-012**: O Repository de prontuário MUST encapsular todo o acesso a persistência; queries complexas MUST residir no Repository, não no Service.
- **FR-013**: O código de produção de `ClinicalRecord` MUST NOT importar Models ou Repositories privados de outros módulos para regra de negócio; comunicação cross-module MUST ocorrer apenas via ServiceInterface pública, DTO público, Integration Event ou read model. Exceção documentada (ADR-008/009): Models de `ClinicalRecord` MAY declarar `belongsTo`/`HasMany` cross-module com FQN inline exclusivamente para eager load e serialização JSON de responses — proibido em Services para decisões de negócio.
- **FR-014**: O sistema MUST emitir eventos de integração para os casos de uso de prontuário: `AssessmentCreated`, `AssessmentUpdated`, `AssessmentCompleted`, `EvolutionRecorded` (em create, update via `PUT` e assinatura via `POST .../sign`), `PatientFileAttached`, `PatientFileDeleted`.
- **FR-015**: Cada evento de prontuário MUST carregar apenas IDs + snapshot mínimo (versão, identificadores de entidade, clínica, paciente, profissional, ator, template quando aplicável, status ou data registrada, timestamp de ocorrência) e MUST NOT carregar instâncias de Model Eloquent.
- **FR-016**: Os eventos MUST ser despachados apenas após o commit da transação, nunca no Controller.
- **FR-017**: O registro do novo módulo MUST seguir o padrão real do projeto (`modules_statuses`), e o provider NÃO MUST ser registrado em `bootstrap/providers.php`.
- **FR-018**: Policies MUST continuar garantindo ownership por `clinic_id` e permissões por papel (admin de clínica, profissional, etc.) conforme comportamento atual.
- **FR-019**: Upload e remoção de arquivos MUST continuar funcionando via contrato público de armazenamento, sem acoplar regra de negócio a internals de `Cloudflare`/`Media`.
- **FR-020**: Geração/download de PDF de evolução MUST continuar funcionando via contrato público de PDF, preservando resposta HTTP atual.
- **FR-021**: Leitura do catálogo de templates de avaliação (`assessment-templates`) e validação de payload na criação/edição de avaliações MUST consumir contrato público Admin (`AssessmentTemplateReadServiceInterface` ou equivalente), preservando paths e shapes atuais, sem ownership dos dados de catálogo por `ClinicalRecord` e sem importar Models privados de `Admin` em Service ou regra de negócio.
- **FR-022**: Factories e seeders de prontuário MUST residir em `ClinicalRecord` e permitir popular dados via `migrate:fresh --seed`.
- **FR-023**: A suíte de testes de prontuário (Unit + Feature + Policies) MUST residir em `ClinicalRecord` e passar, validando comportamento preservado.
- **FR-024**: O código MUST seguir as convenções do projeto: `is_null()` / `! is_null()` em vez de `=== null` / `!== null`, e `empty()` / `! empty()` em vez de comparação com string vazia.
- **FR-025**: Testes de arquitetura (fitness tests) MUST ser criados/atualizados para garantir fronteiras de módulo, localização de migrations, paths REST preservados, ausência de rotas duplicadas em `Clinic`, eventos sem Models Eloquent, e inversão de dependência (Controller→ServiceInterface, Service→RepositoryInterface).

### Key Entities *(include if feature involves data)*

- **Assessment (Avaliação clínica)**: registro estruturado de avaliação de um paciente, baseado em template do catálogo admin. Atributos-chave: clínica, paciente, profissional responsável, referência ao template admin, status (rascunho/assinada), data de assinatura. Relaciona-se com respostas e opções de resposta.
- **AssessmentAnswer / AssessmentAnswerOption**: respostas preenchidas pelo profissional durante a avaliação, vinculadas a campos do template.
- **PatientEvolution (Evolução clínica)**: registro de evolução/atendimento de um paciente, possivelmente baseado em template de evolução da clínica. Atributos-chave: clínica, paciente, profissional, template, conteúdo/texto gerado, status de assinatura, itens marcados.
- **PatientEvolutionCheckedItem**: itens de checklist marcados dentro de uma evolução, vinculados a itens do template.
- **PatientFile (Arquivo do paciente)**: metadados de arquivo anexado ao prontuário (nome, caminho, URL, tipo MIME, tamanho), vinculado a paciente, clínica e profissional que anexou.
- **EvolutionTemplate / EvolutionTemplateSection / EvolutionTemplateItem**: templates configuráveis pela clínica para padronizar registros de evolução (seções e itens de checklist).
- **Integration Events de Prontuário**: representações imutáveis e serializáveis (IDs + snapshot mínimo) dos fatos criar/atualizar/completar avaliação, registrar evolução, anexar/remover arquivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos endpoints REST de prontuário existentes continuam respondendo nos mesmos paths/métodos com os mesmos shapes de request e response (zero mudança de contrato observável pelo frontend).
- **SC-002**: O frontend exige **zero** alterações para continuar operando o prontuário digital após a extração.
- **SC-003**: 100% dos testes de prontuário (Unit + Feature + Policies) passam após a extração; nenhuma asserção de HTTP/JSON precisou ser relaxada para acomodar mudança de contrato.
- **SC-004**: Os testes de arquitetura (fitness tests) passam, confirmando: ownership de namespace, localização das migrations, ausência de rotas de prontuário em `Clinic`, ausência de imports privados cross-module, eventos sem Models Eloquent, e inversão de dependência correta.
- **SC-005**: `migrate:fresh --seed` executa com sucesso e popula dados de prontuário a partir de `ClinicalRecord`.
- **SC-006**: 0 (zero) ocorrências de código de regra de negócio de prontuário remanescentes no módulo `Clinic`.
- **SC-007**: Cada um dos 6 casos de uso de prontuário com evento despacha seu evento de integração correspondente, após o commit, carregando apenas IDs + snapshot mínimo.
- **SC-008**: Profissionais conseguem completar o fluxo principal de prontuário (criar avaliação → assinar → registrar evolução → anexar arquivo) sem erro adicional ou passo extra em comparação com o comportamento anterior.

## Assumptions

- O nome do módulo é `ClinicalRecord` (decisão fechada).
- Rotas públicas, shapes de request/response e nomes de tabela permanecem inalterados (decisões fechadas).
- Migrations de prontuário são movidas para o módulo dono `ClinicalRecord` (decisão fechada).
- O sistema é local/dev; `migrate:fresh --seed` é permitido e não há necessidade de plano de migração de dados em produção (decisão fechada).
- O frontend está fora de escopo e não será alterado (decisão fechada).
- `Patient` permanece em módulo separado; Services de `ClinicalRecord` usam `patient_id` + `PatientServiceInterface`, não Model privado, para regra de negócio. Models MAY usar `belongsTo` cross-module com FQN inline (ADR-008) para preservar shape JSON de responses.
- `ClinicUser` e identidade da clínica permanecem em `Clinic`; Services usam IDs e contratos públicos; Models MAY usar `belongsTo` cross-module com FQN inline (ADR-008) para eager load de `clinicUser` em responses.
- Catálogo de templates de avaliação permanece no módulo `Admin`; `ClinicalRecord` consome via contrato público de leitura (`AssessmentTemplateReadServiceInterface` ou equivalente) para validação de avaliações e endpoints `assessment-templates`. Implementação do contrato público no módulo `Admin` faz parte do escopo desta extração.
- Upload de arquivos usa contrato público de armazenamento já existente no projeto (`FileServiceInterface` ou equivalente).
- PDF de evolução usa contrato público do módulo `Pdf`.
- O provider do módulo é registrado pelo mecanismo `modules_statuses` do projeto, e não em `bootstrap/providers.php`.
- Documentação de arquitetura (ADR 009, capability map, checklist de readiness) será criada/atualizada nas fases de plano e implementação.
- `AssessmentCompleted` corresponde ao caso de uso de assinatura de avaliação (`POST assessments/{id}/sign`), quando o status passa a assinada.
- `EvolutionRecorded` é despachado na criação, na atualização via `PUT` e na assinatura via `POST /evolutions/{id}/sign`, refletindo o registro clínico mais recente após cada mutação persistida.
