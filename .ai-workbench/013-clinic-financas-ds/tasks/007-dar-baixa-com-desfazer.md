# Dar baixa em um clique com "Desfazer"

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 28, 29
**Issue:** ainda não criada

## Descrição

Hoje só dá para mudar o status editando o lançamento inteiro, e o `PUT` exige todos os campos. A abordagem é uma rota que muda só o status e um botão nas pendências com "Desfazer" no aviso.

## O que construir

- Nova `PATCH /clinic/finances/transactions/{id}/status` com `{ status }`: valida contra o tipo (`isValidFor`: entrada aceita recebido/pendente, saída aceita pago/pendente), muda só o status, dispara o evento de lançamento atualizado e devolve o lançamento. Policy de update, filtro por `clinic_id` (404 de outra clínica).
- O botão "Recebido"/"Pago" em cada pendência marca na hora, sem mudar data nem forma de pagamento. O toast traz "Desfazer", que chama a mesma rota com `pendente`.
- Invalida pendências, calendário, resumo e relatório. Sem migration.

## Critérios de Aceite

- [x] `PATCH` com `recebido` numa entrada pendente → 200 e só o status muda (teste)
- [x] `PATCH` com `pago` numa entrada → 422 (teste)
- [x] Lançamento de outra clínica → 404; fisioterapeuta → 403 (teste)
- [x] Clicar em "Recebido" tira a pendência da lista; "Desfazer" a traz de volta (Vitest)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/007-dar-baixa-com-desfazer/`

## Depende de

- `005-pendencias-com-atrasados` (A receber e a pagar)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/ClinicFinance/app/Http/Controllers/FinancialTransactionController.php`, `modules/ClinicFinance/app/Enums/FinancialTransactionStatus.php`
- **Skills:** `backend-clean-code`, `php-modern`, `php-testing`, `design-system`, `frontend-testing`

## Como testar na mão

1. Clínica A, secretária: uma entrada pendente atrasada em "a receber".
2. Clicar em "Recebido": some da lista; o resumo sobe.
3. Clicar em "Desfazer" no aviso: volta para a lista.
