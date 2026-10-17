# ADR: Situação do paciente (ativo/inativo) só muda por endpoints próprios, com Policy

## Contexto

A regra de negócio é que só admin e secretária inativam paciente (`PatientPolicy::bulkInactivate`). Mas o `is_active` também era aceito pelo `StorePatientRequest` e pelo `UpdatePatientRequest`, e o `PatientController::update` não chama a Policy. Na prática, qualquer papel, inclusive o fisioterapeuta, inativava ou reativava qualquer paciente da clínica mandando `is_active` no `PUT /api/clinic/patients/{id}`, e dava para criar paciente já inativo. Nenhuma tela mandava esse campo, e não existia um jeito legítimo de reativar.

A lista de pacientes v2 (feature `005-clinic-pacientes-ds`) passou a oferecer inativar e reativar pelo cartão. Por isso a regra precisava valer no backend, e não só na tela.

## Decisão

Ativar e inativar paciente são ações próprias, cada uma com a sua Policy. O cadastro e a edição não mexem na situação.

- `is_active` sai das regras do `StorePatientRequest` e do `UpdatePatientRequest`. Como o campo não sai de `validated()`, um `is_active` enviado é ignorado sem erro, e o paciente novo nasce ativo pelo default da coluna. Vale para todos os papéis, inclusive o admin.
- Inativar continua sendo `POST /api/clinic/patients/bulk-inactivate` (`{ ids }` → `{ message, count }`), autorizado por `PatientPolicy::bulkInactivate`. A tela manda um id por vez e trata `count = 0` como "paciente não encontrado".
- Reativar é o endpoint novo `POST /api/clinic/patients/{id}/reactivate`, no guard `clinic`:
  1. Primeiro, 404 se o paciente não existe ou é de outra clínica. A checagem vem antes da Policy, no mesmo padrão do `update` e do `destroy`.
  2. Depois, `PatientPolicy::reactivate`: secretária da mesma clínica sim, fisioterapeuta não; o admin passa pelo `Gate::before`.
  3. Por fim, `PatientServiceInterface::reactivate(clinicId, id)` → `PatientRepositoryInterface::reactivate`, que filtra por `clinic_id` no `update` e no `find`. Se o paciente sumiu nesse meio-tempo (soft delete), devolve `null` e o controller responde 404.
  4. Sucesso devolve `{ data: Patient }`, no mesmo formato do `show`. Reativar um paciente ativo devolve 200 sem mudar nada.
- O dado e a regra continuam no módulo `Patient`; a API da clínica (controller, Policy, rota) continua no `Clinic`. O `Clinic` usa só o contrato público `PatientServiceInterface`.
- No frontend, `can.bulkInactivate` e `can.reactivate` (`permissions.ts`) espelham a Policy, só para UX.

## Consequências

- Benefícios:
  - A regra de papel vale de verdade: nenhum caminho da API muda a situação sem passar por Policy.
  - O isolamento tem duas camadas, o 404 no controller e o filtro por `clinic_id` no repository, cada uma com teste próprio.
- Custos:
  - A situação deixou de passar pelo `PatientService::update`, que registrava `ActivityType::PatientUpdated`. Inativar e reativar não aparecem no feed de atividades. O `bulkInactivate` antigo também nunca registrou.
  - Há assimetria: inativar é em massa (`bulk-inactivate`, já existia) e reativar é singular. Reativar em massa não foi pedido.
  - `is_active` não bloqueia o login do paciente no app. Inativo hoje quer dizer "fora do acompanhamento", não "sem acesso". Isso está anotado no `DEFERRED.md` da feature como regra de produto em aberto.
- Regras que agentes devem preservar:
  - Nunca voltar a aceitar `is_active` (nem outro campo de situação) no cadastro ou na edição de paciente.
  - Toda ação nova que muda a situação do paciente ganha método na `PatientPolicy` e teste de papel sem permissão (403) e de outra clínica (404, banco sem mudança).
  - O repository filtra por `clinic_id` mesmo quando o controller já checou.

## Alternativas descartadas

- Manter `is_active` no `PUT` e chamar `authorize('bulkInactivate')` quando o campo viesse: mistura duas permissões num endpoint só e deixa a regra escondida num `if` do controller.
- Reativar pelo `PUT` com uma checagem de papel: mesmo problema, e o `PUT` exige o formulário inteiro.
- `bulk-reactivate` simétrico ao `bulk-inactivate`: ninguém pediu reativação em massa, e a rota singular é a mais simples de proteger e de testar.
