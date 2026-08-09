# Phase 1 — Data Model: Patient Login Area

**Feature**: `specs/016-patient-login-area` | **Date**: 2026-08-08 | **Plan**: [plan.md](./plan.md)

> **Nenhuma migration nesta feature.** Todo o schema necessário já existe. Este documento descreve o que é **lido**, o que é **validado** e quais **estruturas em memória** são introduzidas.

---

## 1. Tabelas existentes (somente leitura)

### `patients` — `modules/Patient/database/migrations/2026_02_27_000003_create_patients_table.php`

| Coluna | Tipo | Nulo | Papel nesta feature |
|--------|------|------|---------------------|
| `id` | bigint PK | não | Sujeito JWT |
| `clinic_id` | FK → `clinics` | não | **Escopo obrigatório** de toda busca de identificador |
| `email` | string | **não** | Identificador alternativo; também é a senha padrão de quem não tem CPF |
| `cpf` | string(14) | sim | Identificador primário; senha padrão do caso dominante |
| `password` | string | não | Hash verificado no login (cast `hashed` no model) |
| `is_active` | boolean, default `true` | não | **Bloqueia** login quando `false` (R8) |
| `status` | string(50) | sim | `obito` / `cancelado` bloqueiam; `alta` **mantém** acesso (R8) |
| `name` | string | não | Exibido na barra após autenticar |
| `deleted_at` | timestamp | sim | `SoftDeletes` — excluído automaticamente pelo provider |

**Índices que sustentam o modelo de identificador**:

```
unique(email, clinic_id)
unique(cpf,   clinic_id)
```

> Consequência de projeto: **identificador + clínica resolve para no máximo um paciente**. É o que permite decidir o tipo do identificador por formato e fazer uma única consulta indexada (R2). Note que a unicidade é **por clínica**, não global — o mesmo CPF pode existir em várias clínicas, e é exatamente isso que torna o passo de escolha necessário (R5).

### `clinics` — `modules/Clinic/database/migrations/2026_02_27_000002_create_clinics_table.php`

| Coluna | Tipo | Nulo | Papel nesta feature |
|--------|------|------|---------------------|
| `id` | bigint PK | não | Escopo da busca e da sessão |
| `slug` | string unique | **sim** | Resolve o contexto de clínica vindo da URL |
| `name` | string | não | Exibido no formulário e na lista de escolha |

> `slug` ser **nullable** é a razão técnica de o fallback de escolha de clínica não ser opcional (FR-018).

---

## 2. Estruturas em memória (novas)

### `PatientIdentifier` — Value Object

`modules/Patient/app/Support/PatientIdentifier.php`

Encapsula a decisão de R2 num único lugar, para que Controller, Service e testes não repitam normalização.

| Membro | Descrição |
|--------|-----------|
| `type` | `email` \| `cpf` — decidido por presença de `@` no valor bruto |
| `value` | Valor **normalizado**: e-mail em minúsculas sem espaços nas pontas; CPF só com dígitos |
| `column()` | Coluna a consultar: `email` ou `cpf` |

**Regras de normalização**

| Entrada | `type` | `value` |
|---------|--------|---------|
| `  Joao@Clinica.COM ` | `email` | `joao@clinica.com` |
| `123.456.789-00` | `cpf` | `12345678900` |
| `123 456 789 00` | `cpf` | `12345678900` |
| `12345678900` | `cpf` | `12345678900` |

**Invariantes**

- A classificação acontece **antes** de qualquer acesso ao banco.
- Um valor sem `@` é sempre tratado como CPF, mesmo que não seja um CPF válido — a busca simplesmente não encontra, e a resposta é a genérica de R6. **Não** há validação de dígito verificador no login: rejeitar CPF matematicamente inválido revelaria, pela diferença de mensagem, quais valores sequer chegam a ser consultados.

### `ClinicOption` — DTO de leitura

Item da lista devolvida pela descoberta de clínicas.

| Campo | Origem |
|-------|--------|
| `id` | `clinics.id` |
| `name` | `clinics.name` |
| `slug` | `clinics.slug` (pode ser nulo) |

Substitui o array anônimo montado hoje dentro do `AuthController::findClinics`, que devolve apenas `id` e `name`. O `slug` entra porque o frontend precisa dele para montar o destino pós-login quando o paciente escolhe a clínica pelo fallback.

---

## 3. Regras de validação

### Login (`LoginRequest`)

| Campo | Regra | Observação |
|-------|-------|------------|
| `identifier` | obrigatório, string, 1..255 | Sem validação de formato — ver invariante acima |
| `password` | **obrigatório**, string | **Novo.** Hoje o campo não existe no request |
| `clinic_id` | obrigatório, inteiro, existe em `clinics` | Já existente |

