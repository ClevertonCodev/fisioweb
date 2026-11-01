# "A receber" e "a pagar" com o mês e os atrasados

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 17, 18
**Issue:** ainda não criada

## Descrição

No protótipo, as pendências vêm só do mês na tela: um pagamento de setembro atrasado some em outubro. A abordagem é buscar as pendências no servidor até o fim do mês na tela, o que inclui todas as atrasadas.

## O que construir

- A listagem ganha o filtro `overdue_until=YYYY-MM-DD`: com `status=pendente`, devolve as pendências com data até esse dia (o fim do mês na tela), da mais antiga para a mais nova. Paginada.
- "A receber" (entradas) e "a pagar" (saídas) mostram data, descrição, valor líquido e o selo "Atrasado" quando a data é antes de hoje; a data mostra o mês quando é de outro mês.
- O total de cada lista vem do servidor (soma líquida das pendências do filtro), não da página carregada.
- O botão de baixa continua stub até a 007. Sem migration.

## Critérios de Aceite

- [x] Em outubro, uma pendência de setembro aparece com "Atrasado" (teste PHPUnit + Vitest)
- [x] Uma pendência de dezembro não aparece em outubro (teste)
- [x] Recebidos e pagos não aparecem (teste)
- [x] O total bate com a soma líquida mesmo com mais de uma página (teste)
- [x] Outra clínica não aparece (teste)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/005-pendencias-com-atrasados/` (a revisão adversária roda no fim da feature, como combinado)

## Depende de

- `004-calendario-de-caixa` (Calendário de caixa com totais do servidor e lista do dia)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/ClinicFinance/app/Repositories/FinancialTransactionRepository.php` (`applyFilters`), `resources/js/pages/clinic/finances/finance-prototype/VariantC.tsx` (`pendingList`)
- **Skills:** `backend-clean-code`, `php-testing`, `design-system`, `frontend-testing`

## Como testar na mão

1. Clínica A: uma entrada pendente em setembro e uma saída pendente em outubro.
2. Abrir outubro: a entrada de setembro aparece em "a receber" com "Atrasado" e a data com o mês; a saída aparece em "a pagar".
3. Abrir novembro: as duas continuam (atrasadas).
