# Tela da agenda v2 em produção (calendário)

**Tipo:** História
**Plano:** `../plans/agenda-v2.md`
**Issue:** ainda não criada

## Descrição

Hoje a agenda v2 só existe em desenvolvimento, atrás do switcher de variantes,
e a produção mostra a v1 (shadcn). Esta fatia leva o calendário da variante A
para produção e apaga a v1 e o switcher, para que `/clinica/agenda` seja uma
tela v2 só.

O modal de consulta F do protótipo passa a ser o modal de produção do jeito que
está. A tarefa 003 troca o formulário dele por RHF + Zod. A coluna da esquerda
fica para a tarefa 002.

## O que construir

- Só SPA, área `pages/clinic` e `components/clinic/agenda`. Sem backend e sem
  migration.
- `/clinica/agenda` mostra a agenda v2 em qualquer ambiente: título "Agenda"
  (com "Agendamentos de {paciente}" quando há `?patientId=`), a barra com Hoje,
  anterior, próximo e o mês em foco, o botão "Nova consulta", o seletor de
  visão (Atendimentos, Dia, 3 dias, Semana, Mês) e o menu "Exibição" só com
  "Mostrar fins de semana", guardado em memória. O "Simular todos os status"
  sai.
- O calendário fica em altura total, com a pele DS. Cada consulta tem fundo
  suave, uma faixa na cor do status e o texto na cor do status, e mostra
  paciente, tipo, horário e profissional. O dia de hoje é destacado na cor da
  marca, e há a linha do horário atual.
- A aparência dos status v2 (tokens `--ds-*` e o rótulo "Falta" para
  `no_show`) vira um módulo de UI da agenda v2. O `STATUS_COLORS` do `domain`
  não muda.
- Funciona como na v1: clicar num horário vazio abre "Nova consulta" com aquela
  data; clicar numa consulta abre o modal; arrastar e redimensionar gravam e
  voltam se o servidor recusar; consulta concluída, cancelada ou com falta não
  arrasta; o deep-link `openNewAppointment` do dashboard abre "Nova consulta";
  `?patientId=` filtra e posiciona na próxima consulta do paciente.
- O modal F do protótipo (cabeçalho na cor do status, abas Resumo e Editar,
  status em pílulas, cancelar, abrir prontuário) vai para
  `components/clinic/agenda` sem mudar o comportamento. Sem a aba Histórico
  por enquanto, porque ela entra na 007.
- Saem a página v1, o modal v1, a visão de calendário e a coluna v1, as ações
  do Google v1, o teste do modal v1, a pasta do protótipo e o switcher. As
  ações do Google voltam em DS na 002.
- A raiz da tela tem `h-full overflow-y-auto font-ds bg-ds-surface-body
  text-ds-content-primary`. Nenhum import de `components/ui` na agenda.
- O guard e os papéis não mudam (a listagem já filtra o fisio no backend).

## Critérios de Aceite

- [ ] Em produção (`fisio-app build`), `/clinica/agenda` mostra a agenda v2,
      sem barra de variantes e sem a opção "Simular todos os status".
- [ ] As cinco visões funcionam e o "Mostrar fins de semana" esconde e mostra
      sábado e domingo.
- [ ] As consultas aparecem com a cor do status, e `no_show` aparece como
      "Falta".
- [ ] Clicar em horário vazio abre "Nova consulta" com a data e o horário
      daquele espaço, e agendar pelo modal grava e aparece no calendário.
- [ ] Arrastar e redimensionar uma consulta grava. Com o servidor recusando
      (ex.: consulta concluída), a consulta volta e aparece um toast de erro.
- [ ] A ação rápida "Agendar consulta" do dashboard abre a agenda com "Nova
      consulta" aberto. `?patientId=` filtra e posiciona na próxima consulta.
- [ ] Nenhum arquivo da agenda importa de `components/ui`, e a pasta do
      protótipo e a v1 da agenda não existem mais.
- [ ] A tela fica legível no claro e no escuro.
- [ ] `npm run types`, `npm run lint` e `npm run test` passam.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
      (a listagem continua filtrada por `clinic_id` no backend).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-agenda-ds`
- **Exemplo no código:** `VariantA` e `WideAgenda` da pasta do protótipo (a
  base a promover), e a `AgendaPage` atual (os handlers de salvar, status,
  cancelar e reagendar continuam).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`.
- As opções do FullCalendar continuam fora do componente: um objeto novo a cada
  render dispara `datesSet` em loop.
- Por decisão do usuário, não há teste automatizado de front nesta feature. O
  teste do modal v1 sai junto com o modal v1, e a tela é conferida no smoke
  test.

## Como testar na mão

1. `fisio-app build` e abrir o endereço de `fisio-app url`.
2. Entrar como admin da clínica A e abrir `/clinica/agenda`: conferir as
   visões, o fim de semana e as cores dos status.
3. Clicar num horário vazio, agendar, arrastar a consulta para outro horário e
   redimensionar.
4. Mudar o status de uma consulta para "Concluída" e tentar arrastá-la: ela não
   se move.
5. No dashboard, usar "Agendar consulta". Abrir também
   `/clinica/agenda?patientId=<id>`.
6. Trocar para o tema escuro e repetir a olhada.
7. Entrar como fisioterapeuta e conferir que só aparece a agenda dele.
