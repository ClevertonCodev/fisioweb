# ADR: Temporary shared writes during ClinicFinance migration

Status: Closed

## Contexto

A migracao de financeiro para `ClinicFinance` precisa preservar rotas existentes e reduzir risco enquanto controllers, services, repositories, policies e testes sao movidos.

## Decisao

Permitir escrita compartilhada temporaria entre o codigo financeiro legado de `Clinic` e o novo modulo `ClinicFinance` somente durante a migracao.

A excecao terminou quando `ClinicFinance` passou a servir as mesmas rotas `/api/clinic/finances/*` e os handlers financeiros legados de `Clinic` foram desativados.

Estado final desta etapa:

- Rotas financeiras publicas continuam em `/api/clinic/finances/*`.
- O arquivo `modules/ClinicFinance/routes/clinic.php` e o dono das rotas financeiras.
- `modules/Clinic/routes/clinic.php` nao declara mais rotas financeiras.
- Novas regras financeiras da clinica devem entrar somente em `ClinicFinance`.

## Consequencias

- Beneficios:
  - Permite migrar por partes sem quebrar o fluxo atual.
  - Facilita comparacao de comportamento e respostas.
- Custos:
  - Durante a transicao ha risco de duplicidade conceitual.
  - Fitness tests precisam permitir excecoes documentadas ate a conclusao.
- Regras que agentes devem preservar:
  - Nao reabrir escrita compartilhada sem nova ADR.
  - Nao criar novas regras financeiras no legado.
  - Manter `ClinicFinance` como dono exclusivo do financeiro da clinica.

## Extracao futura

Shared writes sao incompatíveis com microservico. Esta excecao esta encerrada; qualquer extracao distribuida ainda exige outbox/inbox, idempotencia e observabilidade.
