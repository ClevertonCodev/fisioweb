# Lançar, editar e excluir de verdade

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 19, 20, 21, 22, 23, 24, 25, 26, 27
**Issue:** ainda não criada

## Descrição

O modal de lançamento do protótipo só mostra o toast "Protótipo: não foi salvo". A abordagem é ligar o modal às rotas que já existem, com validação do servidor no campo, taxa em R$ ou % e as categorias mais usadas vindas do servidor.

## O que construir

- "Nova entrada" e "Nova saída" abrem o modal no tipo certo; tocar num lançamento (dia, pendências) abre o modal de edição.
- Salvar chama `POST`/`PUT /clinic/finances/transactions`; excluir chama `DELETE` (vai para a lixeira) com confirmação.
- Taxa da maquininha (cartão de crédito e débito, ou quando já tem taxa): seletor R$ / %. Em %, a tela calcula os reais arredondados em centavos e manda `fee_amount` em reais; mostra o líquido. A API já recusa taxa maior que o valor.
- Categorias mais usadas em chips: `category-breakdown` do mês na tela (`count` por categoria e tipo), só as ativas; as outras numa lista com busca.
- Form com React Hook Form + Zod (vários campos). Erros 422 do servidor aparecem no campo.
- Depois de salvar, editar ou excluir: invalida calendário, lista do dia, pendências, resumo e relatório.
- Sem migration.

## Critérios de Aceite

- [x] Lançar entrada e saída grava de verdade e aparecem no calendário, no dia e no resumo (Vitest + smoke)
- [x] Taxa em %: 3% de R$ 100 manda `fee_amount = 3.00` e mostra líquido R$ 97,00 (Vitest)
- [x] Sem valor, descrição ou categoria: mensagem no campo; taxa maior que o valor: erro do servidor no campo (Vitest)
- [x] Editar muda o lançamento; excluir o manda para a lixeira (teste PHPUnit do `DELETE` + Vitest)
- [x] Categorias mais usadas vêm do servidor e respeitam o tipo (Vitest)
- [x] Lançamento com categoria de outra clínica → 422 (teste que já existe continua passando)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/006-lancar-editar-excluir/`

## Depende de

- `004-calendario-de-caixa` (Calendário de caixa)
- `005-pendencias-com-atrasados` (A receber e a pagar)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `resources/js/pages/clinic/finances/finance-prototype/TransactionModal.tsx`, `resources/js/application/clinic/use-finance-transactions.ts`
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`, `frontend-testing`, `api-client`

## Como testar na mão

1. Clínica A, secretária: "Nova entrada", R$ 100, cartão de crédito, taxa 3%, recebido, hoje → líquido R$ 97.
2. O dia de hoje mostra a entrada; o resumo sobe R$ 97.
3. Abrir a entrada, mudar a descrição, salvar; abrir de novo e excluir: some do dia e vai para a lixeira.
4. "Nova saída" sem descrição: aparece o erro no campo.
