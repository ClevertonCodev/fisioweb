# Plano de tratamento só aceita paciente acessível

**Tipo:** Bug
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

`StoreTreatmentPlanRequest` e `UpdateTreatmentPlanRequest` validam `patient_id` só com `exists:patients,id`, sem filtro de clínica. Uma clínica cria um plano com paciente de outra clínica, e a resposta devolve nome, CPF, telefone e data de nascimento desse paciente. Trocando o id um a um, dá para baixar os pacientes de todas as clínicas. Além disso, o plano fica ligado ao paciente da outra clínica e dispara `TreatmentPlanActivated` para ele.

A correção valida o `patient_id` com a busca de paciente acessível do Patient (tarefa 003), no mesmo padrão que o `StoreAppointmentRequest` já usa.

## O que construir

- Criar e editar plano (módulo TreatmentProgram, guard `clinic`): `patient_id`, quando enviado, precisa ser de paciente acessível ao usuário. Senão a resposta é 422 com erro em `patient_id`, e nada é gravado nem disparado.
- `patient_id` nulo continua permitido (plano sem paciente).
- Quando a tarefa 013 entrar, a mesma validação passa a barrar o fisio sem vínculo, sem mudar este código.
- Sem migration e sem mudança no SPA.

## Critérios de Aceite

- [ ] O teste que reproduz a falha foi escrito antes da correção e estava vermelho.
- [ ] `POST /api/clinic/treatment-plans` com `patient_id` da B devolve 422. A resposta não contém nome, CPF nem telefone do paciente da B, e nenhum plano é criado.
- [ ] `PUT` de plano da A trocando `patient_id` para um paciente da B devolve 422, e o plano continua igual.
- [ ] Nenhum `TreatmentPlanCreated` ou `TreatmentPlanActivated` é disparado no caso negado (`Event::fake`).
- [ ] Plano com paciente da própria clínica e plano sem paciente continuam funcionando.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `003-busca-de-paciente-acessivel` (Busca de paciente acessível no Patient e todos os módulos usando ela)

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - `modules/ClinicScheduling/app/Http/Requests/StoreAppointmentRequest.php` (validação de paciente por clínica);
  - `modules/TreatmentProgram/tests/Feature/TreatmentPlanIsolationTest.php`.
- **Skills:** `security`, `php-testing`, `architecture-paradigm-modular-monolith`

## Como testar na mão

1. Como admin da A, crie um plano pela tela de programas escolhendo um paciente da A → salva normalmente.
2. Pela API, `POST /api/clinic/treatment-plans` com o `patient_id` de um paciente da B → 422, sem dados do paciente no corpo.
3. Confira na clínica B que nenhum plano novo apareceu na ficha desse paciente.
