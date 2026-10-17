# Dashboard da clínica no design system v2

Data: 2026-10-17
Fonte: conversa + protótipo em `/clinica?variant=` + skill `refinar`

## Problema

A clínica já entra pelo topbar do design system v2 (Poppins, azul da marca, tema claro/escuro), mas o dashboard ainda é a tela v1: cards shadcn, Chart.js e tipografia Inter. A pessoa sente dois produtos no mesmo painel. No protótipo, a variante A (com o alerta da próxima sessão da B) resolveu isso; ainda não é o `/clinica` de verdade.

## Solução

O dashboard real de `/clinica` passa a ser a variante A: mesma informação de hoje, desenhada só com o DS v2. A data fica em caixa normal. Quando há consulta hoje, um alerta de marca mostra a próxima sessão. Ocupação vira colunas com percentual visível e tooltip. Captação vira barras por origem, cada uma com os três anos. Sem consulta hoje, o alerta some — o card de próximas consultas cobre o vazio.

## Histórias de Usuário

1. Como profissional da clínica, quero abrir `/clinica` e ver o dashboard no visual do topbar (Poppins, tokens `--ds-*`, tema claro e escuro), para o painel parecer um produto só.
2. Como admin da clínica, quero o cumprimento com meu primeiro nome, a data do dia em letra normal e o resumo da clínica, para me orientar sem ler caixa alta de protótipo.
3. Como admin da clínica, quero alternar “Toda a clínica” e “Somente meus”, para os números e listas acompanharem o escopo que já existe hoje.
4. Como fisioterapeuta, quero o dashboard já no meu recorte, sem o toggle de escopo, para não ver controle que o backend não me dá.
5. Como qualquer papel da clínica, quero quatro KPIs (pacientes ativos, consultas hoje, programas ativos, exercícios disponíveis), para um relance do dia.
6. Como qualquer papel da clínica, quero atalhos para novo paciente, agendar consulta, criar programa e ver exercícios, para chegar na ação sem procurar no menu.
7. Como profissional com consulta hoje, quero um alerta da próxima sessão (foto, nome, título, horário, status e “Abrir agenda”), para saber quem entra agora sem descer a página.
8. Como profissional sem consulta hoje, quero que esse alerta não ocupe espaço, para o dashboard não gritar “vazio” duas vezes — o card de próximas consultas já diz que não há agenda.
9. Como profissional da clínica, quero a lista das próximas consultas de hoje com horário e status, para conferir o restante do dia.
10. Como profissional da clínica, quero ir da lista para a agenda completa, para ajustar o que o alerta não cobre.
11. Como profissional da clínica, quero os aniversariantes do mês e, quando houver telefone, mandar mensagem no WhatsApp, para o gesto de hoje não se perder no visual novo.
12. Como admin ou secretário, quero escolher o profissional na taxa de ocupação, para ver a agenda de cada um.
13. Como fisioterapeuta, quero a ocupação já na minha pessoa, sem seletor de colega, para não furar o recorte do papel.
14. Como qualquer papel da clínica, quero trocar a ocupação entre diária, semanal e mensal, para o mesmo recorte de hoje.
15. Como qualquer papel da clínica, quero ver o percentual em cada coluna da ocupação e, no hover ou no foco, um tooltip com o rótulo e o valor, para não adivinhar a altura da barra.
16. Como qualquer papel da clínica, quero a captação por origem em barras, com o total, o percentual e os três anos lado a lado em cada origem, para não perder a comparação que o gráfico antigo tinha.
17. Como admin ou secretário, quero o feed de atividade recente da clínica hoje, para acompanhar o que a equipe fez.
18. Como fisioterapeuta, quero que o feed de atividade não apareça, para não ver dado que a API já me nega.
19. Como profissional da clínica, quero estados de carregamento, vazio e erro em cada bloco, para saber o que falhou sem a página inteira sumir.
20. Como profissional da clínica, quero que agenda, pacientes, programas e finanças continuem como estão, para esta entrega não virar migração de todas as telas.
21. Como quem testa em outra clínica, quero os mesmos recortes de sempre (números e listas só da minha clínica), para o visual novo não afrouxar isolamento.
22. Como desenvolvedor, quero `/clinica` sem barra de protótipo e sem as variantes B, C e Original, para ninguém confundir rascunho com produto.

## Decisões de Implementação

- Dono do dado continua o módulo Clinic (agregado do dashboard, ocupação, captação, atividades). ClinicScheduling já alimenta ocupação e consultas; TreatmentProgram alimenta programas ativos; Patient alimenta pacientes e aniversariantes. Nenhum contrato novo entre módulos.
- Só muda a tela `/clinica` no SPA da clínica. O topbar já é v2. Agenda, pacientes, programas, exercícios, finanças e usuários ficam v1.
- Sem migration, sem conversão de dado, sem job, sem cache novo, sem feature de plano extra.
- Endpoints iguais, guard `clinic`, envelope `data`:
  - `GET /clinic/dashboard` — query opcional `scope` (`clinic` | `mine`); devolve viewer, cards, upcoming_appointments, birthdays.
  - `GET /clinic/dashboard/occupancy-rate` — `granularity` (`daily` | `weekly` | `monthly`) e `clinic_user_id` quando o papel pode escolher.
  - `GET /clinic/dashboard/patient-acquisition` — query `scope`; devolve `years`, `sources` (com `per_year`, `total`, `percent_total`).
  - `GET /clinic/dashboard/activities` — 403 para quem `can_view_activities` é falso.
