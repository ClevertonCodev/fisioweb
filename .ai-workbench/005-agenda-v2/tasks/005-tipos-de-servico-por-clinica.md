# Tipos de serviço por clínica com duração padrão

**Tipo:** História
**Plano:** `../plans/agenda-v2.md`
**Issue:** ainda não criada

## Descrição

Os atalhos de tipo de serviço do modal são fixos no front e só preenchem o
nome. Esta fatia cria a lista de tipos de cada clínica, com uma duração padrão
por tipo. Toda clínica começa com 5 tipos padrão. Os atalhos do modal passam a
vir da API, e o clique preenche o tipo e ajusta o término. A edição da lista
fica para a 006.

## O que construir

- **Módulo dono:** ClinicScheduling. Migration nova `clinic_service_types`
  (`clinic_id`, `name`, `duration_minutes`, `position`, timestamps,
  `deleted_at`).
- **`GET /api/clinic/service-types`** (guard `clinic`): devolve
  `{ data: [{ id, name, duration_minutes, position }] }` em ordem de
  `position`. Se a clínica não tem nenhuma linha, nem apagada, o service grava
  os 5 padrão numa transação e devolve a lista: Avaliação 60, Sessão 45,
  Retorno 30, Reavaliação 60 e Sessão de Pilates 60. A transação precisa
  aguentar duas leituras simultâneas sem duplicar a lista.
- **Permissão:** `ServiceTypePolicy::viewAny` permite os três papéis.
- **Isolamento:** o Repository sempre filtra por `clinic_id` do usuário
  autenticado.
- **Front:** entidade `ServiceType` no `domain`, port + hook + repositório com
  mapper. No modal, os atalhos vêm da API. Clicar num atalho preenche o tipo e
  ajusta o término para início + duração do tipo. O usuário ainda pode mudar o
  tipo, o término e digitar um tipo que não está na lista. As consultas que já
  existem não mudam (o `title` continua texto livre).

## Critérios de Aceite

- [ ] Teste: a primeira leitura de uma clínica nova devolve os 5 padrão, com
      as durações e na ordem do plano. A segunda leitura não duplica.
- [ ] Teste: uma clínica que já tem linhas (inclusive só apagadas) não recebe
      os padrão de novo.
- [ ] Teste: os três papéis recebem 200 no `GET`.
- [ ] Teste: a clínica B não vê os tipos da clínica A.
- [ ] Teste: sem token, 401.
- [ ] No modal, clicar em "Retorno" preenche o tipo e põe o término 30 min
      depois do início. Depois, dá para mudar o término à mão.
- [ ] Um tipo digitado que não está na lista é salvo normalmente.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `003-modal-de-consulta-v2` (Modal de consulta v2 de produção).

## Notas de Implementação

- **Branch:** `feat/clinic-agenda-ds`
- **Exemplo no código:** o padrão Repository + interface + Service do
  ClinicScheduling (`AppointmentRepository`, `AppointmentService`) e
  `AppointmentAuthorizationTest`.
- **Skills:** `backend-clean-code`, `laravel-eloquent` (soft delete,
  transação), `php-testing`, `security`, `api-client`, `frontend-ddd`.

## Como testar na mão

1. `fisio-app migrate`.
2. Como secretária de uma clínica sem tipos, chamar o `GET` duas vezes: 5
   tipos, sem duplicar.
3. Com um usuário da clínica B, chamar o `GET`: vêm os tipos da B, nunca os da
   A.
4. No modal "Nova consulta", clicar em "Avaliação": término 60 min depois.
   Mudar o término e salvar.
