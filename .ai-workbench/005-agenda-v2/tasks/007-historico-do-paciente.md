# Histórico completo do paciente no modal

**Tipo:** História
**Plano:** `../plans/agenda-v2.md`
**Issue:** ainda não criada

## Descrição

Quando um fisioterapeuta cobre as férias de outro, ele não consegue ver os
atendimentos que o colega fez com o paciente, porque a agenda só mostra ao fisio
as consultas dele (FR-009). Esta fatia cria um endpoint de histórico do paciente
e a aba Histórico no modal. Quem atende o paciente vê todas as consultas dele,
de qualquer profissional.

## O que construir

- **Módulo dono:** ClinicScheduling, sem migration. A rota fica no próprio
  ClinicScheduling e não consulta o módulo Patient.
- **`GET /api/clinic/patients/{patient}/appointments`** (guard `clinic`):
  paginado no padrão do projeto (`{ data: { data: [{ id, starts_at, ends_at,
  title, clinic_user_name, status }], total, per_page, current_page,
  last_page } }`), da mais recente para a mais antiga; `per_page` padrão 50,
  máximo 100. Sem `description`, sem `location` e sem dado do paciente.
- **Regra de acesso,** no Service:
  - a consulta sempre filtra por `clinic_id` do usuário autenticado;
  - se o paciente não tem nenhuma consulta nesta clínica, a resposta é 404, o
    que cobre também o paciente de outra clínica;
  - admin e secretária veem qualquer paciente que passe nessa regra;
  - o fisioterapeuta vê só se **atende** o paciente, ou seja, tem ao menos uma
    consulta própria com ele, nesta clínica, que não esteja cancelada, passada
    ou futura. Se não atende, a resposta é 404, para não revelar que o
    paciente tem consultas;
  - quem passa vê o histórico completo, com as consultas de qualquer
    profissional.
- É uma exceção à FR-009, só neste endpoint e só com esses campos. A listagem
  da agenda não muda.
- **Front:** item do histórico no `domain`, método no repositório de consultas
  com mapper e um hook. No modal, a aba "Histórico (N)" lista as consultas em
  ordem de data, com a atual destacada e a posição "Nª de N" no Resumo. A aba
  não aparece para evento do Google. Agendar, editar, mudar status e cancelar
  invalidam o histórico.

## Critérios de Aceite

- [ ] Teste: admin e secretária veem todas as consultas do paciente, de
      qualquer profissional, em ordem de data, sem `description` nem
      `location`.
- [ ] Teste: o fisio Sicrano, com uma consulta futura não cancelada com o
      paciente, vê também as consultas do fisio Fulano.
- [ ] Teste: um fisio sem consulta com o paciente recebe 404. Um fisio que só
      teve consulta cancelada com ele também recebe 404.
- [ ] Teste: um paciente sem consulta nesta clínica dá 404.
- [ ] Teste: um usuário da clínica A pedindo um paciente da clínica B recebe
      404.
- [ ] Teste: sem token, 401.
- [ ] No modal, a aba Histórico mostra as consultas com a atual destacada. Num
      evento do Google, a aba não aparece.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `003-modal-de-consulta-v2` (Modal de consulta v2 de produção).

## Notas de Implementação

- **Branch:** `feat/clinic-agenda-ds`
- **Exemplo no código:** `AppointmentService::listForUser` (regra por papel) e
  `AppointmentIndexVisibilityTest` (fisio A × fisio B, mesma clínica).
- **Skills:** `backend-clean-code`, `security`, `php-testing`,
  `architecture-paradigm-modular-monolith`, `api-client`, `frontend-ddd`.
- Ao fechar, confirmar que o `DEFERRED.md` da 002 tem a nota sobre rever a
  regra quando a tarefa 013 da 002 sair.

## Como testar na mão

1. Na clínica A, a secretária agenda duas consultas do paciente P com o fisio
   Fulano e uma futura com o fisio Sicrano.
2. Como Sicrano, abrir a consulta dele com P: a aba Histórico mostra as 3
   consultas. Chamar o endpoint direto também.
3. Como um terceiro fisio, sem consulta com P, chamar o endpoint: 404.
4. Cancelar a consulta do Sicrano e chamar de novo como Sicrano: 404.
5. Como admin da clínica B, chamar o endpoint com o id de P: 404.
