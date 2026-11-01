# Secretária entra em Finanças, fisioterapeuta não

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 1, 2, 3, 4, 5, 6, 44
**Issue:** ainda não criada

## Descrição

Hoje toda a API de Finanças está atrás de `clinic.admin`, e o menu só mostra Finanças para quem pode gerenciar usuários. A secretária, que cuida do caixa no dia a dia, não entra. A abordagem é trocar a regra de papel no backend, que é a fonte de verdade, e espelhá-la no menu e nas rotas do SPA.

## O que construir

- Dono: `ClinicFinance`. Um middleware do próprio módulo ("administrador ou secretária") substitui o `clinic.admin` no grupo `/api/clinic/finances/*`. As rotas de escrita de categoria (criar, ligar/desligar, excluir) e de saldo inicial (`PUT opening-balance`) continuam com o `clinic.admin`.
- As Policies de lançamento e de categoria (e uma de saldo, se precisar) usam a mesma regra de papel e continuam conferindo a posse por `clinic_id`. Os controllers chamam a Policy em toda ação, inclusive exportar e restaurar.
- Frontend: `can.manageFinances` (administrador ou secretária) e `can.manageFinanceSettings` (administrador) em `permissions.ts`. O menu (`ClinicSidebar`, `ClinicTopbar`) e as três rotas de Finanças usam `manageFinances` no lugar de `can.manageUsers` e `RequireClinicAdmin`. O item "Usuários" continua só do administrador.
- Exportar segue a mesma regra (administrador e secretária).
- Sem migration.

## Critérios de Aceite

- [x] Secretária recebe 200 em listar, criar, editar, excluir, restaurar, lixeira, resumo, relatórios, categorias (GET) e exportar
- [x] Secretária recebe 403 em criar, ligar/desligar e excluir categoria e no `PUT opening-balance`
- [x] Fisioterapeuta recebe 403 em todas as rotas de Finanças (teste que percorre a lista de rotas do grupo)
- [x] Administrador continua com 200 em tudo (os testes que já existem passam)
- [x] Menu mostra Finanças para administrador e secretária e esconde para o fisioterapeuta; `/clinica/financas` com o fisioterapeuta não abre a tela
- [x] Vitest de `can.manageFinances` / `can.manageFinanceSettings` e do menu por papel
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/001-acesso-secretaria-financas/`

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/Clinic/app/Http/Middleware/EnsureClinicAdmin.php`, `modules/ClinicFinance/app/Policies/FinancialTransactionPolicy.php`, `resources/js/components/clinic/RequireClinicAdmin.tsx`
- **Skills:** `security`, `backend-clean-code`, `architecture-paradigm-modular-monolith`, `php-testing`, `frontend-testing`

## Como testar na mão

1. Clínica A, entrar como secretária: o menu mostra Finanças; `/clinica/financas` abre.
2. Pela API (token da secretária), `POST /api/clinic/finances/categories` → 403; `PUT /api/clinic/finances/opening-balance` → 403; `GET /api/clinic/finances/summary` → 200.
3. Entrar como fisioterapeuta: sem Finanças no menu; `GET /api/clinic/finances/summary` → 403.
4. Clínica B: o lançamento da clínica A por id → 404.
