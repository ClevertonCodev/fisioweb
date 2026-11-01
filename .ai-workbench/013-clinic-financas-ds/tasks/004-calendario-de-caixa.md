# Calendário de caixa com totais do servidor e lista do dia

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 13, 14, 15, 16
**Issue:** ainda não criada

## Descrição

O protótipo busca no máximo 2 páginas de 50 lançamentos e soma tudo na tela; num mês cheio o calendário erra. A abordagem é uma rota que devolve os totais por dia já somados no servidor e buscar os lançamentos de um dia só quando a pessoa toca nele.

## O que construir

- Nova `GET /clinic/finances/calendar?period=YYYY-MM` → `data: { period, days: [{ date, income, expense }] }`, só os dias com lançamento, valores líquidos, todos os status (como no protótipo). Filtro por `clinic_id`.
- A lista do dia escolhido usa a listagem que já existe com `from = to = dia`, paginada ("ver mais" quando passa de uma página).
- O calendário do protótipo C vira real: as barrinhas e os valores por dia vêm da rota nova; o dia escolhido por padrão é hoje (no mês atual) ou o primeiro dia com lançamento; anterior/seguinte e voltar para hoje.
- Sai o `useMonthTransactions` (2 páginas). Sem migration.

## Critérios de Aceite

- [x] Num mês com 150 lançamentos, os totais de cada dia batem com a soma no banco (teste PHPUnit)
- [x] Os totais são líquidos e separam entrada de saída (teste)
- [x] Outra clínica não entra na soma (teste)
- [x] Tocar num dia busca só aquele dia e mostra a lista; "ver mais" pede a próxima página (Vitest)
- [x] No celular, a lista do dia aparece embaixo do calendário (smoke)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/004-calendario-de-caixa/`

## Depende de

- `002-casca-v2-resumo-liquido` (Casca v2 real de Finanças com o resumo do mês no líquido)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/ClinicFinance/app/Repositories/FinancialTransactionRepository.php` (`incomeVsExpenseRows`), `resources/js/pages/clinic/finances/finance-prototype/VariantC.tsx`
- **Skills:** `backend-clean-code`, `php-testing`, `design-system`, `frontend-ddd`, `frontend-testing`

## Como testar na mão

1. Clínica A: criar mais de 100 lançamentos no mês (seeder ou script).
2. `/clinica/financas`: cada dia mostra o que entrou e saiu; conferir dois dias contra a API.
3. Tocar num dia: a lista daquele dia aparece ao lado (embaixo no celular).
4. Mudar de mês e voltar para hoje.
