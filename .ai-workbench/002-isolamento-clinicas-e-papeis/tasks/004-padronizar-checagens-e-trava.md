# Padronizar as checagens restantes, unificar o 404 e criar a trava de arquitetura

**Tipo:** Tarefa
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

Depois das tarefas 001 e 003, ainda há comparações de `clinic_id` feitas na mão: em planos de tratamento, modelos de questionário, modelos de evolução, além dos `authorizeClinic` privados da agenda e do financeiro. Elas misturam `abort_if` com `response()->json(..., 404)` e usam mensagens diferentes.

A abordagem tem três partes. Todas essas checagens passam para a checagem do controller base. O 404 fica com formato único. Um teste de arquitetura impede que a comparação manual volte.

## O que construir

- `TreatmentPlanController`, `QuestionnaireTemplateController`, `EvolutionTemplateController`, `AppointmentController` e `FinancialTransactionController` usam a checagem do controller base.
- Os dois `authorizeClinic` privados deixam de existir.
- O caso de modelo do sistema (`is_system`) continua liberado para leitura em modelos de evolução.
- Todo 404 de recurso de outra clínica nos módulos de clínica tem o formato `{"message": "<Recurso> não encontrado."}`.
- Teste novo em `tests/Architecture`: varre os controllers dos módulos de clínica e falha se encontrar comparação manual de `clinic_id`. Precisa de uma fixture que prove que ele pega o padrão proibido.
- Sem migration e sem mudança no SPA. O SPA já lê a chave `message`.

## Critérios de Aceite

- [ ] Nenhum controller de módulo de clínica compara `clinic_id` na mão, e o teste de arquitetura passa.
- [ ] O teste de arquitetura falha contra uma fixture com comparação manual.
- [ ] Todas as suítes de isolamento por módulo (Clinic, ClinicFinance, ClinicScheduling, ClinicalRecord, ClinicQuestionnaire, TreatmentProgram) continuam verdes.
- [ ] Os testes que conferiam o texto antigo do 404 foram ajustados ao formato novo, e só nesses pontos.
- [ ] Modelo de evolução do sistema continua legível por qualquer clínica. Modelo privado de outra clínica dá 404.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-checagem-de-clinica-e-usuarios` (Checagem de clínica no controller base e usuários de outra clínica com 404)
- `003-busca-de-paciente-acessivel` (Busca de paciente acessível no Patient e todos os módulos usando ela)

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - `tests/Architecture/ClinicGuardAccessTest.php` (trava parecida, criada na feature 001, com fixtures em `tests/Architecture/fixtures/`);
  - `modules/ClinicFinance/app/Http/Controllers/FinancialTransactionController.php`.
- **Skills:** `backend-clean-code`, `architecture-paradigm-modular-monolith`, `php-testing`
- Mexe em muitos endpoints que hoje funcionam. Rode as suítes de isolamento antes de começar, para ter a linha de base, e depois de cada controller migrado.
- Fecha o item "Padronizar 404" do `DEFERRED.md` da feature 001.

## Como testar na mão

1. Como admin da A, abra a agenda, o financeiro, os planos, os modelos de questionário e os modelos de evolução. Tudo continua carregando e salvando.
2. Pela API, peça um recurso da B em cada um (`/api/clinic/appointments/{id}`, `/api/clinic/finances/transactions/{id}`, `/api/clinic/treatment-plans/{id}`, `/api/clinic/questionnaire-templates/{id}`, `/api/clinic/evolution-templates/{id}`). Todos devem devolver 404 com `{"message": "... não encontrado."}`.
