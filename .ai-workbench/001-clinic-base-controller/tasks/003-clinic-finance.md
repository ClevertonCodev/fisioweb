# Rede de segurança e migração de ClinicFinance

**Tipo:** Tarefa
**Plano:** `../plans/clinic-base-controller.md`
**Issue:** ainda não criada

## Descrição

O módulo `ClinicFinance` tem cinco controllers que leem o guard `clinic` direto e nenhum teste com dado de outra clínica. É dado financeiro, e um vazamento aqui é grave. Antes de migrar, escrevemos os testes de outra clínica contra o código atual. Depois os cinco controllers passam a usar o controller base.

Cobre as histórias 8, 16, 17 e 18 do plano.

## O que construir

- **Rede de segurança (antes da migração, passando no código atual).** Um `admin` da clínica B:
  - **Categorias:** não vê categorias próprias de A em `GET /api/clinic/finances/categories`. `DELETE` e `toggle-active` numa categoria de A devolvem o status de hoje e não alteram nada.
  - **Lançamentos:**
    - `GET /api/clinic/finances/transactions` e `.../trash` não listam lançamentos de A;
    - `GET`, `PUT` e `DELETE .../transactions/{transaction}` com lançamento de A devolvem 404, porque o `abort_if` atual compara `clinic_id`;
    - `POST .../transactions/{id}/restore` com lançamento de A não restaura nada.
  - **Resumo e relatórios:** `GET .../summary` e os relatórios em `.../reports/*` de B não somam lançamentos de A.
  - **Saldo inicial:** `PUT .../opening-balance` grava só na clínica B.
  - **Exportação:** `GET .../export` de B não contém lançamentos de A.
- **Migração:** FinancialCategory, FinancialTransaction, FinancialSummary, FinancialReport e FinancialExport passam a estender o controller base e trocam todo acesso ao guard pelos métodos novos.
- Comparações estritas de `clinic_id` convertem o lado do model para `int`.
- Guard `clinic`. Permissões pelas Policies atuais de `FinancialCategory` e `FinancialTransaction`, que não mudam. Não tem migration nem frontend.

## Critérios de Aceite

- [ ] Os testes novos de outra clínica para categorias, lançamentos (incluindo lixeira e restauração), resumo, relatórios, saldo inicial e exportação existem e passam **antes** da migração. O commit de teste vem antes do commit de refatoração. (pendente: depende de como o usuário commitar — os testes foram escritos e confirmados verdes no código antigo antes de cada migração; ver sugestão de commits)
- [x] Nenhum `Auth::guard('clinic')` ou `auth('clinic')` sobra nos controllers de `ClinicFinance`.
- [x] Todos os testes atuais de `modules/ClinicFinance/tests` continuam verdes sem alteração.
- [x] O `ModuleBoundaryTest` de `ClinicFinance` continua verde.
- [x] Um usuário de outra clínica não vê, não altera e não exporta nenhum dado financeiro desta clínica.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-controller-base-e-modulo-clinic` (Criar ClinicAuthenticatedController e migrar Patient, ClinicProfile e Exercise)

## Notas de Implementação

- **Branch:** `feat/clinic-base-controller-finance`
- **Exemplo no código:**
  - `modules/ClinicFinance/tests/Feature/FinancialTransactionControllerTest.php`: montagem de lançamentos;
  - `modules/ClinicScheduling/tests/Feature/AppointmentAuthorizationTest.php`: o caso de outra clínica com `abort_if`.
- **Skills:** `php-testing`, `security`, `architecture-paradigm-modular-monolith`.
- **Atenção:** a exportação gera um arquivo. Se ela passar por fila ou pelo módulo `Xlsx`, o teste confere o conteúdo gerado, não só o status.

## Como testar na mão

1. Nas clínicas A e B, criar um lançamento e uma categoria própria em A.
2. Como `admin` de B, abrir a tela de Financeiro: nenhum lançamento nem categoria de A aparece, e o resumo do mês não soma os valores de A.
3. Como `admin` de B, `GET /api/clinic/finances/transactions/{id do lançamento de A}`: 404.
4. Como `admin` de B, exportar o mês: o arquivo não contém o lançamento de A.
5. Como `admin` de A, a tela de Financeiro mostra os mesmos valores de antes da mudança.
