# Configurações: saldo inicial, lixeira com restaurar e links antigos

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 38, 39, 40
**Issue:** ainda não criada

## Descrição

O restante das Configurações do protótipo ainda é stub: saldo inicial, restaurar da lixeira, o cartão de repasses. A abordagem é ligar o saldo e a lixeira às rotas reais, tirar o cartão de repasses e manter os links antigos abrindo a seção certa.

## O que construir

- Saldo inicial do mês nas Configurações usa o mesmo modal real da 003 (só administrador).
- Lixeira: lista os excluídos da clínica (`GET transactions/trash`, paginada) e restaura (`POST transactions/{id}/restore`); restaurar invalida calendário, pendências, resumo e relatório.
- O cartão "Repasses aos profissionais" sai.
- A secretária vê só a seção Lixeira; o administrador vê categorias, saldo e lixeira.
- `/clinica/financas/categorias` e `/clinica/financas/lixeira` abrem Configurações rolando até a seção.
- Sem migration.

## Critérios de Aceite

- [x] Restaurar tira da lixeira e o lançamento volta ao calendário (Vitest + teste que já existe)
- [x] Restaurar lançamento de outra clínica → 404 (teste)
- [x] Sem cartão de repasses (Vitest)
- [x] Secretária vê só a lixeira; administrador vê as três seções (Vitest)
- [x] `/clinica/financas/lixeira` abre já na lixeira (Vitest)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/010-configuracoes-saldo-lixeira/`

## Depende de

- `003-saldo-inicial-encadeado` (Saldo inicial encadeado)
- `006-lancar-editar-excluir` (Lançar, editar e excluir)
- `009-configuracoes-categorias` (Configurações: categorias)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `resources/js/pages/clinic/finances/finance-prototype/SettingsTab.tsx`, `resources/js/application/clinic/use-finance-transactions.ts` (`useFinanceTrash`)
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`

## Como testar na mão

1. Clínica A, secretária: excluir um lançamento; abrir `/clinica/financas/lixeira`: abre já na lixeira, só ela.
2. Restaurar: volta para o dia certo do calendário.
3. Administrador: Configurações mostra categorias, saldo e lixeira; sem repasses.
