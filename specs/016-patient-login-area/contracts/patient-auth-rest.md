# Contract — Patient Auth REST

**Feature**: `specs/016-patient-login-area` | **Módulo dono**: `Patient` | **Prefixo**: `/api/patient/auth`

Base: `modules/Patient/routes/api.php`. Endpoints marcados **ALTERADO** já existem e mudam de contrato; os demais permanecem como estão.

---

## Princípio transversal — respostas indistinguíveis

Todas as falhas de autenticação e de descoberta compartilham a **mesma superfície observável**. Isso é requisito (FR-020, FR-021), não preferência de estilo.

| Causa real | Status | Corpo |
|-----------|--------|-------|
| Identificador não existe na clínica | `401` | `{"message": "Credenciais inválidas."}` |
| Senha incorreta | `401` | `{"message": "Credenciais inválidas."}` |
| `is_active = false` | `401` | `{"message": "Credenciais inválidas."}` |
| `status` = `obito` / `cancelado` | `401` | `{"message": "Credenciais inválidas."}` |
| `clinic_id` inexistente | `401` | `{"message": "Credenciais inválidas."}` |

> **Armadilha de implementação**: `clinic_id` tem regra `exists:clinics,id` no FormRequest. A validação padrão do Laravel devolveria `422` com o campo que falhou — o que **distingue** essa causa das demais e viola FR-020. O Controller precisa converter falha de validação de `clinic_id` na resposta `401` genérica, ou validar a existência dentro do Service. Campos ausentes (`identifier`/`password` não enviados) podem continuar `422`: isso é erro de cliente, não sinal sobre o cadastro.

---

## 1. `POST /api/patient/auth/find-clinics` — **ALTERADO**

Descobre em quais clínicas o identificador possui cadastro. Público, com throttle.

### Request

```json
{ "identifier": "123.456.789-00" }
```

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `identifier` | string | sim | CPF (com ou sem máscara) **ou** e-mail |

**Mudanças em relação ao atual**: o campo `cpf` passa a se chamar `identifier` e aceita e-mail.

### Response `200`

```json
{
  "data": [
    { "id": 1, "name": "Clínica Cleverton", "slug": "clinica-cleverton" },
    { "id": 7, "name": "Fisio Centro",      "slug": null }
  ]
}
```

### Response `200` — sem vínculo

```json
{ "data": [] }
```

> **Mudança de segurança.** Hoje este caso devolve `404 {"message": "CPF não encontrado."}`, transformando o endpoint num oráculo: varrer faixas de CPF revela quais existem e em quais clínicas. Como a senha padrão é derivada do próprio CPF, esse sinal é meio caminho para o comprometimento. A resposta passa a ser `200` com lista vazia — indistinguível de um identificador sem vínculo. O frontend exibe a **mesma** mensagem genérica do erro de credencial.

### Response `429`

```json
{ "message": "Muitas tentativas. Aguarde antes de tentar novamente." }
```

### Regras

- `identifier` é normalizado e classificado antes da consulta (ver `PatientIdentifier` em [data-model.md](../data-model.md)).
- A consulta é `Patient::where(<coluna>, <valor>)` **sem** escopo de clínica — é justamente o passo que descobre as clínicas.
- Pacientes inelegíveis (R8) **não** entram na lista. Uma clínica onde o paciente está inativo não deve aparecer como opção que depois falha no login.
- `slug` pode ser `null` (`clinics.slug` é nullable); o frontend precisa tolerar.

---

## 2. `POST /api/patient/auth/login` — **ALTERADO**

Autentica o paciente numa clínica específica. Público, com throttle.

### Request

```json
{
  "identifier": "123.456.789-00",
  "password": "12345678900",
  "clinic_id": 1
}
```

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `identifier` | string | sim | CPF ou e-mail |
| `password` | string | **sim** | **Novo campo** |
| `clinic_id` | inteiro | sim | Fixado pelo slug ou escolhido no passo anterior |

**Mudanças em relação ao atual**: `cpf` → `identifier`; `password` passa a existir e a ser **verificado**.

### Response `200`

```json
{
  "access_token": "eyJ0eXAiOiJKV1Qi...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": { "id": 42, "name": "Maria Silva", "email": "maria@exemplo.com", "clinic_id": 1 }
}
```

Formato produzido por `BaseAuthController::respondWithToken` — **inalterado**. `password` não aparece: o model tem `$hidden = ['password']`.

### Response `401` / `429`

Conforme a tabela transversal acima.

### Regras