- Papéis: o backend continua a fonte. A tela só obedece `viewer.canToggleScope`, `canChooseProfessional` e `canViewActivities`. Admin vê toggle e atividades; fisioterapeuta não; secretário segue as flags que a API já manda.
- Isolamento: nada muda. Toda query já filtra `clinic_id` da sessão. Occupação recusa `clinic_user_id` de outra clínica. Testes PHPUnit de isolamento permanecem a prova; esta feature não os reescreve.
- A tela v2 não importa `components/ui`. Tokens só `ds` e classes com `dsCn`. Raiz do dashboard: fundo body do DS, Poppins, texto do DS. O layout da clínica não ganha fundo DS global (outras páginas ainda são v1).
- O alerta da próxima sessão usa o primeiro item de `upcomingAppointments` (já é a agenda de hoje). Sem item, não renderiza.
- Occupação: colunas CSS do DS, não Chart.js. Percentual arredondado a partir de `rate`. Tooltip no hover e no foco.
- Captação: barras do DS por origem; cada origem mostra os valores de `perYear` para os `years` devolvidos (três anos). Sem Chart.js neste bloco.
- Código do protótipo não vai para produção como está: reescrever nos widgets da clínica com a mesma disciplina das outras telas v2 (teste, estados, papéis). Depois, apagar o switcher, as variantes B/C/O e os widgets shadcn do dashboard que ninguém mais usar.
- Sem ADR: não há fronteira nova de módulo.

## Fatias Verticais

1. **Página v2 no ar.** `/clinica` deixa de montar o protótipo. A página usa só DS: cumprimento, data em caixa normal, toggle de escopo, KPIs e ações rápidas. Em produção e em dev é a mesma tela. Dá para abrir logado e ver o casco novo.

2. **O dia: alerta, consultas e aniversariantes.** Entra o alerta da próxima sessão (some se a lista de hoje estiver vazia), a lista de consultas e os aniversariantes com WhatsApp quando `canMessage`. Dá para conferir o caso com consulta, o caso sem consulta, e outra clínica sem vazar nome.

3. **Ocupação em colunas.** O bloco de taxa de ocupação sai do Chart.js: granularidade, seletor de profissional só quando a flag deixa, percentual na coluna e tooltip. Dá para passar o mouse num dia e ler o valor.

4. **Captação com três anos.** O bloco de captação sai do Chart.js: uma linha por origem, total, %, e os três anos visíveis. Dá para comparar 2024/2025/2026 sem tabela antiga.

5. **Atividades e limpeza.** Feed de atividade só quando a flag deixa; fisioterapeuta não vê o bloco e não dispara a query. Some o switcher, as variantes do protótipo e os cards shadcn do dashboard que ficarem órfãos. Dá para navegar `/clinica` sem `?variant=` e sem misturar bibliotecas na tela.

## Testes

- Frontend: `npm run test` (Vitest + RTL), no estilo de `ClinicTopbar.test.tsx` e `ExercisesPage.test.tsx`: `MemoryRouter`, `vi.mock` do AuthContext e dos hooks/repositório, asserts em português.
- O mapper do dashboard já está coberto em `api-clinic-dashboard.test.ts`; não precisa reescrever. Backend de isolamento e agregados já está em `modules/Clinic/tests/Feature/Dashboard/` (`actingAs` no guard `clinic`, `RefreshDatabase`); esta feature não mexe neles — só roda a suíte se o diff tocar PHP (não deve).
- Comportamentos na tela:
  - A página do dashboard não importa componentes shadcn.
  - Admin vê toggle de escopo, seletor de profissional na ocupação e feed de atividades.
  - Fisioterapeuta não vê toggle, não vê o feed e não dispara a query de atividades.
  - Com `upcomingAppointments` preenchido, o alerta mostra nome, horário e ação para a agenda.
  - Com lista vazia, o alerta não está no documento; o vazio das consultas aparece no card.
  - Occupação: cada coluna com `rate` > 0 mostra o percentual; o gatilho do tooltip contém o valor.
  - Captação: cada origem mostra os três anos devolvidos pela API.
  - Aniversariante sem telefone: ação de mensagem desabilitada; com telefone, o link WhatsApp existe.
  - Escopo “Somente meus” refaz o summary com `scope=mine` (assert no mock da query, não no PHP).
- Isolamento de outra clínica: prova continua nos testes PHPUnit existentes do dashboard. O teste de tela usa fixture de uma clínica e não inventa um segundo tenant no SPA.

## Fora do Escopo

- Qualquer tela além de `/clinica` (agenda, pacientes, programas, exercícios, finanças, usuários, login).
- Dashboard do admin master.
- Variantes B e C do protótipo, barra `?variant=` e o dashboard original shadcn como opção.
- Chart.js na ocupação e na captação deste dashboard.
- Mudança de regra, Policy, migration, job, WhatsApp de verdade além do `wa.me` que já existe, Google Calendar, PDF.
- Mostrar a “próxima consulta” que não é de hoje.
- Alerta vazio convidando a agendar quando não há sessão.
- Fundo DS global no `ClinicLayout` (quebraria as outras páginas v1).

## Notas

- A skill `design-system` manda: uma tela v2 não mistura `components/ui`. O `ClinicLayout` ainda envolve o app da clínica com o TooltipProvider da v1 — não é desta feature consertar isso; o conteúdo do dashboard não usa esse catálogo.
- O `ClinicLayout` já aplica `font-ds` (Poppins) no casco. A página do dashboard reforça tokens de superfície e texto do DS na própria raiz.
- Reescrever a partir da A, não copiar o arquivo de protótipo para produção: o rascunho não tem a disciplina de teste nem os estados que a Definição de Pronto pede.
