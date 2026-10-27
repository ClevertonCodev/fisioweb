# Quickstart — Patient Login Area

**Feature**: `specs/016-patient-login-area` | **Date**: 2026-08-08

Guia de **validação**: como provar que a feature funciona ponta a ponta. Não contém implementação — corpos de Service, página e testes ficam em `tasks.md` e na fase de implementação.

Referências: [contracts/patient-auth-rest.md](./contracts/patient-auth-rest.md) · [data-model.md](./data-model.md) · [research.md](./research.md)

---

## Pré-requisitos

```bash
composer install && npm install
php artisan migrate           # nenhuma migration nova nesta feature
composer run dev              # Laravel + queue + Pail + Vite
```

Dados necessários no banco local:

| Item | Por quê |
|------|---------|
| 1 clínica com `slug` preenchido (ex.: `clinica-cleverton`) | Caminho contextual (US1) |
| 1 clínica **sem** `slug` | Fallback de escolha (FR-018) |
| 1 paciente com CPF **e** e-mail | US1 — os dois identificadores |
| **Mesmo CPF** cadastrado em 2 clínicas | US2 — escolha de clínica |
| 1 paciente sem CPF (`is_foreign`), só e-mail | R4 — senha padrão é o e-mail |
| 1 paciente com `is_active = false` | R8 — elegibilidade |
| 1 paciente com `status = alta` | R8 — **deve** conseguir entrar |

> Senha de todos: o CPF (só dígitos) — ou o e-mail, para quem não tem CPF. É o que `PatientService::create` grava.

---

## Validação 1 — A correção de segurança (a mais importante)

**Prova que o defeito atual foi fechado.** Rode **antes** e **depois** da implementação — o contraste é o teste.

```bash
# Senha ERRADA com identificador correto
curl -s -X POST http://localhost:8000/api/patient/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"12345678900","password":"senha-totalmente-errada","clinic_id":1}'
```

| Momento | Resultado |
|---------|-----------|
| **Antes** | `200` com `access_token` — a senha digitada é ignorada; conhecer o CPF basta |
| **Depois** | `401 {"message":"Credenciais inválidas."}` |

```bash
# Senha CORRETA (o CPF) — deve continuar funcionando
curl -s -X POST http://localhost:8000/api/patient/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"12345678900","password":"12345678900","clinic_id":1}'
# esperado: 200 com access_token, token_type, expires_in, user (sem password)
```

✅ **Passa quando**: senha errada é recusada **e** a senha padrão continua entrando. As duas metades importam — recusar tudo também "fecharia" o defeito, e quebraria a base inteira.

---

## Validação 2 — CPF e e-mail autenticam igual

```bash
# CPF com máscara
curl -s -X POST http://localhost:8000/api/patient/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"123.456.789-00","password":"12345678900","clinic_id":1}'

# CPF sem máscara
curl -s -X POST http://localhost:8000/api/patient/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"12345678900","password":"12345678900","clinic_id":1}'

# E-mail com caixa alta e espaços
curl -s -X POST http://localhost:8000/api/patient/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"  Maria@Exemplo.COM ","password":"12345678900","clinic_id":1}'
```

✅ **Passa quando**: as três respostas autenticam o **mesmo** `user.id` (SC-004).

---

## Validação 3 — Não-enumeração

```bash
# Identificador inexistente
curl -s -X POST http://localhost:8000/api/patient/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"00000000000","password":"qualquer","clinic_id":1}'

# Identificador válido, senha errada
curl -s -X POST http://localhost:8000/api/patient/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"12345678900","password":"errada","clinic_id":1}'

# Paciente inativo
curl -s -X POST http://localhost:8000/api/patient/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"<cpf-do-inativo>","password":"<cpf-do-inativo>","clinic_id":1}'
```

✅ **Passa quando**: as três respostas são **byte a byte idênticas** — mesmo status, mesma mensagem (SC-006).

```bash
# Descoberta com identificador sem vínculo
curl -s -X POST http://localhost:8000/api/patient/auth/find-clinics \
  -H 'Content-Type: application/json' -d '{"identifier":"00000000000"}'
```

