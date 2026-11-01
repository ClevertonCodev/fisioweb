# Paciente e atendimento no lançamento de entrada

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 44, 45, 46, 47, 48
**Issue:** ainda não criada

## Descrição

Hoje o lançamento não diz quem pagou. A abordagem é guardar só os ids de paciente e atendimento no lançamento e ler nome e posse pelos contratos públicos de `Patient` e `ClinicScheduling`, sem importar Model de outro módulo.

## O que construir

- Migration em `ClinicFinance`: `patient_id` e `appointment_id` nulos no lançamento, índice (`clinic_id`, `patient_id`), sem FK entre módulos.
- `POST`/`PUT` aceitam `patient_id` e `appointment_id` só em entrada. Paciente precisa ser da clínica (`PatientServiceInterface::findForClinic`); atendimento precisa ser da clínica e do paciente (`AppointmentReadServiceInterface::getSnapshotById`). Senão, 422.
- `Patient` ganha uma leitura pública (DTO) de nomes por ids e de ids por termo, limitada à clínica. `ClinicScheduling` ganha no contrato público "atendimentos de um paciente na clínica".
- Nova `GET /clinic/finances/patients/{patientId}/appointments` (administrador e secretária) para o seletor.
- Cada lançamento da listagem traz `patient: { id, name } | null` e `appointment: { id, starts_at } | null`; a busca (`q`) também acha pelo nome do paciente.
- Modal: na entrada, seletor de paciente (com busca no servidor) e, depois, de atendimento dele (opcional). O nome aparece no dia, nas pendências e na busca.
- Exportação ganha a coluna "Paciente".
- O prontuário do paciente não muda.

## Critérios de Aceite

- [x] Paciente de outra clínica → 422; atendimento de outro paciente → 422; atendimento de outra clínica → 422 (testes)
- [x] `patient_id` numa saída → 422 (teste)
- [x] A busca acha o lançamento pelo nome do paciente, sem diferenciar maiúscula (teste)
- [x] `ClinicFinance` não importa Model de `Patient` nem de `ClinicScheduling` (os testes de `Architecture` de fronteira não ganham falha nova)
- [x] Exportação com a coluna "Paciente" (teste)
- [x] Modal: escolher paciente e depois um atendimento dele; o nome aparece no dia (Vitest)
- [x] Fisioterapeuta → 403 na rota de atendimentos do paciente (teste)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/013-paciente-e-atendimento/` (a revisão adversária roda no fim, para a feature inteira)

## Depende de

- `006-lancar-editar-excluir` (Lançar, editar e excluir)
- `008-busca-no-historico` (Busca no histórico)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/TreatmentProgram/app/Http/Requests/ValidatesPatientOfClinic.php`, `modules/ClinicScheduling/app/Contracts/Public/AppointmentReadServiceInterface.php`
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-clean-code`, `laravel-eloquent`, `php-testing`, `design-system`, `frontend-testing`

## Como testar na mão

1. Clínica A, secretária: nova entrada, escolher o paciente e um atendimento dele de hoje.
2. O dia mostra o nome do paciente; buscar pelo nome acha o lançamento.
3. Pela API, `patient_id` de um paciente da clínica B → 422.
4. Exportar CSV: a coluna "Paciente" vem preenchida.
