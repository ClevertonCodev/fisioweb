# Rede de segurança e migração de ClinicUser e Dashboard

**Tipo:** Tarefa
**Plano:** `../plans/clinic-base-controller.md`
**Issue:** ainda não criada

## Descrição

ClinicUserController e DashboardController leem o guard `clinic` direto e não têm nenhum teste com dado de outra clínica. Os testes atuais do Dashboard cobrem escopo por papel dentro da mesma clínica, não entre clínicas. Antes de migrar, escrevemos os testes de outra clínica contra o código atual. Depois os dois controllers passam a usar o controller base, e esses testes provam que o isolamento não mudou.

Cobre as histórias 7, 16, 17 e 18 do plano.

## O que construir

- **Rede de segurança (antes da migração, passando no código atual):**
  - **Usuários da clínica:** um `admin` da clínica B não vê usuários de A em `GET /api/clinic/users` nem em `GET /api/clinic/users/professionals`. Em `GET`, `PUT` e `DELETE /api/clinic/users/{user}` com usuário de A, recebe o mesmo status de hoje e não altera nada.
  - **Dashboard:** os números de `GET /api/clinic/dashboard`, `occupancy-rate`, `patient-acquisition` e `activities` de B não contam dados de A. Um `professional` de A passado como filtro por B é ignorado, como faz a checagem atual do `DashboardController`.
- **Migração:** ClinicUserController e DashboardController estendem o controller base e trocam todo acesso ao guard pelos métodos novos. As queries Eloquent diretas continuam onde estão (ver Fora do Escopo do plano). Só muda de onde vem o `clinicId`.
- Comparações estritas de `clinic_id` convertem o lado do model para `int`.
- Guard `clinic`. As permissões continuam vindo do `authorizeResource` e da Policy de `ClinicUser`. Não tem migration, fila nem frontend.

## Critérios de Aceite

- [ ] Os testes novos de outra clínica para usuários da clínica e Dashboard existem e passam **antes** da migração. O commit de teste vem antes do commit de refatoração. (pendente: depende de como o usuário commitar — os testes foram escritos e confirmados verdes no código antigo antes de cada migração; ver sugestão de commits)
- [x] Nenhum `Auth::guard('clinic')` ou `auth('clinic')` sobra em ClinicUserController e DashboardController.
- [x] Os testes atuais continuam verdes sem alteração: `ProfessionalsListTest` e os da pasta Dashboard.
- [x] Um usuário de outra clínica não vê nem altera usuários desta clínica, e os indicadores do Dashboard não misturam clínicas.
  - **Ressalva (2026-10-13):** a rede de segurança achou uma falha que já existe na `main`: `GET`/`PUT`/`DELETE /api/clinic/users/{user}` não comparam `clinic_id` (o `Gate::before` libera admin e o binding não tem escopo), então admin de outra clínica lê, altera (PUT confirmado: 200, registro alterado) e apaga usuário desta. Não é causada pela refatoração. Por decisão do usuário, vai no bugfix final junto com os favoritos; os testes `ClinicUserIsolationTest::test_show_user_of_another_clinic_is_denied`, `test_update_user_of_another_clinic_is_denied` e `test_destroy_user_of_another_clinic_is_denied` ficam `markTestIncomplete` até lá (o de `PUT` usa payload válido, para chegar ao controller). Listagem, profissionais e Dashboard estão isolados e cobertos.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-controller-base-e-modulo-clinic` (Criar ClinicAuthenticatedController e migrar Patient, ClinicProfile e Exercise)

## Notas de Implementação

- **Branch:** `feat/clinic-base-controller-clinic-user-dashboard`
- **Exemplo no código:**
  - `modules/Clinic/tests/Feature/Dashboard/DashboardScopeTest.php`: montagem de dados do Dashboard;
  - `modules/Clinic/tests/Feature/PatientControllerTest.php`, `test_destroy_returns404_for_patient_of_another_clinic`: o caso de outra clínica.
- **Skills:** `php-testing`, `security`, `backend-clean-code`.

## Como testar na mão

1. Com as clínicas A e B, criar um fisioterapeuta em A.
2. Como `admin` de B, `GET /api/clinic/users`: o fisioterapeuta de A não aparece.
3. Como `admin` de B, `GET /api/clinic/users/{id do fisioterapeuta de A}`: mesmo status de antes da mudança (anotar antes e depois).
4. Criar um paciente em A e conferir que `GET /api/clinic/dashboard` como B não muda.
5. Como `admin` de A, o Dashboard continua mostrando os mesmos números de antes da mudança.
