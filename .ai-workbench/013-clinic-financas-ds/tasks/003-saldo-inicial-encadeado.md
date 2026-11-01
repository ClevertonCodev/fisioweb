# Saldo inicial encadeado do mês anterior, com "calculado/digitado"

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 8, 9, 10, 11
**Issue:** ainda não criada

## Descrição

Hoje o saldo inicial é R$ 0 em todo mês em que ninguém digita um valor, e cada mês fica isolado. A abordagem é calcular no servidor o saldo a partir do último mês digitado mais o líquido realizado desde então, dizer a origem do valor e permitir voltar ao calculado.

## O que construir

- `summary`: sem valor digitado no mês, o saldo inicial é o último valor digitado antes dele mais o líquido realizado (recebido − pago) do início desse mês até o fim do mês anterior ao pedido. Sem nenhum digitado, é todo o realizado antes do mês. Uma consulta agregada, sem laço de meses. Novo campo `opening_balance_source` = `typed` | `computed`.
- `PUT opening-balance` continua gravando o valor digitado (só administrador).
- Nova `DELETE /clinic/finances/opening-balance?period=YYYY-MM`, só administrador: apaga o digitado do mês e volta ao calculado.
- Resumo do mês: mostra "calculado do mês anterior" ou "digitado". O botão de editar e o modal real de saldo inicial aparecem só para o administrador; o modal tem "voltar ao calculado" quando o mês é digitado.
- Tudo filtrado por `clinic_id`. Sem migration.

## Critérios de Aceite

- [x] Sem nenhum digitado: o saldo de novembro = líquido recebido − pago de tudo antes de novembro (teste)
- [x] Com digitado em setembro: o saldo de novembro = digitado de setembro + realizado de setembro e outubro (teste)
- [x] Mês com digitado devolve o digitado e `opening_balance_source = typed` (teste)
- [x] `DELETE opening-balance` volta ao calculado; secretária recebe 403 (teste)
- [x] Pendentes não entram no encadeamento (teste)
- [x] A tela mostra "calculado/digitado", e a secretária não vê o botão de editar (Vitest)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/003-saldo-inicial-encadeado/`

## Depende de

- `002-casca-v2-resumo-liquido` (Casca v2 real de Finanças com o resumo do mês no líquido)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/ClinicFinance/app/Services/FinanceSummaryService.php`, `modules/ClinicFinance/app/Repositories/PeriodOpeningBalanceRepository.php`, `resources/js/pages/clinic/finances/finance-prototype/modals.tsx`
- **Skills:** `backend-clean-code`, `laravel-eloquent`, `php-testing`, `design-system`, `frontend-testing`

## Como testar na mão

1. Clínica A, administrador: digitar R$ 1.000 em setembro; lançar R$ 200 recebido em setembro e R$ 50 pago em outubro.
2. Abrir novembro: saldo inicial R$ 1.150, "calculado do mês anterior".
3. Em novembro, digitar R$ 900: aparece "digitado"; "voltar ao calculado" retorna a R$ 1.150.
4. Secretária: vê o saldo sem o botão de editar.
