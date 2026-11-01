# Configurações: categorias de verdade

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 34, 35, 36, 37
**Issue:** ainda não criada

## Descrição

A seção de categorias do protótipo mostra os dados reais, mas criar, ligar/desligar e excluir são stub. A abordagem é ligar a seção às rotas que já existem, com a mensagem do 409 quando a categoria tem lançamentos.

## O que construir

- Colunas de entradas e saídas, com as da clínica e as do sistema e quantas estão ligadas.
- Criar categoria da clínica (`POST categories`), ligar/desligar qualquer uma (`POST categories/{id}/toggle-active`), excluir só as da clínica (`DELETE categories/{id}`); com lançamentos, o 409 mostra "Categoria possui transações; desative-a em vez de excluir."
- Só o administrador vê esta seção (a secretária não vê; a API já dá 403 desde a 001).
- Categoria desligada some dos chips e da lista do modal.
- Sem migration.

## Critérios de Aceite

- [x] Criar, ligar/desligar e excluir gravam de verdade (Vitest + testes que já existem)
- [x] Excluir categoria com lançamento mostra a mensagem do 409 (Vitest)
- [x] Categoria do sistema não tem botão de excluir (Vitest)
- [x] Secretária não vê a seção (Vitest)
- [x] Ligar/desligar categoria de outra clínica → 404 (teste que já existe)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/009-configuracoes-categorias/`

## Depende de

- `002-casca-v2-resumo-liquido` (Casca v2 real de Finanças)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `resources/js/pages/clinic/finances/finance-prototype/SettingsTab.tsx`, `modules/ClinicFinance/tests/Feature/FinancialCategoryControllerTest.php`
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`

## Como testar na mão

1. Clínica A, administrador, Configurações: criar "Pilates" em entradas.
2. Desligar "Pilates": some do modal de nova entrada.
3. Lançar algo em outra categoria da clínica e tentar excluí-la: aparece "desative em vez de excluir".
4. Secretária: Configurações não mostra categorias.
