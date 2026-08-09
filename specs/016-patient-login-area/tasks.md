# Tasks: Patient Login Area

**Feature**: `016-patient-login-area` · **Plan**: [plan.md](./plan.md)

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: **Incluídos** — SC-003, SC-005, SC-007, SC-009 e SC-012 dizem "verificado por teste", e o plano nomeia três Feature tests. Ver [quickstart.md](./quickstart.md) para os critérios de aceite executáveis.

**Convenções**: Dono = `modules/Patient`. `TreatmentProgram` **não** é tocado. Clean code: Controller fino → FormRequest → Service. FE em camadas DDD (`domain/` → `application/` → `infrastructure/` → page). Paths relativos ao repo.

**Não negociar**:
- A senha digitada **é** verificada — `AuthController::login` para de injetar o CPF no lugar dela
- Falha de identificador, senha, elegibilidade e clínica → **mesma** resposta `401`
- `find-clinics` sem vínculo → `200 {"data":[]}`, nunca `404`
- **Nenhuma migration** — `patients.password` e os índices já existem
- O detalhe do programa por token **continua anônimo** (regressão da feature 015)

**Skills**: `security`, `backend-clean-code`, `backend-module`, `php-modern`, `php-testing`, `api-client`, `frontend-ddd`, `forms-shadcn`, `frontend-ui-patterns`, `frontend-testing`

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizável (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1–US5 conforme [spec.md](./spec.md)
- Toda tarefa inclui path de arquivo

---

## Phase 1: Setup

**Purpose**: Baseline verificável e bootstrap de teste do módulo

- [X] T001 Registrar baseline em `specs/016-patient-login-area/quickstart.md` (seção de notas): saída de `composer run test`, `npm run test`, `npm run types` e `npm run lint` **antes** de qualquer mudança, para distinguir falha pré-existente de regressão introduzida
- [X] T002 **Capturar a prova do defeito**: executar o `curl` da Validação 1 de [quickstart.md](./quickstart.md) contra `POST /api/patient/auth/login` com senha errada e registrar a resposta `200` com `access_token` — é o antes do par de contraste que T015 fecha
- [X] T003 Criar pastas vazias `modules/Patient/app/Support/`, `resources/js/pages/patient/auth/` e confirmar que `modules/Patient/tests/Feature/` existe (hoje só com `.gitkeep`)
- [X] T004 Verificar bootstrap de Feature test do módulo em `modules/Patient/tests/Feature/`: criar um teste mínimo que use `RefreshDatabase` e `Patient::factory()` (via `modules/Patient/database/factories/PatientFactory.php`) e confirmar que roda com `vendor/bin/phpunit --filter=...`. Estes são os **primeiros** Feature tests do módulo — resolver problema de bootstrap aqui, antes de empilhar casos

**Checkpoint**: baseline registrado, defeito documentado, factory e `RefreshDatabase` funcionando.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Value Object do identificador, tipos de domínio e camada de acesso HTTP — **bloqueia todas as user stories**

**⚠️ CRITICAL**: Nenhuma US começa antes do checkpoint desta fase

- [X] T005 Criar `modules/Patient/app/Support/PatientIdentifier.php` — Value Object readonly (`php-modern`) com `type` (`email`|`cpf`), `value` normalizado e `column()`. Classificação por presença de `@`; e-mail → `trim` + `mb_strtolower`; CPF → `preg_replace('/\D/','',$v)`. **Sem** validação de dígito verificador — rejeitar CPF matematicamente inválido revelaria, pela diferença de mensagem, quais valores sequer são consultados (ver invariante em [data-model.md](./data-model.md#2-estruturas-em-memória-novas))
- [X] T006 [P] Criar `modules/Patient/tests/Unit/PatientIdentifierTest.php` cobrindo a tabela de normalização de [data-model.md](./data-model.md): `123.456.789-00`, `123 456 789 00`, `12345678900` → `cpf`/`12345678900`; `  Joao@Clinica.COM ` → `email`/`joao@clinica.com`
- [X] T007 [P] Criar `modules/Patient/app/Services/PatientAuthService.php` — resolve `PatientIdentifier`, aplica elegibilidade e monta a lista de clínicas. Regra de elegibilidade conforme [data-model.md](./data-model.md#4-elegibilidade-para-autenticar): bloqueia `is_active = false`, `status` `obito`/`cancelado`; **permite `status = alta`**. **Não** reusar `Patient::scopeActiveStatus` — o conjunto de login é deliberadamente diferente do conjunto do dashboard, e acoplá-los faria uma mudança quebrar a outra silenciosamente
- [X] T008 [P] Criar `resources/js/domain/patient/auth.ts` — tipos puros camelCase (`PatientIdentity`, `ClinicOption`, `PatientLoginCredentials`) conforme [data-model.md](./data-model.md#5-estado-do-frontend). Sem `_at`, sem prefixo `Api`, sem constante de UI (regra 6 do projeto)
- [X] T009 [P] Criar `resources/js/application/patient/patient-auth-paths.ts` — helpers de path do login (`patientLoginPath(clinicSlug?)`), espelhando o padrão de `resources/js/application/patient/patient-program-paths.ts`. A validação do `next` entra em T044 (US3)
- [X] T010 Criar `resources/js/infrastructure/repositories/api-patient-auth.ts` — único ponto de HTTP do login; usa `apiClient` e mapeia `snake_case ↔ camelCase`. Funções `findClinics(identifier)` e `login(credentials)` contra `/patient/auth/*` conforme [contracts/patient-auth-rest.md](./contracts/patient-auth-rest.md). O guard `patient` já é inferido pela URL em `resources/js/infrastructure/api/client.ts:16` — **não** alterar `inferGuardFromApiUrl`
- [X] T011 Exportar o novo repository em `resources/js/infrastructure/repositories/index.ts`
- [X] T012 Criar `resources/js/application/patient/use-patient-auth.ts` — hooks TanStack Query: `useFindPatientClinics()` e `usePatientLogin()`, integrando com `login` do `useAuth()` (`resources/js/contexts/AuthContext.tsx`) para persistir a sessão no guard `patient`

**Checkpoint**: VO testado, Service de auth disponível, camada FE de acesso pronta. US1 pode começar.

---

## Phase 3: User Story 1 — Login a partir do contexto da clínica (P1) 🎯 MVP

**Goal**: O paciente que chega por deep link aciona "Entrar", vê a clínica identificada e autentica em **uma única etapa** com CPF ou e-mail e senha verificada.

**Independent Test**: A partir de um deep link válido, acionar "Entrar", confirmar a clínica na tela, autenticar com credenciais válidas e chegar autenticado. Senha errada deve falhar.

### Backend — a correção de segurança

- [X] T013 [US1] Alterar `modules/Patient/app/Http/Requests/LoginRequest.php`: `cpf` → `identifier` (required, string, max 255), **adicionar `password`** (required, string), manter `clinic_id` (required, integer, exists)
- [X] T014 [US1] Em `modules/Patient/app/Http/Controllers/AuthController.php`, garantir que falha de validação de `clinic_id` **não** produza `422` com o campo que falhou — converter para o `401` genérico, ou mover a checagem para o Service. Campo ausente (`identifier`/`password` não enviados) pode seguir `422`: é erro de cliente, não sinal sobre o cadastro ([contracts/patient-auth-rest.md](./contracts/patient-auth-rest.md#princípio-transversal--respostas-indistinguíveis))
- [X] T015 [US1] **[CORREÇÃO DE SEGURANÇA]** Em `modules/Patient/app/Http/Controllers/AuthController.php`, substituir no `login()` o array de credenciais: trocar `'cpf' => $cpf` por `$identifier->column() => $identifier->value` e — o ponto central — trocar `'password' => $cpf` por `'password' => $request->password`. Hoje o Controller descarta a senha digitada e injeta o CPF do próprio request; como `PatientService::create` grava `password = cpf`, o hash bate e **conhecer o CPF autentica**. Sem migration, sem re-hash: os hashes existentes seguem válidos e seguem correspondendo ao CPF
- [X] T016 [US1] Em `modules/Patient/app/Http/Controllers/AuthController.php`, aplicar a elegibilidade de `PatientAuthService` **após** o `attempt` bem-sucedido; reprovando, invalidar o token emitido e responder o `401` genérico
- [X] T017 [US1] Emagrecer `modules/Patient/app/Http/Controllers/AuthController.php` conforme `backend-clean-code`: normalização e elegibilidade vivem no Service/VO, o Controller só orquestra e responde

### Backend — testes

- [X] T018 [P] [US1] Criar `modules/Patient/tests/Feature/PatientLoginTest.php` — **o caso central**: senha errada com identificador correto retorna `401`; senha padrão (CPF) retorna `200` com `access_token`. As duas metades importam: recusar tudo também "fecharia" o defeito e quebraria a base inteira
- [X] T019 [P] [US1] Em `modules/Patient/tests/Feature/PatientLoginTest.php`, cobrir SC-004: `123.456.789-00`, `12345678900`, `  Maria@Exemplo.COM ` e e-mail em minúsculas autenticam o **mesmo** `user.id`
- [X] T020 [P] [US1] Em `modules/Patient/tests/Feature/PatientLoginTest.php`, cobrir elegibilidade ([quickstart.md](./quickstart.md) Val. 4): `is_active=false`, `status=obito`, `status=cancelado` e soft-deleted → `401`; **`status=alta` → `200`**
- [X] T021 [P] [US1] Em `modules/Patient/tests/Feature/PatientLoginTest.php`, cobrir SC-006: identificador inexistente, senha errada e paciente inativo produzem respostas **idênticas** em status e corpo
- [X] T022 [P] [US1] Em `modules/Patient/tests/Feature/PatientLoginTest.php`, cobrir isolamento (SC-003): o mesmo CPF em duas clínicas autentica identidades distintas; a sessão de uma não acessa dados da outra
- [X] T023 [P] [US1] Em `modules/Patient/tests/Feature/PatientLoginTest.php`, cobrir SC-012: `password` não aparece na resposta (`$hidden` do model) nem em log

### Frontend

- [X] T024 [US1] Criar `resources/js/pages/patient/auth/PatientLoginPage.tsx` — estado `CREDENTIALS` com clínica fixada pelo slug. **RHF + Zod** (regra 7 do projeto), `identifier` + `password` com alternador de visibilidade. **Não** copiar o `useState` de `resources/js/pages/clinic/ClinicLoginPage.tsx`, que é precedente legado desaconselhado por `forms-shadcn`
- [X] T025 [US1] Aplicar o design de [research.md](./research.md#r11--design-visual) em `resources/js/pages/patient/auth/PatientLoginPage.tsx`: coluna única sobre `bg-background`, cartão `bg-card` + `border-border`, `primary` só em foco/ação/progresso, `PatientNavbar` em modo simples no topo. **Somente tokens** — nada de hex ou `text-red-500`. Sem imagem de fundo (contexto móvel/4G)
- [X] T026 [US1] Exibir a clínica resolvida pelo slug em destaque acima dos campos em `resources/js/pages/patient/auth/PatientLoginPage.tsx` — é informação de segurança, não decoração: o paciente precisa vê-la **antes** de digitar a senha
- [X] T027 [US1] Texto da senha em `resources/js/pages/patient/auth/PatientLoginPage.tsx` **neutro** (ex.: "Senha inicial fornecida pela clínica"), sem afirmar "sua senha é o seu CPF". `PatientService::create` grava `password = $cpf ?: $data['email']` — pacientes sem CPF recebem o **e-mail** como senha, e promessa categórica os travaria sem recuperação (fora do escopo v1 — ver [research.md](./research.md#r4--senha-padrão-nem-sempre-é-o-cpf))
- [X] T028 [US1] Criar `resources/js/routes/patient/auth-routes.tsx` com a rota `/:clinicSlug/paciente/login`, espelhando `resources/js/routes/patient/program-routes.tsx`
- [X] T029 [US1] Registrar `patientAuthRoutes` em `resources/js/app.tsx` (junto de `patientProgramRoutes`)
- [X] T030 [US1] Em `resources/js/components/PatientNavbar.tsx`, apontar o botão "Entrar" para o login do paciente via `patientLoginPath()` — hoje navega para `/login`, rota inexistente que cai no `NotFound`
- [X] T031 [P] [US1] Criar `resources/js/test/api-patient-auth.test.ts` — mapeamento `snake_case ↔ camelCase` e forma da requisição de `login`
- [X] T032 [P] [US1] Criar `resources/js/test/patient-login-page.test.tsx` — render com clínica fixada, validação Zod do `identifier`, submit e exibição de erro genérico

**Checkpoint**: US1 entregue e testável isoladamente. **Este é o MVP** — o defeito de segurança está fechado e o caminho dominante funciona.

---

## Phase 4: User Story 2 — Login sem contexto de clínica (P1)

**Goal**: Sem slug na URL, o paciente informa o identificador, escolhe entre as clínicas em que tem cadastro e autentica.

**Independent Test**: Acessar o login sem contexto com um CPF cadastrado em duas clínicas; ambas aparecem; escolher uma e autenticar naquela especificamente.

### Backend

- [X] T033 [US2] Criar `modules/Patient/app/Http/Requests/FindClinicsRequest.php` — `identifier` (required, string, max 255), substituindo a regra atual `['cpf' => ['required','string']]` que não aceita e-mail
- [X] T034 [US2] **[SEGURANÇA]** Alterar `findClinics()` em `modules/Patient/app/Http/Controllers/AuthController.php`: sem vínculo passa a responder `200 {"data":[]}` em vez de `404 {"message":"CPF não encontrado."}`. O `404` atual é um oráculo — varrer faixas de CPF revela quais existem e em quais clínicas, e como a senha padrão deriva do CPF, esse sinal é meio caminho para o comprometimento
- [X] T035 [US2] Em `modules/Patient/app/Http/Controllers/AuthController.php`, usar `PatientIdentifier` no `findClinics()` para aceitar e-mail além de CPF, e incluir **`slug`** no select da clínica (`with('clinic:id,name,slug')`) — o frontend precisa do slug para montar o destino pós-login
- [X] T036 [US2] Em `modules/Patient/app/Services/PatientAuthService.php`, excluir da lista as clínicas onde o paciente é **inelegível** (R8) — uma clínica que apareceria como opção e depois falharia no login é pior que não aparecer
- [X] T037 [P] [US2] Criar `modules/Patient/tests/Feature/PatientFindClinicsTest.php` — identificador sem vínculo retorna `200` com `data` vazio (**não** `404`); CPF e e-mail descobrem as mesmas clínicas; CPF em 2 clínicas retorna 2 itens com `id`, `name`, `slug`; clínica com paciente inativo não aparece; `slug` nulo é tolerado

### Frontend

- [X] T038 [US2] Implementar os estados `IDENTIFIER` e `CLINIC` em `resources/js/pages/patient/auth/PatientLoginPage.tsx` conforme a máquina de estados de [data-model.md](./data-model.md#5-estado-do-frontend); com exatamente uma clínica, pular a escolha e ir direto para `CREDENTIALS`
- [X] T039 [US2] Garantir em `resources/js/pages/patient/auth/PatientLoginPage.tsx` que voltar de `CLINIC` para `IDENTIFIER` **preserva o que foi digitado** (estado do formulário RHF, não remontagem) — US2/AS5
- [X] T040 [US2] Exibir a resposta de lista vazia em `resources/js/pages/patient/auth/PatientLoginPage.tsx` com a **mesma** mensagem genérica do erro de credencial — o paciente legítimo recebe orientação e o atacante não distingue os casos (FR-021)
- [X] T041 [US2] Adicionar a rota `/paciente/login` (sem slug) em `resources/js/routes/patient/auth-routes.tsx`
- [X] T042 [US2] Adicionar em `resources/js/app.tsx` o redirect de `/login` para `/paciente/login`, preservando a query string
- [X] T043 [P] [US2] Estender `resources/js/test/patient-login-page.test.tsx` — fluxo de dois passos, atalho de clínica única, preservação do identificador ao voltar, mensagem genérica em lista vazia

**Checkpoint**: os dois caminhos de entrada funcionam; o oráculo de CPF está fechado.

---

## Phase 5: User Story 3 — Retorno ao ponto de origem (P1)

**Goal**: Após autenticar, o paciente volta para onde estava indo — e nunca para fora da aplicação.

**Independent Test**: Abrir deep link sem login, acionar "Entrar", autenticar e confirmar retorno ao mesmo programa. Testar `next` externo e confirmar descarte.

- [X] T044 [US3] Adicionar em `resources/js/application/patient/patient-auth-paths.ts` a função de validação do `next`: aceita apenas caminho iniciado por `/` que case com a área do paciente; **rejeita** URL absoluta (`http://`, `https://`), protocolo relativo (`//host`) e caminho fora da área do paciente; fallback para `patientProgramsListPath(clinicSlug)`
- [X] T045 [P] [US3] Criar `resources/js/test/patient-auth-paths.test.ts` cobrindo SC-009 — em especial **`//exemplo-externo.com`**, que uma checagem ingênua de "começa com `/`" aceita e que o navegador resolve como host externo: é o caso que transforma o `next` em open redirect
- [X] T046 [US3] Em `resources/js/components/PatientNavbar.tsx`, incluir o caminho atual em `?next=` ao navegar para o login
- [X] T047 [US3] Em `resources/js/pages/patient/auth/PatientLoginPage.tsx`, consumir o `next` **validado** após autenticação bem-sucedida; sem `next`, ir para a lista de programas da clínica autenticada
- [X] T048 [US3] Em `resources/js/pages/patient/auth/PatientLoginPage.tsx`, redirecionar o paciente **já autenticado** em vez de mostrar o formulário (FR-006)
- [X] T049 [US3] Em `resources/js/infrastructure/api/client.ts`, implementar o ramo `patient` de `redirectToLogin()` (linhas 113-122, hoje só um comentário dizendo que a tela não existe) e fazer o 401 de `/patient/*` sem sessão (linhas 163-165, hoje rejeitado em silêncio) redirecionar ao login com `next` preenchido — é o que satisfaz FR-027
- [X] T050 [P] [US3] Estender `resources/js/test/patient-login-page.test.tsx` — retorno ao `next` válido, descarte do `next` externo, redirect de quem já está autenticado

**Checkpoint**: o fluxo completo do deep link fecha o ciclo, sem open redirect.

---

## Phase 6: User Story 4 — Estado autenticado na barra (P2)

**Goal**: A barra reflete a sessão e permite sair.

**Independent Test**: Autenticar, confirmar identificação na barra sem "Entrar"; sair e confirmar volta ao estado anônimo.

- [X] T051 [US4] Em `resources/js/components/PatientNavbar.tsx`, consumir `useAuth()` e trocar "Entrar" por identificação do paciente + ação de sair quando `isAuthenticated && guard === 'patient'`
- [X] T052 [US4] Em `resources/js/components/PatientNavbar.tsx`, implementar sair via `logout('patient')` — `clearStoredAuth` já é por guard, então sessões `admin`/`clinic` no mesmo navegador não são afetadas (FR-026)
- [X] T053 [US4] Garantir que a identificação e o menu de sair em `resources/js/components/PatientNavbar.tsx` sigam `frontend-ui-patterns`: painel flutuante usa `bg-popover` + `hover:bg-accent` (**nunca** `bg-sidebar-*`), com `cursor-pointer`
- [X] T054 [US4] Preservar o modo contextual do `resources/js/components/PatientNavbar.tsx` (título/contador da execução) ao adicionar o estado autenticado — os dois modos coexistem
- [X] T055 [P] [US4] Criar `resources/js/test/patient-navbar.test.tsx` — anônimo mostra "Entrar"; autenticado mostra identificação + sair; sair volta ao estado anônimo

**Checkpoint**: a sessão é visível e reversível.

---

## Phase 7: User Story 5 — Rate limiting (P2)

**Goal**: Tentativas em massa e varredura de CPF ficam inviáveis.

**Independent Test**: Disparar tentativas malsucedidas sucessivas e confirmar `429` após o limite; autenticar com senha correta e confirmar que a contagem zera.

> **Primeiro throttle do projeto.** Não existe `RateLimiter` nem middleware `throttle` em `routes/`, `modules/*/routes/` ou `app/Providers/`. O nome e o formato adotados aqui viram, na prática, a referência para os logins de clínica e admin — que também estão sem limite hoje. Escolher com esse peso.

- [X] T056 [US5] Registrar os limiters nomeados em `modules/Patient/app/Providers/PatientServiceProvider.php`: `patient-login` com chave **`identifier` normalizado + IP** (~5/min) e `patient-find-clinics` com chave IP (~10/min). Chave composta no login porque só IP bloqueia pacientes legítimos atrás de NAT de operadora, e só identificador permite que qualquer um bloqueie a conta de um paciente cujo CPF conheça
- [X] T057 [US5] Aplicar `middleware('throttle:patient-login')` e `middleware('throttle:patient-find-clinics')` nas rotas públicas em `modules/Patient/routes/api.php` conforme [contracts/patient-auth-rest.md](./contracts/patient-auth-rest.md#7-estrutura-de-rotas-resultante)
- [X] T058 [US5] Em `modules/Patient/app/Http/Controllers/AuthController.php`, chamar `RateLimiter::clear` da chave do identificador após login bem-sucedido (FR-024)
- [X] T059 [US5] Tratar `429` em `resources/js/pages/patient/auth/PatientLoginPage.tsx` com mensagem própria, distinta do erro de credencial — aqui informar é correto: não revela nada sobre o cadastro e orienta o paciente legítimo a esperar
- [X] T060 [P] [US5] Criar `modules/Patient/tests/Feature/PatientAuthThrottleTest.php` — `429` após o limite em `login` e `find-clinics`; sucesso zera a contagem; período expirado libera. Chamar `RateLimiter::clear()` no `setUp`, senão um teste envenena o seguinte

**Checkpoint**: superfície de ataque fechada.

---

## Phase 8: Polish & Cross-Cutting

- [X] T061 [P] Acessibilidade em `resources/js/pages/patient/auth/PatientLoginPage.tsx`: campos rotulados, navegáveis por Tab, Enter envia, erro anunciável por leitor de tela (FR-036)
- [X] T062 [P] Teclado móvel apropriado ao tipo de identificador em `resources/js/pages/patient/auth/PatientLoginPage.tsx` (FR-037)
- [ ] T063 [P] **PENDENTE — exige navegador**. Verificar claro/escuro e 360px sem rolagem horizontal em `resources/js/pages/patient/auth/PatientLoginPage.tsx` (SC-011). Código usa só tokens e layout de coluna única com `max-w-md`, mas a conferência visual não foi executada
- [X] T064 [P] Rodar `grep -nE "#[0-9a-fA-F]{3,6}|text-(red|green|blue)-[0-9]" resources/js/pages/patient/auth/` — deve sair vazio (FR-031)
- [X] T065 [P] Rodar os fitness checks de [contracts/module-boundaries.md](./contracts/module-boundaries.md#5-fitness-check): `Patient` não conhece `TreatmentProgram`; `TreatmentProgram` não conhece o auth do paciente; página não importa `apiClient`
- [X] T066 **Regressão da feature 015**: confirmar em `resources/js/routes/patient/program-routes.tsx` que `/:clinicSlug/paciente/programas/:publicToken` **continua abrindo sem login** — nenhuma tela hoje pública pode ter virado autenticada
- [X] T067 Executar a Validação 1 de [quickstart.md](./quickstart.md) e comparar com o registro de T002: senha errada agora `401`, senha padrão ainda `200` — é o par de contraste que prova a correção
- [ ] T068 **PARCIAL — exige navegador**. Val. 1 a 6 e 8 cobertas por teste automatizado; a Val. 7 (percurso no navegador: deep link → Entrar → autenticar → volta ao programa) não foi executada
- [X] T069 Rodar `./vendor/bin/pint`, `npm run types`, `npm run lint`, `composer run test`, `npm run test` na raiz do repo — comparar com o baseline registrado em `specs/016-patient-login-area/quickstart.md` (T001)
- [X] T070 Redigir nota de deploy em `specs/016-patient-login-area/quickstart.md` (seção final): pacientes hoje entram com **qualquer** senha; após a correção precisam digitar o CPF (ou o e-mail, quem não tem CPF). Ninguém perde acesso — a senha padrão continua valendo — mas sem aviso prévio o suporte recebe chamados

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ─── BLOQUEIA TUDO
    ↓
Phase 3 (US1) 🎯 MVP ─── correção de segurança + caminho dominante
    ↓
Phase 4 (US2) ─── depende do VO (T005) e da página (T024)
    ↓
Phase 5 (US3) ─── depende de paths (T009) e da página
    ↓
Phase 6 (US4) ─── independente de US2/US3; só precisa de US1
    ↓
Phase 7 (US5) ─── independente; só precisa das rotas existirem
    ↓
Phase 8 (Polish)
```

**Independências reais**:
- **US4** (barra) e **US5** (throttle) não dependem de US2 nem de US3 — podem ir em paralelo assim que US1 fechar
- **US5** é quase autônoma: mexe em provider, rotas e um `catch` na página
- **US2** e **US3** tocam o mesmo arquivo de página (`PatientLoginPage.tsx`) — sequenciar para evitar conflito

**Ordem de arquivo compartilhado** (não paralelizar entre si):
- `AuthController.php`: T014 → T015 → T016 → T017 → T034 → T035 → T058
- `PatientLoginPage.tsx`: T024 → T025 → T026 → T027 → T038 → T039 → T040 → T047 → T048 → T059
- `PatientNavbar.tsx`: T030 → T046 → T051 → T052 → T053 → T054
- `auth-routes.tsx`: T028 → T041
- `app.tsx`: T029 → T042

---

## Parallel Execution Examples

**Phase 2** — quatro arquivos independentes:
```
T006 (PatientIdentifierTest)  ‖  T007 (PatientAuthService)
T008 (domain/auth.ts)         ‖  T009 (patient-auth-paths.ts)
```

**Phase 3** — a bateria de testes backend, após T015 fechar a correção:
```
T018 ‖ T019 ‖ T020 ‖ T021 ‖ T022 ‖ T023   (mesmo arquivo, casos independentes)
T031 ‖ T032                                (arquivos de teste FE distintos)
```

**Após US1** — três frentes simultâneas:
```
Dev A: Phase 4 (US2)   — find-clinics + estados do formulário
Dev B: Phase 6 (US4)   — barra autenticada
Dev C: Phase 7 (US5)   — rate limiting
```

**Phase 8** — verificações independentes:
```
T061 ‖ T062 ‖ T063 ‖ T064 ‖ T065
```

---

## Implementation Strategy

### MVP = Phase 1 + 2 + 3 (US1)

Entrega o essencial: **o defeito de segurança fechado** e o caminho dominante funcionando. Um paciente que chega por deep link consegue entrar, e quem só sabe o CPF de outro paciente deixa de conseguir.

Se o tempo apertar, T015 sozinha (uma linha) já elimina a falha — mas sem a tela o botão "Entrar" continua quebrado, então US1 inteira é o corte mínimo defensável.

### Incrementos

| Incremento | Fases | Entrega |
|-----------|-------|---------|
| 1 — MVP | 1, 2, 3 | Correção de segurança + login contextual |
| 2 | 4 | Login sem contexto + oráculo de CPF fechado |
| 3 | 5 | Retorno ao ponto de origem, sem open redirect |
| 4 | 6, 7 | Barra autenticada + rate limiting (paralelizáveis) |
| 5 | 8 | Acessibilidade, regressão, nota de deploy |

### Ordem sugerida de execução

1. **T002 primeiro.** Capturar a resposta `200` com senha errada **antes** de mudar qualquer coisa — sem esse registro, não há como provar depois que a correção fez efeito.
2. **T004 antes de qualquer teste.** `modules/Patient/tests/Feature/` está vazio; resolver bootstrap uma vez, não a cada caso.
3. **T015 cedo.** É uma linha e é o coração da feature.
4. **T070 antes do deploy, não depois.** A mudança de comportamento é visível para todo paciente que já usa o sistema.
