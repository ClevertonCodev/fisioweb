# Phase 0 — Research: Patient Login Area

**Feature**: `specs/016-patient-login-area` | **Date**: 2026-08-08 | **Spec**: [spec.md](./spec.md)

Todas as incógnitas do Technical Context foram resolvidas. Nenhum `NEEDS CLARIFICATION` permanece.

---

## R1 — Módulo dono da capacidade de login do paciente

**Decision**: A capacidade permanece inteiramente no módulo **Patient**. Nenhum código novo em `TreatmentProgram`.

**Rationale**: `modules/Patient` já é o dono da identidade do paciente — `Patient` model (`JWTSubject`), `AuthController`, `routes/api.php` com `patient/auth/*`, provider `patients` em `config/auth.php`. Login é identidade, não prescrição. Mover isso para TreatmentProgram criaria exatamente o acoplamento que `architecture-paradigm-modular-monolith` proíbe.

**Alternatives considered**:
- *Módulo `Auth` transversal novo*: rejeitado — não há segundo consumidor; criaria módulo anêmico e um terceiro lugar para procurar regra de autenticação.
- *Login no TreatmentProgram (perto das telas de destino)*: rejeitado — inverteria a fronteira; TreatmentProgram passaria a conhecer credenciais.

**Consequência de fronteira**: Patient precisa do **nome e slug da clínica** para o passo de escolha e para exibir a clínica no formulário. `Patient` já tem `belongsTo(Clinic::class)` e o `findClinics` atual já faz `with('clinic:id,name')`. Isso é leitura de dado público de identificação, não de regra de negócio de Clinic — mantém-se, agora incluindo `slug`.

---

## R2 — Identificador: aceitar CPF **ou** e-mail

**Decision**: Um único campo `identifier`. O tipo é decidido por formato, **antes** de qualquer consulta:
- Contém `@` → tratado como **e-mail**: `trim` + `mb_strtolower`.
- Caso contrário → tratado como **CPF**: `preg_replace('/\D/', '', $v)`.

A busca é sempre escopada por clínica: `where('clinic_id', $clinicId)->where($field, $normalized)`.

**Rationale**: `patients` tem `unique(['email','clinic_id'])` e `unique(['cpf','clinic_id'])` — logo, identificador + clínica resolve para **no máximo um** paciente. Não há ambiguidade a desempatar dentro de uma clínica. Decidir por formato (e não por tentativa nos dois campos) evita duas queries e evita o vetor em que um valor testa os dois espaços de busca.

**Alternatives considered**:
- *Dois campos separados no formulário (CPF | e-mail)*: rejeitado — a spec pede um campo só, e obrigar o paciente a declarar o tipo é atrito sem ganho.
- *`where('cpf', $v)->orWhere('email', $v)`*: rejeitado — dobra a superfície de busca por valor e complica o índice; com `@` o desempate é determinístico.

**Ponto de atenção**: `patients.cpf` é `string(14)` **nullable**, mas `PatientService::create` grava apenas dígitos. Registros legados podem ter máscara. A normalização na consulta assume dígitos; ver R8 (dívida de dados).

---

## R3 — Verificação real da senha (correção de segurança)

**Decision**: `AuthController::login` passa a repassar a **senha digitada** para `attemptLogin`, nunca o CPF derivado:

```
// hoje  (modules/Patient/.../AuthController.php)
'password' => $cpf,          // ← ignora o que o paciente digitou

// depois
'password' => $request->password,
```

O `LoginRequest` passa a exigir `password`. O restante do fluxo (`BaseAuthController::attemptLogin` → `auth('patient')->attempt`) já valida corretamente contra o hash.

**Rationale**: `Patient` tem cast `'password' => 'hashed'` e a coluna `password` existe desde a migration inicial. O `EloquentUserProvider` já faz `Hash::check` corretamente — **a infraestrutura sempre esteve certa**. O defeito é de uma linha: o controller descarta a senha do request e injeta o CPF. Como `PatientService::create` grava `password = cpf`, o hash armazenado **bate** com o CPF, e o `attempt` passa. Resultado: conhecer o CPF é suficiente para autenticar como o paciente.

Corrigir é remover a substituição. Nenhuma migration, nenhum re-hash, nenhuma quebra de cadastro existente — os hashes atuais continuam válidos e continuam correspondendo ao CPF, que segue sendo a senha padrão comunicada ao paciente.

