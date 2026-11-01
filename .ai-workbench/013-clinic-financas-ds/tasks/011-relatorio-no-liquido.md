# Relatório no líquido com a % por tipo

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 41, 42, 43
**Issue:** ainda não criada

## Descrição

Os relatórios da API somam o bruto, e a % do `category-breakdown` é sobre entradas e saídas juntas; o protótipo recalcula na tela. A abordagem é passar os relatórios ao líquido e calcular a % dentro do tipo no servidor.

## O que construir

- `reports/summary`, `income-vs-expense`, `category-distribution`, `monthly-comparison` e `category-breakdown` somam `net_amount`.
- `category-breakdown` devolve a % de cada categoria dentro do seu tipo (entrada sobre entradas, saída sobre saídas).
- A aba Relatório vira real: dia a dia, últimos 12 meses, por categoria e tabela, sem recalcular a %; entradas em `--ds-chart-c1` e saídas em `--ds-chart-negative`, nos dois temas.
- Sem migration.

## Critérios de Aceite

- [x] Com taxa, cada relatório soma o líquido (teste por rota)
- [x] % por tipo: duas categorias de entrada 60/40 e uma de saída 100% (teste)
- [x] Outra clínica não entra em nenhum relatório (teste)
- [x] A tela mostra a % que vem da API (Vitest)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/011-relatorio-no-liquido/`

## Depende de

- `002-casca-v2-resumo-liquido` (Casca v2 real de Finanças)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/ClinicFinance/app/Services/FinanceReportService.php`, `resources/js/pages/clinic/finances/finance-prototype/ReportTab.tsx`
- **Skills:** `backend-clean-code`, `php-testing`, `design-system`, `dataviz`, `frontend-testing`

## Como testar na mão

1. Clínica A: duas entradas (R$ 100 com R$ 3 de taxa; R$ 50) e uma saída.
2. Aba Relatório: os totais usam R$ 97 + R$ 50; a % das entradas soma 100% só entre entradas.
3. Trocar para o tema escuro: as cores continuam distinguíveis.
