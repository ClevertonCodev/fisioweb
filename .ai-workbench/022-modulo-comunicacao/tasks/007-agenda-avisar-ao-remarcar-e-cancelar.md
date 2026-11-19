# Agenda: avisar o paciente ao remarcar e ao cancelar consulta

**Tipo:** História
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 10, 11, 13, 20, 21, 33
**Issue:** ainda não criada

## Descrição

Sobre a base da tarefa 006, esta tarefa avisa o paciente quando a consulta muda de horário (pelo modal da consulta ou arrastando no calendário) e quando é cancelada. Editar só a observação ou o título não pode abrir o aviso: o evento de remarcação dispara em qualquer edição, então quem decide abrir o modal é a tela, comparando início e fim.

## O que construir

- **Templates no `Email`,** os dois no fuso da clínica e com o mesmo log da 002:
  - **"Consulta remarcada":**
    - assunto "Consulta remarcada para <dd/mm> às <hh:mm> · <clínica>";
    - "Sua consulta mudou de horário", só com o horário novo, sem o anterior;
    - profissional, local e "Como chegar" quando há endereço;
    - "Esse horário não dá? Ligue para a clínica: <telefone>".
  - **"Consulta cancelada":**
    - assunto "Consulta de <dd/mm> cancelada · <clínica>";
    - data, horário e profissional riscados;
    - sem botão;
    - "Para marcar um novo horário, ligue para a clínica: <telefone>".
- **Endpoint:** é o da tarefa 006, com `kind: rescheduled` e `kind: cancelled`, e as mesmas regras de clínica, papel, paciente, e-mail, status e limite.
- **Agenda (front):**
  - Depois de salvar a edição de uma consulta com paciente em que o início ou o fim mudou (pelo modal ou arrastando ou esticando no calendário), abre "Avisar o paciente?" com o tipo remarcada.
  - Editar sem mudar início nem fim não abre.
  - Depois de cancelar uma consulta com paciente, abre o modal com o tipo cancelada.
  - Mudar o status para realizada ou faltou não abre.
  - Textos prontos de WhatsApp novos para remarcada e cancelada.
- **Sem migration.**

## Critérios de Aceite

- [ ] `kind: rescheduled` numa consulta ativa e `kind: cancelled` numa cancelada respondem 202 e disparam `AppointmentEmailRequested` com o tipo certo.
- [ ] `kind: cancelled` numa consulta ativa e `kind: rescheduled` numa cancelada dão 422.
- [ ] Consulta de outra clínica dá 404.
- [ ] Com o listener (`Mail::fake`), "Consulta remarcada" mostra só o horário novo, no fuso da clínica.
- [ ] "Consulta cancelada" mostra a consulta riscada, sem botão e com o telefone da clínica.
- [ ] Arrastar uma consulta com paciente para outro horário abre o modal; editar só a observação não abre (Vitest).
- [ ] Cancelar uma consulta com paciente abre o modal com o tipo cancelada; marcar como realizada ou faltou não abre (Vitest).
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `006-agenda-avisar-ao-marcar` (endpoint, evento, listener e modal na agenda).

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:** `AgendaPage.tsx`: `persistReschedule` (arrastar e esticar), `handleSubmit` e o cancelamento.
- **Referência visual:** e-mails "consulta-remarcada" e "consulta-cancelada" da variante A na branch `prototype/022-emails`. O "Antes" riscado do protótipo saiu por decisão.
- **Skills:** `laravel-queues`, `php-testing`, `frontend-react`, `design-system`, `frontend-testing`.

## Como testar na mão

1. Na agenda da clínica A, arraste uma consulta com paciente para outro dia. Abre "Avisar o paciente?". Envie o e-mail: chega "Sua consulta mudou de horário" com o horário novo.
2. Edite só a observação da consulta e salve: o modal não abre.
3. Cancele a consulta: abre o modal. O e-mail chega riscado e com o telefone.
4. Marque outra consulta como realizada: o modal não abre.
