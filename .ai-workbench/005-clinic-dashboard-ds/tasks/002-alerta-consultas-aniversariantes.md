# Alerta da próxima sessão, consultas de hoje e aniversariantes

**Tipo:** História
**Plano:** `../plans/clinic-dashboard-ds.md`
**Issue:** ainda não criada

## Descrição

O casco v2 ainda não mostra o dia. Quem tem consulta hoje precisa ver a próxima sessão no topo, a lista do restante e os aniversariantes do mês — inclusive o WhatsApp quando houver telefone. Sem consulta hoje, o alerta some; o card de próximas consultas cobre o vazio.

## O que construir

- Mesma tela `/clinica`, mesmos dados do summary (`upcomingAppointments` e `birthdays`). Sem endpoint novo, sem migration.
- Alerta de marca (estilo da variante B, no layout da A) com o primeiro item da lista de hoje: foto ou iniciais, nome, título, horário, status e ação “Abrir agenda”. Se a lista estiver vazia, o alerta não entra no documento.
- Card das próximas consultas de hoje (horário, nome, status) e atalho para a agenda completa.
- Card dos aniversariantes do mês; ação de mensagem só habilitada quando `canMessage` (há telefone). O link continua sendo `wa.me`, como hoje.
- Estados vazio e de carregamento de cada card. Papéis: a lista já vem recortada pelo `scope` e pelo papel no backend.
- Isolamento: nomes e telefones só da clínica da sessão. Sem `clinic_id` na query da tela.

## Critérios de Aceite

- [ ] Com pelo menos uma consulta hoje, o alerta mostra nome, horário, status e a ação para a agenda.
- [ ] Com a lista vazia, o alerta não está no documento; o card de consultas mostra o estado vazio.
- [ ] A lista lista as consultas de hoje com horário e status; há caminho para a agenda completa.
- [ ] Aniversariante com telefone: link WhatsApp. Sem telefone: ação desabilitada.
- [ ] Teste de UI cobre os dois casos do alerta (com e sem consulta) e o WhatsApp com/sem telefone.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (prova nos PHPUnit do dashboard; a tela não busca id de outra clínica).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-pagina-v2-casco-kpis-atalhos` (página v2 do dashboard: cumprimento, escopo, KPIs e atalhos)

## Notas de Implementação

- **Branch:** `feat/clinic-dashboard-ds`
- **Exemplo no código:** `resources/js/pages/clinic/dashboard-prototype/NextSessionHero.tsx` (referência visual), `resources/js/components/clinic/dashboard/UpcomingAppointments.tsx` e `MonthBirthdays.tsx` (comportamento atual), `resources/js/components/ds/alert/DsAlert.tsx` e `resources/js/components/ds/list/DsList.tsx`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `frontend-react`

## Como testar na mão

1. Como admin da clínica A, com pelo menos uma consulta hoje, abra `/clinica`: o alerta mostra a próxima sessão; abaixo, a lista e os aniversariantes.
2. Clique em “Abrir agenda” e no atalho da lista: vão para a agenda.
3. Se houver aniversariante com telefone, o WhatsApp abre o `wa.me`; sem telefone, o botão não dispara.
4. Num dia (ou usuário) sem consulta hoje: o alerta some; o card de consultas diz que não há agenda.
5. Tema claro e escuro.
