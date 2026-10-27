# Paciente só muda de situação pelos endpoints com Policy

**Tipo:** Bug
**Plano:** `../plans/clinic-pacientes-ds.md`
**Issue:** ainda não criada

## Descrição

A regra é que só admin e secretária inativam paciente (`PatientPolicy::bulkInactivate`). Mas o `PUT /api/clinic/patients/{id}` aceita `is_active` e não passa por essa Policy. Assim, o fisioterapeuta consegue inativar ou reativar qualquer paciente da clínica mandando `is_active` na edição. O `POST /api/clinic/patients` também aceita o campo, e dá para criar paciente já inativo. Nenhuma tela manda esse campo hoje: ele está no payload do frontend, mas nenhum formulário preenche `isActive`.

A correção tira `is_active` da validação do cadastro e da edição, para que mudar a situação só seja possível pelos endpoints que têm Policy: o `bulk-inactivate`, que já existe, e o `reactivate`, que vem na tarefa 005. O frontend deixa de mandar o campo.

## O que construir

- No módulo `Clinic`, guard `clinic`: os FormRequests de cadastro e de edição de paciente deixam de aceitar `is_active`. Como o campo não sai mais de `validated()`, um `is_active` enviado é ignorado sem erro (200 ou 201), e a situação do paciente não muda.
- Paciente novo nasce ativo, pelo default da coluna.
- No SPA, os DTOs de escrita de paciente da `application` e o payload de cadastro e de edição do Repository perdem o `isActive`. O parâmetro `isActive` da listagem continua.
- Sem migration e sem mudança de tela.
- Vale para todos os papéis, inclusive o admin. Para o admin, a situação também só muda pelos endpoints próprios.

## Critérios de Aceite

- [x] O teste que reproduz a falha foi escrito antes da correção e estava vermelho: o `PUT` com `is_active=false` de um fisioterapeuta inativava o paciente.
- [x] `PUT /api/clinic/patients/{id}` com `is_active=false` e os campos obrigatórios válidos, feito por fisioterapeuta, secretária ou admin, devolve 200 e o paciente continua `is_active = true` no banco.
- [x] O mesmo `PUT` com `is_active=true` num paciente inativo não reativa.
- [x] `POST /api/clinic/patients` com `is_active=false` devolve 201 e o paciente é criado com `is_active = true`.
- [x] Os outros campos do `PUT` e do `POST` continuam sendo gravados normalmente; os testes existentes de `PatientControllerTest` continuam verdes.
- [x] O payload que o Repository do frontend manda no cadastro e na edição não tem `is_active` (teste em `api-clinic-patients.test.ts`).
- [x] `PUT` em paciente de outra clínica continua devolvendo 404, e o paciente da outra clínica não muda.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-pacientes-ds`. Todas as tarefas desta feature vão na mesma branch e numa PR só.
- **Exemplo no código:** `PatientClinicIsolationTest` (setup com duas clínicas, `actingAs($user, 'clinic')`, `assertDatabaseHas`); `PatientControllerTest` (payload válido de `PUT` e `POST`).
- **Skills:** `php-testing`, `backend-clean-code`, `security`, `api-client` (para o payload do Repository), `frontend-testing`.
- O seeder só cria admins. Para os testes, use a factory de `ClinicUser` com `role` de fisioterapeuta e de secretária.
- Antes de mexer, confirme com `grep` que nenhum teste existente manda `is_active` no `PUT` ou no `POST` esperando efeito. A busca de 2026-10-17 não achou nenhum.

## Como testar na mão

1. `fisio-app url`; entrar na Clínica Cleverton como admin (credenciais do admin da clínica no `DatabaseSeeder`).
2. Em `/clinica/usuarios/novo`, criar um fisioterapeuta e entrar com ele.
3. Pegar o token JWT do `localStorage` e chamar `PUT /api/clinic/patients/{id}` com os dados do paciente mais `"is_active": false`. Deve voltar 200.
4. Em `fisio-app psql`, `select id, is_active from patients where id = {id};` deve continuar `true`.
5. Repetir com `POST /api/clinic/patients` e `"is_active": false`: o paciente criado deve estar `true`.
6. Abrir a edição e o cadastro de paciente na tela e salvar normalmente: nada muda no comportamento.