✅ **Passa quando**: `200 {"data":[]}` — **não** `404 "CPF não encontrado."`, que é o comportamento atual e o oráculo de CPF que a feature fecha.

---

## Validação 4 — Elegibilidade

| Paciente | Esperado |
|----------|----------|
| `is_active = false` | `401` genérico |
| `status = obito` | `401` genérico |
| `status = cancelado` | `401` genérico |
| `status = alta` | **`200` — autentica** |
| soft-deleted | `401` genérico |

✅ **Passa quando**: `alta` entra e os demais não. Se `alta` for recusado, a regra foi acoplada ao `scopeActiveStatus` do dashboard — ver a nota em [data-model.md](./data-model.md#4-elegibilidade-para-autenticar).

---

## Validação 5 — Escolha de clínica

```bash
# CPF cadastrado em 2 clínicas
curl -s -X POST http://localhost:8000/api/patient/auth/find-clinics \
  -H 'Content-Type: application/json' -d '{"identifier":"12345678900"}'
# esperado: data com 2 itens, cada um {id, name, slug} — slug pode ser null

# E-mail também descobre
curl -s -X POST http://localhost:8000/api/patient/auth/find-clinics \
  -H 'Content-Type: application/json' -d '{"identifier":"maria@exemplo.com"}'
```

Depois, autenticar em **cada** `clinic_id` e conferir que `user.id` difere — são duas linhas distintas em `patients`.

✅ **Passa quando**: a sessão de uma clínica não lê programa da outra (SC-003).

---

## Validação 6 — Rate limiting

```bash
for i in $(seq 1 8); do
  printf "tentativa %s: " "$i"
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/api/patient/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"identifier":"12345678900","password":"errada","clinic_id":1}'
done
```

✅ **Passa quando**: as primeiras respondem `401` e, após o limite, passam a `429` (SC-007). Autenticar com a senha correta deve zerar a contagem (FR-024).

> Em teste automatizado, chamar `RateLimiter::clear()` no `setUp` — caso contrário um teste envenena o seguinte.

---

## Validação 7 — Fluxo no navegador

### 7a. Caminho contextual (dominante)

1. Abrir `http://localhost:8000/clinica-cleverton/paciente/programas/<publicToken>` **sem login**
2. O detalhe do programa aparece (feature 015 — **não pode** ter virado autenticado)
3. Clicar **"Entrar"** na barra
4. → Vai para o login do paciente com **"Clínica Cleverton"** visível, `?next=` preenchido
5. Informar CPF e senha → autenticar
6. → **Retorna ao mesmo programa**, autenticado

✅ SC-001, SC-002, SC-008.

### 7b. Sem contexto de clínica

1. Abrir `http://localhost:8000/login`
2. → Redireciona para o login do paciente, sem clínica fixada
3. Informar um CPF cadastrado em 2 clínicas
4. → Lista as duas; escolher uma
5. Voltar um passo → o identificador digitado **continua lá** (US2/AS5)
6. Avançar, informar a senha → autenticar
7. → Chega à lista de programas da clínica escolhida

### 7c. Estado da barra

| Situação | Barra mostra |
|----------|--------------|
| Anônimo | **"Entrar"** |
| Autenticado | Nome do paciente + **sair** |
| Após sair | **"Entrar"** de novo, em tela pública utilizável |

✅ SC-010.

### 7d. Open redirect

Abrir cada um e autenticar:

```
/paciente/login?next=https://exemplo-externo.com
/paciente/login?next=//exemplo-externo.com
/paciente/login?next=/clinica/pacientes
```

✅ **Passa quando**: os três são **descartados** e o destino vira a lista de programas (SC-009).

> `//exemplo-externo.com` é o caso que uma checagem ingênua de "começa com `/`" deixa passar — o navegador o resolve como host externo.

---

## Validação 8 — Apresentação

| Verificação | Como |
|-------------|------|
| Modo claro e escuro | Alternar pelo botão da barra; sem descompasso entre barra e corpo |
| Largura de telefone | DevTools em 360px — sem rolagem horizontal |
| Sem cor fora de token | `grep -nE "#[0-9a-fA-F]{3,6}|text-(red\|green\|blue)-[0-9]" resources/js/pages/patient/auth/` → vazio |
| `cursor-pointer` | Todos os clicáveis |
| Teclado | Tab alcança todos os campos; Enter envia; erro anunciável |
| Senha fora de log | `php artisan pail` durante uma tentativa — nenhuma senha visível (SC-012) |

---

## Suíte automatizada

```bash
composer run test                                    # PHPUnit
vendor/bin/phpunit --filter=PatientLoginTest
vendor/bin/phpunit --filter=PatientFindClinicsTest
vendor/bin/phpunit --filter=PatientAuthThrottleTest

npm run test                                         # Vitest
npm run types && npm run lint
./vendor/bin/pint
```

> `modules/Patient/tests/Feature/` só tem `.gitkeep` hoje — estes são os primeiros testes de Feature do módulo. Conferir o bootstrap de `RefreshDatabase` e a `PatientFactory` na primeira task, antes de empilhar casos.

---

## Checklist de conclusão

- [ ] Senha errada é recusada; senha padrão continua entrando *(Val. 1)*
- [ ] CPF com máscara, sem máscara e e-mail autenticam o mesmo paciente *(Val. 2)*
- [ ] Falhas indistinguíveis; `find-clinics` sem vínculo devolve `200 []` *(Val. 3)*
- [ ] `alta` autentica; `is_active=false`, `obito`, `cancelado` não *(Val. 4)*
- [ ] CPF em 2 clínicas → escolha; sessões isoladas *(Val. 5)*
- [ ] `429` após o limite; sucesso zera a contagem *(Val. 6)*
- [ ] Deep link → Entrar → autenticar → **volta ao mesmo programa** *(Val. 7a)*
- [ ] `/login` resolve; identificador preservado ao voltar um passo *(Val. 7b)*
- [ ] Barra reflete sessão e permite sair *(Val. 7c)*
- [ ] `next` externo e `//host` descartados *(Val. 7d)*
- [ ] Claro/escuro, 360px, só tokens, teclado *(Val. 8)*
- [ ] Detalhe do programa por token **continua anônimo** *(regressão da 015)*
- [ ] `npm run types && npm run lint && ./vendor/bin/pint` limpos

---

## Nota de deploy (T070) — comunicar à clínica ANTES de subir

**O que muda para o paciente**: hoje o login aceita **qualquer** senha — na prática, basta
conhecer o CPF. Depois desta feature a senha é verificada de verdade.

**Ninguém perde acesso**: a senha padrão continua valendo. Quem digitar o CPF entra
normalmente. Pacientes **sem CPF** (estrangeiros) usam o **e-mail** como senha padrão —
é o que `PatientService::create` grava (`password = $cpf ?: $data['email']`).

**O que a clínica precisa saber**:

1. O paciente agora **precisa digitar** a senha (antes o campo nem existia).
2. A senha inicial é o CPF (só dígitos, sem pontos nem traço) — ou o e-mail, para quem não tem CPF.
3. Não há "esqueci minha senha" no v1: paciente sem acesso é reatendido pela clínica.
4. Após 5 tentativas erradas em um minuto o acesso é bloqueado temporariamente. Acertar a senha zera a contagem.

**Sem aviso prévio, o suporte recebe chamados** de pacientes que antes entravam com
qualquer coisa e agora veem "Credenciais inválidas".

## Baseline de testes (T001) — registrado em 2026-08-09

Falhas **pré-existentes** no HEAD, confirmadas por `git stash` antes das mudanças. Não são
regressões desta feature:

| Suíte | Resultado no HEAD |
|-------|-------------------|
| `PullGoogleCalendarJobTest` (2) + `GoogleCalendarConnectionTest` (1) + `TreatmentPlanPdfDownloadTest` (1) | 2 erros + 2 falhas |
| `Architecture / ModuleBoundaryTest` | 3 falhas — `TreatmentProgram` importa `Modules\Patient\Models\Patient` direto (herdado da feature 015) |
| `npm run lint` | 1 erro — `ChevronDown` não usado em `PatientProgramDetailPage.tsx` |
| `npm run types` | limpo |

Após a feature: **mesmas 7 falhas de PHPUnit, mesmo 1 erro de lint**. Nenhuma nova.
