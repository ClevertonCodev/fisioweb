# Taxa de ocupação em colunas com percentual e tooltip

**Tipo:** História
**Plano:** `../plans/clinic-dashboard-ds.md`
**Issue:** ainda não criada

## Descrição

A ocupação ainda não existe no dashboard v2 (ou, se restar o gráfico antigo em algum canto, é Chart.js da v1). Esta fatia traz o bloco em colunas CSS do DS: granularidade, profissional quando o papel deixa, percentual visível e tooltip no hover e no foco.

## O que construir

- Bloco de taxa de ocupação em `/clinica`, alimentado por `GET /clinic/dashboard/occupancy-rate` (`granularity` `daily` | `weekly` | `monthly`, e `clinic_user_id` só quando `viewer.canChooseProfessional`). Sem migration, sem Chart.js neste bloco.
- Admin e secretário (quando a flag vier verdadeira) escolhem o profissional. Fisioterapeuta vê a ocupação já na própria pessoa, sem seletor.
- Cada coluna mostra o percentual arredondado a partir de `rate`. Tooltip com rótulo e valor no hover e no foco.
- Estados de carregamento, vazio e erro do bloco. Isolamento: o backend já recusa `clinic_user_id` de outra clínica; a tela só lista profissionais do summary/hook existentes.

## Critérios de Aceite

- [ ] O bloco troca entre diária, semanal e mensal e refaz a query com a granularidade escolhida.
- [ ] Admin (ou quem `canChooseProfessional`) vê o seletor de profissional; fisioterapeuta não vê.
- [ ] Cada coluna com `rate` > 0 mostra o percentual; o gatilho do tooltip contém o valor (rótulo · N% ocupado).
- [ ] Sem Chart.js neste bloco; só DS.
- [ ] Teste de UI cobre seletor ausente para fisio, troca de granularidade e o texto do percentual/tooltip.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (PHPUnit de ocupação já existentes; a tela não envia `clinic_user_id` de outro tenant).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-pagina-v2-casco-kpis-atalhos` (página v2 do dashboard: cumprimento, escopo, KPIs e atalhos)

## Notas de Implementação

- **Branch:** `feat/clinic-dashboard-ds`
- **Exemplo no código:** `resources/js/pages/clinic/dashboard-prototype/VariantA.tsx` (colunas + tooltip da A), `resources/js/components/clinic/dashboard/OccupancyRateChart.tsx` (regras atuais), `resources/js/components/ds/tooltip/DsTooltip.tsx`, `resources/js/test/api-clinic-dashboard.test.ts` (mapper, não reescrever).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `frontend-react`

## Como testar na mão

1. Como admin da clínica A em `/clinica`, abra o bloco de ocupação. Troque diária / semanal / mensal. Escolha outro profissional da clínica.
2. Passe o mouse e o teclado numa coluna: o percentual aparece na barra e no tooltip.
3. Como fisioterapeuta: sem seletor, ocupação dele.
4. Tema claro e escuro.