```
// modules/Patient/app/Http/Controllers/AuthController.php

// ANTES — a senha digitada é descartada
return $this->attemptLogin([
    'cpf'       => $cpf,
    'clinic_id' => $request->clinic_id,
    'password'  => $cpf,           // ← vem do request, não do que o paciente digitou
]);

// DEPOIS — a senha digitada é verificada
return $this->attemptLogin([
    $identifier->column() => $identifier->value,
    'clinic_id'           => $request->clinic_id,
    'password'            => $request->password,
]);
```

> **Este é o núcleo da correção de segurança.** `Patient` tem cast `'password' => 'hashed'` e o `EloquentUserProvider` já faz `Hash::check` corretamente — a infraestrutura sempre esteve certa. O defeito é o Controller injetar o CPF no lugar da senha do request. Como `PatientService::create` grava `password = cpf`, o hash bate e o `attempt` passa: **conhecer o CPF autentica**. Remover a substituição resolve, sem migration e sem re-hash — os hashes existentes continuam válidos e continuam correspondendo ao CPF, que segue sendo a senha padrão.

- Elegibilidade (R8) é verificada **após** o `attempt` bem-sucedido; se reprovar, invalidar o token emitido e responder `401` genérico.
- Login bem-sucedido chama `RateLimiter::clear` da chave daquele identificador (FR-024).

---

## 3. `POST /api/patient/auth/logout` — inalterado

`auth:patient`. Já implementado em `BaseAuthController::logout`.

## 4. `POST /api/patient/auth/refresh` — inalterado

`auth:patient`. Já implementado em `BaseAuthController::refresh`.

## 5. `GET /api/patient/auth/me` — inalterado

`auth:patient`. Devolve o `Patient` autenticado (sem `password`). Consumido pelo `AuthContext` para reidratar a sessão.

---

## 6. Rate limiting

Registrado como limiter nomeado em provider e aplicado via middleware `throttle:<nome>` nas rotas públicas.

| Rota | Nome sugerido | Chave | Limite sugerido |
|------|---------------|-------|-----------------|
| `login` | `patient-login` | `identifier` normalizado + IP | 5 / minuto |
| `find-clinics` | `patient-find-clinics` | IP | 10 / minuto |

**Por que chave composta no login**: só IP bloqueia pacientes legítimos que compartilham NAT de operadora móvel; só identificador permite que qualquer um bloqueie a conta de um paciente cujo CPF conheça — negação de serviço trivial. A composição evita os dois.

> **Primeiro throttle do projeto.** Não existe `RateLimiter` nem middleware `throttle` em `routes/`, `modules/*/routes/` ou `app/Providers/`. O nome e o formato adotados aqui viram, na prática, a referência para os logins de clínica e admin — que também estão sem limite hoje. Vale escolher com esse peso.

### Estrutura de rotas resultante

```php
// modules/Patient/routes/api.php
Route::prefix('patient/auth')->group(function () {
    Route::post('find-clinics', [AuthController::class, 'findClinics'])
        ->middleware('throttle:patient-find-clinics');

    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:patient-login');

    Route::middleware('auth:patient')->group(function () {
        Route::post('logout',  [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me',       [AuthController::class, 'me']);
    });
});
```

---

## 7. Contrato do frontend

### Guard

`/patient/*` já é inferido como guard `patient` em `client.ts:16` — **nenhuma mudança** em `inferGuardFromApiUrl`.

### Redirecionamento em 401

`client.ts:113-122` contém hoje:

```ts
// Patient: sem tela de login dedicada no SPA ainda — não redireciona para clínica
```

Com a tela existindo, `redirectToLogin('patient')` passa a levar ao login do paciente, preservando o caminho atual em `?next=`. O ramo em `client.ts:163-165`, que rejeita silenciosamente 401 de `/patient/*` sem sessão, passa a redirecionar — é o que satisfaz FR-027.

### Parâmetro `next`

| Aspecto | Regra |
|---------|-------|
| Origem | Query string da rota de login |
| Aceito | Caminho iniciado por `/` que case com a área do paciente |
| **Rejeitado** | URL absoluta (`http://`, `https://`), protocolo relativo (`//host`), caminho fora da área do paciente |
| Fallback | `patientProgramsListPath(clinicSlug)` |

> Rejeitar `//host` explicitamente não é preciosismo: o navegador resolve `//evil.com` como URL absoluta com o protocolo atual. Uma checagem ingênua de "começa com `/`" aceita esse valor e entrega um open redirect. Ver FR-005 e R9.
