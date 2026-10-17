# Reativar paciente inativo, de ponta a ponta

**Tipo:** História
**Plano:** `../plans/clinic-pacientes-ds.md`
**Issue:** ainda não criada

## Descrição

Hoje não há como reativar um paciente inativo. Não existe endpoint para isso, e a única forma era o `is_active` do `PUT`, que a tarefa 001 fecha. Esta tarefa cria a reativação com as mesmas regras da inativação: só admin e secretária, só paciente da própria clínica e com confirmação na tela. No cartão do paciente inativo, o quarto atalho do rodapé vira "Reativar".

## O que construir

- **Endpoint:** `POST /api/clinic/patients/{id}/reactivate`, guard `clinic`, sem corpo.
  - Devolve 200 com `{ data: Patient }`, no mesmo formato do `show`, com `is_active: true`.
  - Devolve 404 se o paciente não existe ou é de outra clínica. Esse 404 é conferido antes da Policy.
  - Devolve 403 se o papel não pode.
  - Reativar um paciente ativo devolve 200 e não muda nada.
- **Donos:** o dado e a regra são do módulo `Patient`. O `reactivate(clinicId, id)` entra no contrato público (`PatientServiceInterface`) e no repository, no mesmo formato do `bulkInactivate`, e o `update` do repository filtra por `clinic_id`. A rota, o controller e a Policy (`PatientPolicy::reactivate`) são do módulo `Clinic`.
- **Permissão:** a secretária pode pela Policy, o admin passa pelo `Gate::before` e o fisioterapeuta não pode.
- **Frontend:** o Repository ganha `reactivate(id)`, a `application` ganha o hook `useReactivatePatient` (que invalida as queries de `['patients']`) e o `permissions.ts` ganha `can.reactivate`, com a mesma regra do `can.bulkInactivate`.
- **Cartão inativo:** o quarto atalho vira "Reativar paciente", com ícone neutro ou de sucesso, e abre o mesmo modal da tarefa 004.
  - O título é "Reativar {nome}?".
  - O botão de confirmar é primário.
  - Sucesso: toast, e o cartão volta ao normal, sem o selo.
  - Erro: toast, e o modal continua aberto.
  - Para o fisioterapeuta, o atalho fica desabilitado, com o tooltip "Apenas admin ou secretária podem reativar pacientes".
- Sem migration, sem fila e sem evento.

## Critérios de Aceite

- [ ] Os testes de backend foram escritos antes do endpoint e estavam vermelhos. **Parcial:** o primeiro (admin e secretária reativam) foi escrito antes e estava vermelho (404, rota inexistente); os de 403, 404 de outra clínica, id inexistente, 401 e paciente já ativo foram escritos com o endpoint já existindo e provados quebrando o código (Policy liberando, controller sem checar clínica, repository sem `clinic_id`), cada quebra deixou o teste vermelho.
- [x] Admin e secretária reativam o paciente inativo da própria clínica: 200, `data.is_active = true` e o banco atualizado (teste Feature).
- [x] O fisioterapeuta recebe 403, e o paciente continua inativo no banco (teste Feature).
- [x] O admin da clínica A reativando o paciente da clínica B recebe 404, e o paciente da B continua inativo no banco (teste em `PatientClinicIsolationTest`).
- [x] Id inexistente dá 404; sem autenticação dá 401 (teste Feature).
- [x] Reativar um paciente ativo devolve 200, e ele continua ativo (teste Feature).
- [x] `PatientPolicy::reactivate`: a secretária pode e o fisioterapeuta não (teste unitário, junto do `PatientPolicyTest`).
- [x] O Repository do frontend chama `POST /clinic/patients/{id}/reactivate` e mapeia a resposta (teste em `api-clinic-patients.test.ts`).
- [x] `can.reactivate`: admin e secretária sim, fisioterapeuta e `undefined` não (teste em `permissions.test.ts`).
- [x] O cartão inativo mostra "Reativar"; o modal abre com o nome; confirmar chama a mutation com o id e mostra o toast; cancelar não chama nada (teste).
- [x] Para o fisioterapeuta, "Reativar" fica desabilitado com o tooltip (teste).
- [x] Inativar e reativar o mesmo paciente na tela funciona em sequência, sem recarregar a página (smoke test).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `004-inativar-pelo-cartao` (o modal de confirmação e o atalho do rodapé com regra de papel).
- Recomendado depois de `001-is-active-so-pelos-endpoints`, para que este endpoint passe a ser o único caminho de reativação.

## Notas de Implementação

- **Branch:** `feat/clinic-pacientes-ds`.
- **Exemplo no código:**
  - backend: `PatientController::destroy`, para o 404 de outra clínica antes do `authorize`, e `bulkInactivate`, no controller, no service e no repository, para o formato do contrato;
  - testes: `PatientClinicIsolationTest::test_bulk_inactivate_only_reaches_own_clinic_patients` e `PatientPolicyTest`;
  - frontend: `useBulkInactivatePatients` e `bulkInactivate` em `api-clinic-patients.ts`.
- **Skills:** `backend-clean-code`, `architecture-paradigm-modular-monolith` (o método entra no contrato público do `Patient`), `php-testing`, `security`, `api-client`, `frontend-ddd`, `frontend-testing`, `design-system`.
- A rota vai antes da `{id}` genérica, se houver conflito. Hoje o `POST {id}/reactivate` não colide com nada.
- A tarefa 004 da feature 002 vai unificar o 404 de outra clínica numa checagem no controller base. Se ela entrar antes desta, use a checagem nova em vez do `if` manual.

## Como testar na mão

1. `fisio-app build`; como admin da Clínica Cleverton (credenciais do admin da clínica no `DatabaseSeeder`), garantir uma secretária, um fisioterapeuta e um paciente inativo.
2. Como secretária, em `/clinica/pacientes`, o cartão inativo mostra "Reativar paciente". Abrir, cancelar, abrir de novo e confirmar: toast, e o cartão volta ao normal. Inativar de novo pelo mesmo cartão.
3. Como fisioterapeuta: "Reativar" fica desabilitado com o tooltip. `POST /api/clinic/patients/{id}/reactivate` com o token dele: 403, e o paciente segue inativo em `fisio-app psql`.
4. Como admin da Clínica Start: `POST /api/clinic/patients/{id de paciente inativo da Cleverton}/reactivate` dá 404, e o paciente segue inativo.
5. `POST /api/clinic/patients/999999/reactivate` dá 404; sem token, dá 401.
