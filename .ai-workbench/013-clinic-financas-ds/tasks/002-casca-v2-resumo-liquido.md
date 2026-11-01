# Casca v2 real de Finanças com o resumo do mês no líquido

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 7, 12
**Issue:** ainda não criada

## Descrição

O protótipo C vive numa pasta descartável e só abre com `?variant=C`, e o resumo do mês da API soma o valor bruto. A abordagem é promover a casca do protótipo (abas, seletor de mês, olho, resumo) a código de verdade em `pages/clinic/finances/`, como padrão das três rotas, e passar o `summary` para o líquido.

## O que construir

- A casca v2 (abas `?aba=lancamentos|relatorio|configuracoes`, seletor de mês, voltar para hoje, olho que esconde valores, botões "Nova entrada", "Nova saída" e "Exportar", resumo do mês) passa a ser o padrão de `/clinica/financas`, `/clinica/financas/categorias` e `/clinica/financas/lixeira`, sem `?variant=`. A v1 ainda existe no código, mas não abre mais (sai na 012).
- As partes ainda não feitas (calendário, modal, configurações, relatório) continuam com o comportamento do protótipo até a tarefa delas.
- `GET /clinic/finances/summary` passa a somar `net_amount`: disponível = saldo inicial + líquido recebido − líquido pago; previsão = disponível + líquido pendente a receber − líquido pendente a pagar.
- O olho guarda a preferência como a v1 já faz (`use-finance-values-visibility`).
- Contêiner `max-w-(--breakpoint-ds-xl)`, componentes `@/components/ds`. Sem migration.

## Critérios de Aceite

- [x] Com um lançamento de R$ 100 com R$ 3 de taxa recebido, o `summary` mostra R$ 97 recebido e no disponível (teste PHPUnit)
- [x] A previsão soma os pendentes no líquido (teste)
- [x] `/clinica/financas` abre a casca v2 sem `?variant=`; `?aba=relatorio` e `?aba=configuracoes` abrem a aba certa (Vitest)
- [x] O olho esconde e mostra os valores do resumo (Vitest)
- [x] O seletor de mês troca o `period` do resumo
- [x] Funciona no celular (smoke 390 px)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/002-casca-v2-resumo-liquido/`

## Depende de

- `001-acesso-secretaria-financas` (Secretária entra em Finanças, fisioterapeuta não)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `resources/js/pages/clinic/finances/finance-prototype/FinancePrototype.tsx`, `modules/ClinicFinance/app/Services/FinanceSummaryService.php`
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `backend-clean-code`, `php-testing`

## Como testar na mão

1. Clínica A, administrador, `/clinica/financas`: abre a tela v2 sem `?variant=`.
2. Lançar (pelo seeder ou API) R$ 100 no cartão com R$ 3 de taxa, recebido: o resumo mostra R$ 97.
3. Tocar no olho: os valores viram máscara; recarregar mantém.
4. Clínica B: o resumo não muda com o lançamento da A.
