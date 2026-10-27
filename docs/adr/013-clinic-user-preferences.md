# ADR: Preferências do usuário da clínica (chave-valor com chaves registradas)

## Contexto

A agenda v2 (feature 005) precisa lembrar escolhas do usuário em qualquer aparelho (visão do calendário, mostrar fins de semana). Outras telas v2 vão precisar do mesmo: colunas de tabela, filtros padrão, ordenação. Criar uma coluna ou tabela por preferência espalharia dado de UI pelos módulos e pediria migration a cada nova escolha.

## Decisão

O módulo `Clinic`, dono de `ClinicUser`, guarda as preferências numa tabela genérica `clinic_user_preferences` (`clinic_id`, `clinic_user_id`, `key`, `value` json), única por usuário + chave.

- As chaves aceitas ficam registradas no enum `ClinicUserPreferenceKey`. Cada caso declara a validação do próprio valor (`valueRules()`). Chave fora do enum ou valor inválido dá 422.
- Endpoints só do próprio usuário autenticado: `GET /api/clinic/me/preferences?keys=a,b` (objeto chave → valor, só das chaves com valor salvo) e `PUT /api/clinic/me/preferences/{key}` com `{ value }` (upsert). Não existe rota que receba o id de outro usuário; `clinic_id` e `clinic_user_id` vêm do token.
- O `Clinic` não sabe o que cada chave significa. Quem lê e aplica a preferência é a tela (o SPA).

## Consequências

- Benefícios:
  - Uma preferência nova é uma linha no enum, sem migration nem endpoint novo.
  - O isolamento é simples: toda query filtra pelo usuário autenticado.
- Custos:
  - O valor é json: consultar "quantos usuários usam a visão X" exige ler json. Não é um caso de uso hoje.
  - O enum vive no `Clinic`, então registrar chave de outra área toca o `Clinic`. Aceito enquanto as chaves forem só de UI.
- Regras que agentes devem preservar:
  - Nunca aceitar `clinic_user_id` ou `clinic_id` da requisição nestes endpoints.
  - Nunca aceitar chave livre: toda chave nova entra no enum com a validação do valor.
  - Não guardar regra de negócio nem dado de paciente como preferência.

## Alternativas descartadas

- Coluna json `preferences` em `clinic_users`: mistura dado de UI na tabela de identidade e cresce sem controle.
- Tabela por tela (ex.: `clinic_agenda_preferences` no `ClinicScheduling`): uma migration e um endpoint a cada tela nova.
- `localStorage`: não vale em outro aparelho, o que o usuário pediu explicitamente.