**Alternatives considered**:
- *Manter e adicionar rate limit por cima*: rejeitado — rate limit atrasa a varredura, não impede o acesso de quem já sabe o CPF de um paciente específico. Não trata a causa.
- *Forçar troca de senha no primeiro acesso*: rejeitado para o v1 — a spec coloca troca de senha fora de escopo, e isso bloquearia o acesso de toda a base existente de uma vez.

**Migração de comportamento**: nenhuma alteração de dados. O que muda para o paciente é que ele agora **precisa digitar** a senha (o CPF) — antes qualquer valor passava.

---

## R4 — Senha padrão nem sempre é o CPF

**Decision**: A UI **não** afirma "sua senha é o seu CPF". Usa texto neutro (ex.: "Senha inicial fornecida pela clínica") com dica secundária de que, por padrão, é o CPF.

**Rationale**: `PatientService::create` grava `'password' => $cpf ?: $data['email']`. Pacientes **sem CPF** (estrangeiros — o model tem `is_foreign`, e `cpf` é nullable enquanto `email` é `NOT NULL`) recebem o **e-mail** como senha padrão. Afirmar categoricamente que a senha é o CPF deixaria esse grupo travado na porta, sem caminho de recuperação — que está fora do escopo do v1.

**Alternatives considered**:
- *Uniformizar a senha padrão para CPF sempre*: rejeitado — impossível para quem não tem CPF.
- *Ramo de UI específico para estrangeiro*: rejeitado — exigiria saber quem é estrangeiro **antes** de autenticar, o que vaza informação de cadastro (viola FR-021).

**Impacto na spec**: refina o FR-012 sem contrariá-lo — CPF continua sendo a senha padrão do caso dominante; a UI apenas não promete isso como regra universal.

---

## R5 — Resolução da clínica: slug do contexto + fallback de escolha

**Decision**: Dois caminhos, um endpoint de descoberta e um de login.

| Caminho | Como chega | Passos |
|---------|-----------|--------|
| **Contextual** | rota com `:clinicSlug` | resolve `clinics.slug` → `clinic_id` → formulário único (identificador + senha) |
| **Descoberta** | rota sem slug | identificador → lista de clínicas → escolhe → senha |

A resolução do slug é feita por uma leitura pública leve (`slug` → `id`, `name`), já que `clinics.slug` é `unique`.

**Rationale**: O paciente chega quase sempre por deep link (`/{clinicSlug}/paciente/programas/{token}`), onde o slug já está na URL — a clínica é conhecida antes de o paciente digitar qualquer coisa. Exigir escolha nesse caminho é atrito puro. O fallback existe porque `clinics.slug` é `nullable`, o slug pode não existir, e o paciente pode acessar o login direto.

**Alternatives considered**:
- *Sempre dois passos*: rejeitado pelo usuário na clarificação — penaliza o caminho dominante.
- *Somente slug*: rejeitado — `clinics.slug` é nullable e favoritos em `/login` ficariam sem porta.

**Endpoint de descoberta**: o `patient/auth/find-clinics` existente é reaproveitado, com duas mudanças — aceitar e-mail além de CPF (R2) e parar de vazar existência de cadastro (R6).

---

## R6 — Não-enumeração de cadastro

**Decision**:
- `login` responde **sempre** `401` com a mesma mensagem (`"Credenciais inválidas."`) para: identificador inexistente, senha errada, paciente inativo, clínica inválida. Já é o comportamento de `BaseAuthController::attemptLogin`; basta não introduzir ramos que o contradigam.
- `find-clinics` deixa de responder `404 "CPF não encontrado."` e passa a responder **`200` com lista vazia** quando não há vínculo.

**Rationale**: O `404` atual transforma o endpoint em um oráculo de CPFs válidos: um atacante varre faixas de CPF e coleta os que existem, junto com o nome das clínicas. Como a senha padrão é derivada do próprio CPF, o par "CPF válido + senha previsível" é comprometimento direto. Resposta uniforme remove o sinal.

O frontend passa a tratar lista vazia com a **mesma** mensagem genérica do erro de credencial — o paciente legítimo que digitou errado recebe orientação, e o atacante não distingue os casos.

**Alternatives considered**:
- *Manter 404 e compensar com rate limit*: rejeitado — reduz a taxa da varredura, não a viabilidade. O sinal continua lá.
- *Resposta com atraso artificial constante*: descartado no v1 — complexidade sem ganho enquanto o corpo da resposta for uniforme.

