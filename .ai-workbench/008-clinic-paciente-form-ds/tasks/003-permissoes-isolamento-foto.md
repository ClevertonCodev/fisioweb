# Permissões e isolamento da foto no backend

**Tipo:** Tarefa
**Plano:** `../plans/clinic-paciente-form-ds.md`
**Issue:** ainda não criada

## Descrição

O `PatientController` já isola por `clinic_id` (outra clínica recebe 404 no
show, update, deletePhoto). Mas `store`, `update` e `uploadPhoto` não
chamam `authorize` — só o `deletePhoto` chama. Não há teste de isolamento
para o upload da foto. Os papéis não mudam: admin, secretário(a) e
fisioterapeuta continuam podendo criar e editar.

## O que construir

- **Policy:** manter `create` e `update` liberados para os três papéis (como
  os testes unitários já documentam). Admin continua passando pelo
  `Gate::before`.
- **Controller:** `store` autoriza `create`; `update` e `uploadPhoto`
  autorizam `update` no paciente já encontrado da clínica (404 antes, se
  for de outra).
- **Isolamento:** clínica A não consegue enviar foto de paciente da clínica
  B (404, foto da B intacta). O PUT entre clínicas já tem teste; não
  repetir se não acrescentar nada.
- Sem mudança de contrato HTTP, sem migration, sem mudança de papéis no
  frontend.

## Critérios de Aceite

- [x] `store`, `update` e `uploadPhoto` chamam `authorize` com a Policy de paciente.
- [x] Usuário de outra clínica recebe 404 ao enviar foto de paciente que não é da clínica dele; a foto original não muda (teste).
- [x] Os três papéis da mesma clínica continuam podendo criar e editar (testes de Policy existentes permanecem verdes).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar em paralelo com a 001.

## Notas de Implementação

- **Branch:** `feat/clinic-paciente-form-ds`
- **Exemplo no código:** `PatientController::deletePhoto` (já autoriza `update`); `PatientClinicIsolationTest` (show, update, deletePhoto); `PatientPolicy` + `PatientPolicyTest`.
- **Skills:** `security`, `php-testing`.

## Como testar na mão

1. Com o teste novo: clínica A tenta `POST /api/clinic/patients/{idB}/photo` e recebe 404; foto de B no banco segue igual.
2. Na Clínica Cleverton, admin, secretário e fisioterapeuta ainda cadastram e editam paciente (smoke das tarefas 001/002 cobre o caminho feliz).
3. Clínica Start não vê o paciente criado na Cleverton (já coberto no smoke da 001).
