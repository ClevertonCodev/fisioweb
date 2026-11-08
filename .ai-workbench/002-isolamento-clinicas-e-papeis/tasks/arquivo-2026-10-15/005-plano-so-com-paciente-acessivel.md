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

- [x] O teste que reproduz a falha foi escrito antes da correção e estava vermelho.
- [x] `POST /api/clinic/treatment-plans` com `patient_id` da B devolve 422. A resposta não contém nome, CPF nem telefone do paciente da B, e nenhum plano é criado.
- [x] `PUT` de plano da A trocando `patient_id` para um paciente da B devolve 422, e o plano continua igual.
- [x] Nenhum `TreatmentPlanCreated` ou `TreatmentPlanActivated` é disparado no caso negado (`Event::fake`).
- [x] Plano com paciente da própria clínica e plano sem paciente continuam funcionando.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (falta: decisão do usuário após a rodada 3 da revisão adversária na branch da 008) (`docs/ai-harness/DEFINITION_OF_DONE.md`).

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

## Como foi feito (2026-10-22)

Feita antes da tarefa 003, a pedido do usuário, na branch
`feat/clinic-historico-exercicios-programas`. O contrato público do Patient
ganhou `findForClinic(int $clinicId, int $id): ?Patient` (só regra de clínica),
e os dois Requests usam o trait `ValidatesPatientOfClinic`, que chama esse
contrato e responde 422 "Paciente não encontrado.". O `exists:patients,id` saiu
(a busca já cobre id inexistente). No editar, reenviar o paciente que o plano já tem não é checado, para plano de paciente removido (soft delete) continuar editável. Quando a 003 criar a busca que recebe o
usuário inteiro (para a 013), o trait passa a chamá-la. Testes em
`TreatmentPlanIsolationTest` e `PatientServiceTest`.