---

## R7 — Rate limiting

**Decision**: `RateLimiter` do Laravel via middleware `throttle` nomeado, registrado em `AppServiceProvider` (ou provider do módulo Patient), aplicado às três rotas públicas de auth do paciente:

| Rota | Chave | Limite sugerido |
|------|-------|-----------------|
| `POST patient/auth/login` | `identifier + IP` | 5 / minuto |
| `POST patient/auth/find-clinics` | `IP` | 10 / minuto |

Sucesso no login limpa a contagem daquele identificador (`RateLimiter::clear`).

**Rationale**: Não existe **nenhum** `throttle` ou `RateLimiter` no projeto hoje — a busca em `routes/`, `modules/*/routes/` e `app/Providers/` não retorna ocorrência. Isso é greenfield. Usar o `RateLimiter` nativo evita dependência nova e mantém o comportamento inspecionável em teste (`RateLimiter::clear` no `setUp`).

Chave composta `identifier + IP` no login evita que um atacante bloqueie a conta de um paciente específico só disparando tentativas contra o CPF dele (negação de serviço por bloqueio), ao mesmo tempo em que limita a varredura vinda de uma origem.

**Alternatives considered**:
- *Bloqueio só por IP*: rejeitado — atrás de NAT/operadora móvel, pacientes legítimos se bloqueiam mutuamente.
- *Bloqueio só por identificador*: rejeitado — permite que qualquer um bloqueie a conta de um paciente conhecido.
- *Pacote externo de proteção de login*: rejeitado — dependência desnecessária para dois limites simples.

---

## R8 — Elegibilidade: quem pode autenticar

**Decision**: Bloquear login quando `is_active = false`. **Permitir** login para `status` em `INACTIVE_STATUSES` exceto `obito` e `cancelado` — ou seja, paciente com `status = alta` continua entrando.

Em todos os casos bloqueados, a resposta é a **mesma** `401` genérica (R6).

**Rationale**: `is_active` é a flag explícita de desativação do cadastro; respeitá-la é o mínimo. Já `status` é clínico, não de acesso: `alta` significa tratamento concluído, e é justamente quando o paciente ainda quer rever o programa e os exercícios que fez. Bloquear alta puniria o desfecho de sucesso. `obito` e `cancelado` não têm caso de uso de acesso.

`SoftDeletes` no `Patient` já exclui removidos automaticamente do provider Eloquent — sem trabalho extra.

**Alternatives considered**:
- *Bloquear todo `INACTIVE_STATUSES`*: rejeitado — `alta` é desfecho positivo, não perda de acesso.
- *Não filtrar nada além de soft delete*: rejeitado — ignora `is_active`, que existe exatamente para isso.

> **Confirmar com produto**: a inclusão de `alta` entre os que mantêm acesso é a leitura mais defensável, mas é uma decisão de produto. Se a clínica quiser cortar o acesso na alta, é uma linha na regra de elegibilidade.

---

## R9 — Frontend: rota, retorno e estado da barra

**Decision**:

| Item | Resolução |
|------|-----------|
| Rotas | `/:clinicSlug/paciente/login` (contextual) e `/paciente/login` (descoberta). `/login` redireciona para `/paciente/login`. |
| Destino de retorno | `?next=` na query, **validado** contra allowlist de prefixo interno |
| Guard | `patient` — já existe em `AuthGuard` e em `client.ts` |
| Estado da barra | `useAuth()` no `PatientNavbar`; `isAuthenticated && guard === 'patient'` troca "Entrar" por identificação + sair |
| 401 sem sessão | `redirectToLogin('patient')` passa a levar ao login do paciente |

**Rationale sobre o `next`**: guardar o destino na URL (e não em `localStorage`) mantém o login sem estado e sobrevive a recarregar a página. A validação é obrigatória: aceitar `next` cru é *open redirect* clássico — `?next=https://site-falso/...` levaria o paciente autenticado para fora. A allowlist aceita apenas caminhos que começam com `/` (nunca `//`, que o navegador trata como host externo) e que casem com a área do paciente.

**O gap que fecha**: `client.ts:113-122` tem hoje o comentário literal *"Patient: sem tela de login dedicada no SPA ainda — não redireciona para clínica"*, e o interceptor de 401 em `client.ts:163-165` rejeita silenciosamente requisições `/patient/*` sem sessão. Ambos existem porque a tela não existia. Esta feature os torna resolvíveis — é a razão de FR-027 estar na spec.

