# Coluna da esquerda da agenda (flutuante, fixa e gaveta)

**Tipo:** História
**Plano:** `../plans/agenda-v2.md`
**Issue:** ainda não criada

## Descrição

A agenda v2 tem uma coluna de apoio com busca, minicalendário, resumo por
status, agendas por profissional e o Google Calendar. No desktop, ela fica
escondida numa alça na borda para dar a tela inteira ao calendário, e pode ser
fixada. Abaixo de `lg`, o protótipo perdia a coluna inteira, inclusive o botão
de conectar o Google. Esta fatia traz a coluna para produção e resolve as telas
menores com uma gaveta.

## O que construir

- Só SPA (`components/clinic/agenda`). Sem backend.
- Um componente de coluna só, usado em três lugares:
  - **Flutuante** (`lg+`, padrão): uma faixa na borda com a alça "FILTROS".
    Abre por cima do calendário ao passar o mouse e fecha ao sair, mas não
    fecha com o foco dentro (por exemplo, digitando na busca).
  - **Fixada** (`lg+`): o alfinete fixa a coluna, o calendário encolhe para dar
    lugar a ela e o FullCalendar recalcula a largura. Soltar volta ao modo
    flutuante. O estado fica em memória.
  - **Gaveta** (abaixo de `lg`): um botão "Filtros" na barra da agenda abre a
    mesma coluna num `DsDrawer`.
- Conteúdo:
  - busca por paciente, tipo ou profissional (sem acento, sem diferenciar
    maiúsculas);
  - minicalendário que acompanha o calendário grande e navega até o dia
    clicado;
  - resumo "N consultas no período" e a contagem por status, das consultas
    visíveis no período em foco;
  - "Visualizar agendas", com uma caixa por profissional, escondida para o
    fisioterapeuta;
  - ações do Google Calendar em DS (conectar, atualizar, desconectar), com os
    mesmos hooks da v1, e o toast de retorno do OAuth (`?google=`), que antes
    era da v1.
- A busca e as agendas desmarcadas filtram o calendário e o resumo.
- Os papéis não mudam: o fisio continua recebendo só a própria agenda da API.

## Critérios de Aceite

- [ ] No desktop, a alça abre a coluna ao passar o mouse, e ela fecha ao sair,
      exceto com o foco na busca.
- [ ] O alfinete fixa a coluna, o calendário se ajusta sem sobrar nem faltar
      espaço, e soltar volta ao modo flutuante.
- [ ] Abaixo de 1024px, o botão "Filtros" abre a coluna numa gaveta com o
      mesmo conteúdo.
- [ ] A busca filtra o calendário e o resumo. Clicar num dia do minicalendário
      leva o calendário até ele.
- [ ] O resumo conta as consultas do período visível, no total e por status.
- [ ] Admin e secretária veem "Visualizar agendas", e desmarcar um
      profissional esconde as consultas dele. O fisioterapeuta não vê a seção.
- [ ] Conectar, atualizar e desconectar o Google funcionam pela coluna, e o
      retorno do OAuth mostra o toast de sucesso ou de erro.
- [ ] A coluna fica legível no claro e no escuro.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-tela-da-agenda-v2` (Tela da agenda v2 em produção).

## Notas de Implementação

- **Branch:** `feat/clinic-agenda-ds`
- **Exemplo no código:** `AgendaRail`, `VariantA` e `DsGoogleCalendarActions`
  (no histórico da 001, no commit em que o protótipo ainda existia) e o
  `AgendaGoogleCalendarActions` v1 para o toast `?google=`. Gaveta: o
  hamburger da topbar (feature 004).
- **Skills:** `design-system`, `frontend-react`.

## Como testar na mão

1. `fisio-app build` e abrir `/clinica/agenda` como admin da clínica A.
2. Passar o mouse na alça, digitar na busca, sair com o mouse (a coluna fica
   aberta), clicar fora (fecha).
3. Fixar com o alfinete e conferir a largura do calendário. Soltar.
4. Desmarcar um profissional e ver as consultas dele sumirem do calendário e do
   resumo.
5. Reduzir a janela abaixo de 1024px e abrir "Filtros".
6. Conectar o Google e ver o toast na volta.
7. Entrar como fisioterapeuta: a seção "Visualizar agendas" não aparece.