> A regra `exists:clinics,id` é mantida por higiene de entrada, mas **não** pode gerar mensagem distinta ao paciente: falha de validação de `clinic_id` e falha de credencial devem ser indistinguíveis na superfície (FR-020). O tratamento fica na camada HTTP — ver [contracts/patient-auth-rest.md](./contracts/patient-auth-rest.md).

### Descoberta de clínicas (`FindClinicsRequest`)

| Campo | Regra |
|-------|-------|
| `identifier` | obrigatório, string, 1..255 |

Substitui a regra atual `['cpf' => ['required','string']]`, que não aceita e-mail.

### Formulário (Zod, frontend)

| Campo | Regra |
|-------|-------|
| `identifier` | obrigatório; refino: e-mail válido **ou** 11 dígitos após remover não-numéricos |
| `password` | obrigatório, mínimo 1 |
| `clinicId` | obrigatório no passo de senha (fixado pelo slug ou escolhido) |

> O refino de formato no frontend é **conveniência de UX**, não segurança — orienta antes do envio. O backend não replica esse refino, pelo motivo da invariante de R6.

---

## 4. Elegibilidade para autenticar

Aplicada **depois** de encontrar o paciente e **antes** de considerar o login bem-sucedido. Toda reprovação produz a mesma resposta genérica.

| Condição | Autentica? |
|----------|-----------|
| `deleted_at` preenchido | Não — `SoftDeletes` já exclui do provider |
| `is_active = false` | **Não** |
| `status = obito` | **Não** |
| `status = cancelado` | **Não** |
| `status = alta` | **Sim** (R8 — desfecho positivo, paciente ainda revisa o programa) |
| `status` nulo ou outro | Sim |

> `Patient::INACTIVE_STATUSES` já existe no model (`obito`, `cancelado`, `alta`) e alimenta o `scopeActiveStatus` do dashboard. **Não reutilizar esse scope aqui** — o conjunto de elegibilidade de login é deliberadamente diferente (inclui `alta`). Reaproveitar o scope acoplaria a regra de acesso à regra de contagem do dashboard, e uma mudança em uma quebraria a outra silenciosamente.

---

## 5. Estado do frontend

### `domain/patient/auth.ts` — tipos puros

| Tipo | Campos |
|------|--------|
| `PatientIdentity` | `id`, `name`, `email`, `clinicId` |
| `ClinicOption` | `id`, `name`, `slug` |
| `PatientLoginCredentials` | `identifier`, `password`, `clinicId` |

camelCase, sem `_at`, sem prefixo `Api`, sem constante de UI — conforme regra 6 do projeto. O mapeamento `snake_case ↔ camelCase` fica em `infrastructure/repositories/api-patient-auth.ts`.

### Máquina de estados da página

```
                    ┌──────────────────────────────┐
   slug na URL ────▶│  CREDENTIALS (clínica fixa)  │──── submit ───▶ autenticado
                    └──────────────────────────────┘
                                  ▲
                                  │ clínica escolhida
                    ┌─────────────┴────────────────┐
   sem slug ───────▶│  IDENTIFIER  │──▶│  CLINIC   │
                    └──────────────┘   └───────────┘
                                            │
                                  1 clínica │ (pula a escolha)
                                            ▼
                                       CREDENTIALS
```

| Estado | Entra quando | Sai para |
|--------|--------------|----------|
| `CREDENTIALS` | slug resolveu a clínica, **ou** clínica escolhida | Autenticado → `next` validado ou lista de programas |
| `IDENTIFIER` | sem slug na URL | `CLINIC`, ou direto para `CREDENTIALS` se houver exatamente uma clínica |
| `CLINIC` | descoberta devolveu 2+ clínicas | `CREDENTIALS`; voltar retorna a `IDENTIFIER` **preservando o que foi digitado** (FR — US2/AS5) |

> O identificador digitado sobrevive à ida e volta entre passos — é estado do formulário RHF, não é remontado a cada passo.

---

## 6. Sessão resultante

| Aspecto | Valor |
|---------|-------|
| Guard | `patient` |
| Chave de storage | `auth_token_patient` em `localStorage` (`tokenKey()` em `client.ts`) |
| Isolamento | `clearStoredAuth('patient')` não toca `admin` nem `clinic` — já implementado |
| Vínculo de clínica | Implícito no `patient_id` do JWT: o paciente **é** de uma clínica (`patients.clinic_id`) |

> Não há campo de clínica separado no token: como cada linha de `patients` pertence a uma única clínica, autenticar um paciente já determina a clínica. Um mesmo CPF em duas clínicas são **duas linhas distintas**, logo duas identidades distintas — o que satisfaz FR-019 sem estrutura extra.