**Alternatives considered**:
- *Destino em `localStorage`*: rejeitado — vaza entre abas e sobrevive além do fluxo, gerando redirecionamento surpresa.
- *Sempre ir para a lista de programas*: rejeitado — quebra o caminho do deep link, que é o dominante.

---

## R10 — Formulário e camadas do frontend

**Decision**: RHF + Zod, seguindo `forms-shadcn`. Camadas conforme `frontend-ddd`:

```
domain/patient/auth.ts                      # tipos puros (camelCase)
application/patient/use-patient-auth.ts     # mutations + orquestração dos passos
application/patient/patient-auth-paths.ts   # paths do login (irmão de patient-program-paths.ts)
infrastructure/repositories/api-patient-auth.ts  # HTTP + mapeamento snake_case ↔ camelCase
pages/patient/auth/PatientLoginPage.tsx     # sem apiClient, sem axios
routes/patient/auth-routes.tsx              # RouteObject[]
```

**Rationale**: São 2+ campos (identificador + senha, mais seleção de clínica) — a regra 7 do projeto exige RHF + Zod, não `useState`. `ClinicLoginPage` usa `useState` e é **precedente legado**, explicitamente desaconselhado por `forms-shadcn`; copiá-lo propagaria a dívida. O `patient-program-paths.ts` estabelece o padrão de helpers de path por área — o login segue o mesmo.

**Validação Zod**: `identifier` obrigatório com refino de formato (e-mail válido **ou** 11 dígitos após remover não-numéricos); `password` obrigatório. Mensagens em português, coerentes com o restante.

**Alternatives considered**:
- *Espelhar `ClinicLoginPage` com `useState`*: rejeitado — viola regra inegociável 7 do projeto.
- *Reaproveitar `ClinicLoginPage` com prop de guard*: rejeitado — os fluxos divergem (paciente tem escolha de clínica e não tem Google/criar conta); a abstração custaria mais que os dois arquivos.

---

## R11 — Design visual

**Decision**: Tela em coluna única sobre `bg-background`, cartão `bg-card` com `border-border`, acento `primary` restrito a foco de campo, botão principal e indicador de progresso. Reaproveita o `PatientNavbar` em modo simples (marca + alternador de tema, sem "Entrar"). Identificação da clínica em destaque acima dos campos quando o contexto a fornece.

**Rationale**: Os tokens já cobrem claro e escuro (`--primary: 175 70% 35%` claro / `175 70% 45%` escuro; `--card`, `--border`, `--background` definidos nos dois blocos em `resources/css/app.css`). Usar exclusivamente token satisfaz FR-031/FR-032 sem CSS condicional. A decoração de gradiente/blur do `ClinicLoginPage` é reaproveitável em espírito, mas com `primary/10`, mantendo a leitura de "área do paciente" pela marca e pelo selo *Paciente* já presentes no `PatientNavbar`.

**Alternatives considered**:
- *Fundo com imagem (`assets/login-bg.jpg`, usado em outra área)*: rejeitado — peso de download num contexto majoritariamente móvel e 4G, para ganho estético marginal.
- *Split screen com painel lateral ilustrado*: rejeitado — desperdiça a largura no telefone, que é o contexto dominante do paciente.

---

## Resumo das decisões

| # | Decisão | Impacto |
|---|---------|---------|
| R1 | Capacidade fica em `modules/Patient` | Zero mudança em TreatmentProgram |
| R2 | Identificador único, tipo por formato (`@`) | 1 query, sem ambiguidade (unique por clínica) |
| R3 | Repassar a senha digitada ao `attempt` | **Correção de segurança**, 1 linha, sem migration |
| R4 | UI não promete "senha = CPF" | Não trava paciente estrangeiro |
| R5 | Slug fixa clínica; descoberta como fallback | Caminho dominante em 1 etapa |
| R6 | `find-clinics` → 200 lista vazia | Fecha oráculo de CPF |
| R7 | `RateLimiter` nativo, chave `identifier + IP` | Primeiro throttle do projeto |
| R8 | Bloquear `is_active = false`; `alta` mantém acesso | Confirmar com produto |
| R9 | `?next=` validado contra allowlist | Evita open redirect |
| R10 | RHF + Zod, camadas DDD | Não replica dívida do `ClinicLoginPage` |
| R11 | Coluna única, tokens, sem imagem de fundo | Claro/escuro sem CSS condicional |
