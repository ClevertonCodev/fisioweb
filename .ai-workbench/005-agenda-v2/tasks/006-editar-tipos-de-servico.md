# Editar os tipos de serviço no modal

**Tipo:** História
**Plano:** `../plans/agenda-v2.md`
**Issue:** ainda não criada

## Descrição

Cada clínica precisa adaptar a lista de tipos de serviço. Esta fatia deixa o
admin e a secretária adicionar, renomear, mudar a duração, remover e reordenar
os tipos no próprio modal de consulta. Se apagarem todos, os padrão não voltam.

## O que construir

- **Módulo dono:** ClinicScheduling. Sem migration nova, porque usa a tabela da
  005.
- **`PUT /api/clinic/service-types`** (guard `clinic`) com
  `{ items: [{ id?, name, duration_minutes }] }` substitui a lista inteira:
  - a ordem do array vira `position`;
  - um item com `id` é atualizado e um item sem `id` é criado;
  - uma linha que não veio é apagada com soft delete;
  - devolve a lista nova no envelope `data`.
- **Validação:** `name` obrigatório, até 100 caracteres, sem repetição na lista
  (ignorando maiúsculas); `duration_minutes` inteiro de 5 a 480; até 30 itens;
  lista vazia aceita.
- **Permissão:** `ServiceTypePolicy::manage` permite admin (via
  `Gate::before`) e secretária. Fisioterapeuta recebe 403.
- **Isolamento:** um `id` que não é da clínica do usuário dá 422 e nunca é
  atualizado nem apagado. A clínica A nunca altera linha da B.
- **Front:**
  - para admin e secretária, um link "Editar tipos" ao lado dos atalhos abre um
    editor dentro do modal, com uma linha por tipo (nome e duração) e os botões
    remover, subir e descer, mais "Adicionar tipo";
  - salvar manda a lista inteira e invalida a lista de tipos;
  - o fisioterapeuta não vê o link (`permissions.ts`, só UX);
  - o rascunho do agendamento não se perde ao abrir e fechar o editor.

## Critérios de Aceite

- [ ] Teste: o `PUT` cria, renomeia, muda a duração, reordena e remove. A
      lista devolvida reflete tudo.
- [ ] Teste: depois de um `PUT` com lista vazia, o `GET` devolve lista vazia
      (os padrão não voltam).
- [ ] Teste: nome repetido (ignorando maiúsculas), duração fora de 5 a 480 e
      mais de 30 itens dão 422.
- [ ] Teste: admin e secretária recebem 200. O fisioterapeuta recebe 403, e a
      lista não muda.
- [ ] Teste: um `id` da clínica B no `PUT` da clínica A dá 422, e a linha da B
      não muda.
- [ ] No modal, a secretária renomeia "Sessão" para "Sessão individual", muda
      para 50 min e sobe para o primeiro lugar. O atalho novo aparece e ajusta
      o término para 50 min.
- [ ] O fisioterapeuta não vê "Editar tipos".
- [ ] Uma consulta antiga com o tipo "Sessão" continua mostrando "Sessão".
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `005-tipos-de-servico-por-clinica` (Tipos de serviço por clínica).

## Notas de Implementação

- **Branch:** `feat/clinic-agenda-ds`
- **Exemplo no código:** `AppointmentPolicy` (papéis admin/secretária) e
  `AppointmentAuthorizationTest`. No front, `permissions.ts`.
- **Skills:** `backend-clean-code`, `laravel-eloquent`, `php-testing`,
  `security`, `design-system`, `frontend-ddd`.
- Reordenar com os botões subir e descer, sem biblioteca de arrastar.

## Como testar na mão

1. Como secretária da clínica A, abrir "Nova consulta", depois "Editar tipos":
   renomear, mudar a duração, reordenar, adicionar um tipo e remover outro.
   Salvar.
2. Conferir os atalhos novos e a duração ao clicar.
3. Apagar todos e salvar. Recarregar: a lista continua vazia.
4. Como fisioterapeuta, abrir o modal: não há "Editar tipos". Chamar o `PUT`
   direto: 403.
5. Como admin da clínica B, mandar um `PUT` com um `id` da A: 422.
