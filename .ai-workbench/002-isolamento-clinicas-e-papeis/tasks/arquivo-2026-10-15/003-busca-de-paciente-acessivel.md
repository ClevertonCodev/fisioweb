# Busca de paciente acessível no Patient e todos os módulos usando ela

**Tipo:** Tarefa
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

Hoje cada módulo que trabalha com paciente faz a mesma coisa: busca o paciente pelo contrato do Patient e compara `clinic_id` na mão. Fazem isso o `PatientController` do Clinic, ClinicalRecord (evoluções, avaliações, arquivos) e ClinicQuestionnaire. A regra "quem pode ver este paciente" vai ganhar o vínculo do fisioterapeuta (tarefa 013), e ela não pode ficar copiada em quinze lugares.

A abordagem é o módulo Patient ganhar, no contrato público, uma busca de paciente acessível: recebe o id do paciente e o usuário da clínica e devolve o paciente ou nulo. Nesta tarefa ela só aplica a regra de clínica. Todos os lugares que hoje buscam e comparam passam a usá-la, e nulo vira 404.

## O que construir

- Busca de paciente acessível no contrato público do Patient. Devolve nulo quando o paciente não existe ou é de outra clínica.
- `PatientController` (Clinic), os controllers de ClinicalRecord (evoluções, avaliações, arquivos) e o `PatientQuestionnaireController` (ClinicQuestionnaire) trocam "buscar e comparar `clinic_id`" por essa busca, e devolvem 404 com o formato padrão quando ela vem nula.
- A validação de paciente nos FormRequests da agenda (`StoreAppointmentRequest`, `UpdateAppointmentRequest`) passa a usar a mesma busca. Esses Requests já filtram por clínica; o comportamento não muda.
- Sem migration e sem mudança no SPA.

## Critérios de Aceite

- [ ] Teste do serviço do Patient: paciente da mesma clínica é devolvido; paciente de outra clínica e id inexistente devolvem nulo.
- [ ] Nenhum controller de paciente, prontuário ou questionário compara `clinic_id` de paciente na mão (conferido por busca no código; a trava automática vem na tarefa 004).
- [ ] `PatientClinicIsolationTest`, `ClinicalRecordIsolationTest`, `PatientQuestionnaireIsolationTest` e os testes da agenda continuam verdes, com 404 para paciente de outra clínica.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-checagem-de-clinica-e-usuarios` (Checagem de clínica no controller base e usuários de outra clínica com 404)

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - `modules/ClinicalRecord/app/Http/Controllers/EvolutionController.php` (padrão atual de buscar e comparar);
  - `modules/ClinicScheduling/app/Http/Requests/StoreAppointmentRequest.php` (validação de paciente por clínica).
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-clean-code`, `php-testing`
- A busca recebe o usuário inteiro, não só o `clinic_id`, porque a tarefa 013 vai usar o papel e o id dele. Os outros módulos só falam com o contrato, nunca com o model ou o repository do Patient (`ModuleBoundaryTest`).

## Como testar na mão

1. Como admin da clínica A, abra a ficha de um paciente da A (`/clinica/pacientes/...`). Prontuário, evoluções, avaliações, arquivos e questionários carregam normalmente.
2. Pela API, `GET /api/clinic/patients/{id da B}/evolutions` → 404 com `{"message": "Paciente não encontrado."}`.
3. Repita com `/assessments`, `/files` e `/questionnaires` → 404 em todos.
