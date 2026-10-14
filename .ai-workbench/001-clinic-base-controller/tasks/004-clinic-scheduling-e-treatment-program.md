# Migrar ClinicScheduling e TreatmentProgram

**Tipo:** Tarefa
**Plano:** `../plans/clinic-base-controller.md`
**Issue:** ainda não criada

## Descrição

AppointmentController (de `ClinicScheduling`), TreatmentPlanController e ProgramDraftController (de `TreatmentProgram`) leem o guard `clinic` direto. Os dois módulos já têm testes de outra clínica para esses controllers, então a migração pode ir direto, com esses testes como rede.

Cobre as histórias 9, 12, 16 e 17 do plano.

## O que construir

- **Migração:** os três controllers estendem o controller base e trocam todo acesso ao guard pelos métodos novos.
  - O `clinic_id` montado no `store` de Appointment e de TreatmentPlan vem de `clinicId()`.
  - O `clinic_user_id` vem de `clinicUserId()`.
  - O rascunho de programa usa `clinicId()` e `clinicUserId()` para achar o rascunho do usuário.
- As comparações `$plan->clinic_id !== (int) $clinicId` do TreatmentPlan passam a converter o lado do model para `int`. Essa é exatamente a comparação que poderia dar 404 falso se o model devolvesse string.
- Guard `clinic`. Permissões pelas Policies atuais de Appointment e TreatmentPlan, que não mudam. Não tem migration nem frontend.
- O PDF do plano (`GET /api/clinic/treatment-plans/{id}/pdf`) continua com o mesmo isolamento.

## Critérios de Aceite

- [x] Nenhum `Auth::guard('clinic')` ou `auth('clinic')` sobra em AppointmentController, TreatmentPlanController e ProgramDraftController.
- [x] Toda comparação estrita de `clinic_id` nesses controllers converte o lado do model para `int`.
- [x] Todos os testes de `modules/ClinicScheduling/tests` e `modules/TreatmentProgram/tests` continuam verdes sem alteração, incluindo:
  - [x] `AppointmentAuthorizationTest`, `AppointmentIndexVisibilityTest` e `AppointmentStoreTest`;
  - [x] `TreatmentPlanControllerTest`, `TreatmentPlanPdfDownloadTest` e `ProgramDraftControllerTest`.
- [x] O `ModuleBoundaryTest` de `ClinicScheduling` e `TreatmentProgram` e o `TreatmentProgramRouteCompatibilityTest` continuam verdes.
- [x] Um usuário de outra clínica não vê nem altera consultas, planos de tratamento ou rascunhos desta clínica.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-controller-base-e-modulo-clinic` (Criar ClinicAuthenticatedController e migrar Patient, ClinicProfile e Exercise)

## Notas de Implementação

- **Branch:** `feat/clinic-base-controller-scheduling-program`
- **Exemplo no código:** `modules/TreatmentProgram/tests/Feature/TreatmentPlanControllerTest.php` e `modules/ClinicScheduling/tests/Feature/AppointmentAuthorizationTest.php`, os testes que servem de rede.
- **Skills:** `php-testing`, `backend-clean-code`, `architecture-paradigm-modular-monolith`.
- **Atenção:** se algum teste quebrar, é sinal de mudança de comportamento. Investigue a causa em vez de ajustar o teste.

## Como testar na mão

1. Na clínica A, criar uma consulta e um plano de tratamento.
2. Como `admin` de A, abrir a agenda e o plano. Gerar o PDF do plano.
3. Como `admin` de B:
   - `GET /api/clinic/appointments/{id da consulta de A}` e `GET /api/clinic/treatment-plans/{id do plano de A}`: mesmos status de antes da mudança (404 ou 403);
   - `GET .../treatment-plans/{id}/pdf` com o plano de A também falha.
4. Salvar um rascunho de programa como usuário de A e conferir que `GET /api/clinic/program-drafts` como usuário de B vem vazio.
