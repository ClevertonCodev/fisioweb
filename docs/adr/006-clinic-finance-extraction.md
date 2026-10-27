# ADR: ClinicFinance physical extraction

## Contexto

O modulo `Clinic` concentra financeiro, agenda, cuidado clinico, usuarios, dashboard e outras responsabilidades. O primeiro corte fisico sera o financeiro da clinica, sem alterar rotas REST publicas nem nomes de tabelas existentes.

## Decisao

Criar o modulo fisico `ClinicFinance` como dono de transacoes financeiras, categorias financeiras, saldos iniciais, resumos, relatorios e exportacoes financeiras da clinica.

As rotas publicas continuam sob os mesmos paths `/api/clinic/finances/*`. A propriedade do backend muda de `Clinic` para `ClinicFinance`, mas o frontend nao deve perceber diferenca de path, shape de request, shape de response ou fluxo.

As tabelas existentes permanecem com os nomes atuais:

- `clinic_financial_categories`
- `clinic_financial_category_overrides`
- `clinic_financial_opening_balances`
- `clinic_financial_transactions`

As migrations que criam essas tabelas pertencem ao modulo dono e ficam em `modules/ClinicFinance/database/migrations/*clinic_financial*.php`. A propriedade de schema, comportamento e codigo de dominio passa para `ClinicFinance`.

## Consequencias

- Beneficios:
  - O financeiro passa a ter dono claro.
  - O futuro financeiro administrativo pode evoluir separado.
  - A extracao futura para microservico fica menos custosa.
  - `ClinicFinance` fica registrado como o primeiro capability clinic-scoped extraido fisicamente.
- Custos:
  - Havera periodo curto de compatibilidade entre codigo legado e modulo novo.
  - Imports, policies, factories e testes precisam ser remapeados com cuidado.
- Regras que agentes devem preservar:
  - Nao renomear tabelas/views financeiras existentes.
  - Nao mudar paths REST publicos.
  - Nao adicionar novas regras financeiras em `modules/Clinic`.
  - Nao importar Models/Repositories privados de outro modulo em codigo de producao.
  - Manter novas migrations financeiras em `modules/ClinicFinance/database/migrations/`.

## Extracao futura

Antes de virar microservico, `ClinicFinance` precisara de contratos externos versionados, outbox/inbox, idempotencia obrigatoria nos consumidores, autenticacao entre servicos e observabilidade com logs correlacionados.
