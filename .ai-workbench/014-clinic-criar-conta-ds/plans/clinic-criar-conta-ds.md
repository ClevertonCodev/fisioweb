# Criar conta da clínica no DS v2 com confirmação de e-mail (front + backend)

Data: 2026-11-01
Fonte: `decisoes.md`, conversa com o usuário e `docs/prototipos-v2.md`

## Problema

A rota pública `/clinica/criar-conta` hoje não cria conta de verdade: tanto a tela v1 (`ClinicRegisterPageV1`) quanto o protótipo do DS v2 (`register-prototype/VariantA`) são apenas visuais e não chamam o backend. Além disso, o backend não possui endpoint público de auto-cadastro de clínica, o `ClinicObserver` cria o usuário mestre com senha igual ao CPF/CNPJ (o que descartaria a senha escolhida no cadastro), e a coluna `email_verified_at` de `clinic_users` nunca é preenchida nem exigida no login.

## Solução

Transformar o protótipo A ("Três passos": Sua clínica → Seu acesso → Endereço dos links) na tela oficial de `/clinica/criar-conta` usando React Hook Form + Zod e o Design System v2 (`@/components/ds`), conectada ao novo endpoint público `POST /api/clinic/auth/register` e à consulta pública de disponibilidade de endereço (`GET /api/clinic/auth/slug-availability`). A clínica nasce ativa (`status = 1`) no plano `Premium` e o usuário mestre nasce com a senha escolhida, data/hora de aceite dos termos (`terms_accepted_at`) e `email_verified_at = null`. Um e-mail com link assinado de 24 horas é enviado pela fila para `/clinica/confirmar-email`, e o login passa a exigir e-mail confirmado para novos auto-cadastros sem bloquear usuários já existentes ou criados pelo painel administrativo.

## Histórias de Usuário

1. Como fisioterapeuta autônomo ou gestor de clínica, quero cadastrar minha clínica em três passos curtos (`/clinica/criar-conta`), informando nome, tipo (PF/PJ) e CPF/CNPJ válido no primeiro passo, para começar a usar o sistema sem depender do suporte.
2. Como pessoa criando a conta da clínica, quero escolher meu e-mail de acesso, telefone opcional e uma senha com pelo menos 8 caracteres (vendo a orientação de força da senha), para que eu entre como usuário mestre com a senha que defini.
3. Como pessoa criando a conta da clínica, quero que o endereço dos links dos pacientes (`slug`) seja sugerido automaticamente a partir do nome da clínica até que eu o edite manualmente, mostrando a prévia real `{host}/{slug}/paciente/programas/…`.
4. Como pessoa criando a conta da clínica, quero saber enquanto digito o endereço (`slug`) se ele está disponível, já pertence a outra clínica ou é reservado pelo sistema, para não descobrir conflito de endereço só depois de enviar.
5. Como pessoa criando a conta da clínica, quero marcar o aceite obrigatório dos Termos de Uso e Política de Privacidade (LGPD) no último passo antes de criar a conta, ficando registrado o momento do aceite.
6. Como pessoa criando a conta da clínica, quero que um erro `422` vindo do servidor (como e-mail ou documento já cadastrado) apareça no respectivo campo e volte automaticamente para o passo onde aquele campo está, mantendo tudo o que já preenchi.
7. Como pessoa que acabou de criar a conta, quero ver a tela de confirmação informando para qual e-mail o link foi enviado e poder clicar em "Reenviar e-mail" (respeitando espera de 30 segundos), caso a mensagem demore ou caia no spam.
8. Como pessoa que recebeu o e-mail de confirmação, quero abrir `/clinica/confirmar-email` pelo link assinado e ter meu e-mail confirmado automaticamente (com resposta idempotente se eu abrir o mesmo link de novo), podendo seguir direto para o login.
9. Como pessoa cujo link de confirmação venceu ou foi corrompido, quero ver uma mensagem clara em `/clinica/confirmar-email` e poder solicitar um novo link informando meu e-mail.
10. Como pessoa que tenta entrar em `/clinica/login` com a senha certa antes de confirmar o e-mail, quero ver o aviso pedindo a confirmação do e-mail e um atalho direto para reenviar o link de confirmação.
11. Como cliente atual do fisioweb (ou usuário criado pelo administrador master ou administrador da clínica), quero continuar entrando normalmente sem ficar trancado pela exigência de confirmação de e-mail.
12. Como plataforma fisioweb, quero proteger o auto-cadastro, o login e o reenvio contra enumeração de clientes e abuso por força bruta com rate limit por rota/IP/e-mail e respostas neutras no login e no reenvio.
13. Como equipe de engenharia, quero remover a tela v1 de cadastro, a pasta `register-prototype/` e o seletor `?variant=`, mantendo uma única implementação limpa no DS v2.

## Decisões de Implementação

- **Módulo dono (backend):** `modules/Clinic` é dono de `clinics`, `clinic_users` e de todo o fluxo de autenticação, auto-cadastro e confirmação de e-mail da clínica.
- **Colaboração entre módulos (`Clinic` → `Admin`):** para vincular a clínica recém-cadastrada ao plano `Premium` sem importar o Model privado `Modules\Admin\Models\Plan` em `Clinic`, o módulo `Admin` expõe o contrato público `Modules\Admin\Contracts\Public\PlanCatalogReadServiceInterface` (`findPlanIdByName(string $name): ?int`), implementado por `PlanCatalogReadService` e registrado no `AdminServiceProvider`. Se o plano `Premium` não estiver semeado (ex.: testes isolados), `plan_id` fica `null`.
- **Migrations em `modules/Clinic/database/migrations/`:**
  1. Backfill de `email_verified_at = now()` para todos os registros existentes de `clinic_users` onde `email_verified_at` é nulo, garantindo que nenhum usuário atual seja bloqueado no deploy.
  2. Inclusão de `terms_accepted_at` (`timestamp`, nullable) em `clinics` e `clinic_users` para registrar o aceite de Termos de Uso / LGPD no auto-cadastro.
- **Conflito com `ClinicObserver::created`:**
  - `ClinicObserver::created` passa a preencher `email_verified_at = now()` quando cria o usuário mestre no fluxo administrativo, e respeita uma flag/contexto explícito ou criação sem disparar duplicata no auto-cadastro (por exemplo, `Clinic::withoutEvents` dentro do caso de uso de auto-cadastro ou guarda explícita), garantindo que no auto-cadastro o usuário mestre seja criado uma única vez, com `password = Hash::make($dto->password)`, `email_verified_at = null` e `terms_accepted_at = now()`, sem nunca gravar o documento como senha.
  - `ClinicUserService::create` (criação de membro da equipe pelo admin da clínica) também passa a definir `email_verified_at = now()`.
- **Contratos dos endpoints (`modules/Clinic/routes/api.php`, públicos com throttle):**
  - `GET /api/clinic/auth/slug-availability?slug={slug}` (`throttle:clinic-slug-check`, 30/min por IP):
    - Normaliza `trim` + `mb_strtolower`.
    - Saída `200`: `{ "data": { "available": bool, "reason": "taken" | "reserved" | "invalid" | null } }`.
  - `POST /api/clinic/auth/register` (`throttle:clinic-register`, 5/min por IP):
    - Entrada: `name`, `type_person` (`fisica` | `juridica`), `document` (apenas dígitos, CPF/CNPJ válido), `email` (único em `clinics` e em `clinic_users` inclusive `withTrashed`), `phone` (opcional, 10 ou 11 dígitos), `slug` (formato `^[a-z0-9]+(?:-[a-z0-9]+)*$`, não reservado, único em `clinics` inclusive `withTrashed`), `password` (mín. 8, `confirmed`), `password_confirmation`, `terms_accepted` (`accepted`).
    - Saída `201`: `{ "data": { "clinic_id": int, "email": string }, "message": string }` (sem emitir token JWT).
  - `POST /api/clinic/auth/verify-email` (`throttle:clinic-password`, 5/min por rota e IP):
    - Entrada: `id` (int), `hash` (sha1 do e-mail), `expires` (int timestamp), `signature` (HMAC assinado com a chave da aplicação).
    - Valida assinatura, expiração (24 h) e correspondência do `hash` com o e-mail atual do `ClinicUser`.
    - Se válido, preenche `email_verified_at = now()` se ainda estava nulo; se já estava confirmado, responde `200` de forma idempotente. Se vencido, adulterado ou de outro usuário, responde `422` com `{ "message": "Link de confirmação inválido ou expirado. Solicite um novo link." }`.
  - `POST /api/clinic/auth/verify-email/resend` (`throttle:clinic-password`, 5/min por rota e IP):
    - Entrada: `email` (formato de e-mail válido).
    - Saída `200` sempre idêntica (`{ "message": "Se houver um cadastro pendente com este e-mail, enviamos um novo link de confirmação." }`), disparando o job de e-mail na fila apenas se existir `ClinicUser` ativo, não excluído e com `email_verified_at` nulo.
- **Bloqueio no login (`POST /api/clinic/auth/login`):**
  - A checagem ocorre em `AuthController::canLogIn` somente após `auth('clinic')->attempt($credentials)` validar a senha, para nunca revelar se o e-mail existe quando a senha está errada.
  - Se o usuário estiver inativo (`status !== STATUS_ACTIVE`), mantém a mensagem `"Seu acesso está desativado. Fale com o administrador da clínica."`.
  - Se `is_null($user->email_verified_at)`, invalida o token recém-emitido (`logout()`) e responde `403` com `{ "message": "Confirme seu e-mail para entrar. Enviamos o link para {$user->email}.", "code": "email_not_verified" }`.
- **Fila (`laravel-queues`):**
  - Job `SendClinicEmailVerificationJob` (com `ShouldQueue`, `$tries = 3`, `$backoff = [10, 30, 60]`, `failed()` com `logError`) despachado com `->afterCommit()` após criar a conta ou pedir reenvio, enviando a notificação/mailable com o link `/clinica/confirmar-email?id=...&hash=...&expires=...&signature=...`.
- **Lista de slugs reservados (`ReservedClinicSlugs`):**
  - Segmentos técnicos de rota/sistema: `clinica`, `admin`, `paciente`, `login`, `design-system`, `api`, `log-viewer`, `up`, `storage`, `build`, `assets`, `vendor`, `sanctum`, `clinic`, `patient`, `auth`, `register`, `criar-conta`, `confirmar-email`, `recuperar-senha`, `redefinir-senha`, `questionarios`, `questionnaires`, `webhook`, `webhooks`, `app`, `www`, `mail`, `status`.
  - Palavras de marca e suporte: `fisioweb`, `suporte`, `ajuda`, `oficial`, `termos`, `privacidade`.
- **Camadas no frontend (`resources/js/`):**
  - `infrastructure/repositories/api-clinic-registration.ts`: chamadas via `apiClient` (`/clinic/auth/register`, `/clinic/auth/slug-availability`, `/clinic/auth/verify-email`, `/clinic/auth/verify-email/resend`) e mapeamento camelCase → snake_case (`PF` → `fisica`, `PJ` → `juridica`, `document` e `phone` só dígitos, `termsAccepted` → `terms_accepted`).
  - `application/clinic/clinic-register.ts`: funções e hook React Query (`useClinicSlugAvailability` com debounce na página, `registerClinic`, `verifyClinicEmail`, `resendClinicVerification`, `extractRegisterFieldErrors`).
  - `pages/clinic/ClinicRegisterPage.tsx`: tela v2 oficial em 3 passos com RHF + Zod (`clinicRegisterSchema`), sem imports de v1 nem de `register-prototype`.
  - `pages/clinic/ClinicVerifyEmailPage.tsx`: tela v2 oficial em `/clinica/confirmar-email`.
  - `pages/clinic/ClinicLoginPage.tsx`: atalho para reenviar o e-mail de confirmação quando o login retorna erro de e-mail não confirmado.
- **ADR:** `docs/adr/028-auto-cadastro-da-clinica-com-confirmacao-de-email.md`.

## Fatias Verticais

1. **Auto-cadastro da clínica e consulta de disponibilidade de endereço (`001-auto-cadastro-clinica-e-slug-disponivel`):** contrato público de leitura de plano no `Admin`, regras compartilhadas e lista de slugs reservados no `Clinic`, endpoints `GET /api/clinic/auth/slug-availability` e `POST /api/clinic/auth/register` criando clínica ativa no plano `Premium` e usuário mestre com a senha escolhida (nunca o documento) e disparando job de confirmação `afterCommit`, com testes PHPUnit.
2. **Confirmação de e-mail, backfill e bloqueio no login (`002-confirmacao-de-email-e-bloqueio-no-login`):** migration de backfill de `email_verified_at` nos usuários atuais, marcação de `email_verified_at = now()` no `ClinicObserver` e `ClinicUserService::create`, endpoints `POST /api/clinic/auth/verify-email` e `POST /api/clinic/auth/verify-email/resend`, bloqueio no login para não confirmados após senha correta e ADR 028, com testes PHPUnit.
3. **Telas v2 de criar conta, confirmar e-mail, atalho no login e corte da v1 (`003-telas-criar-conta-confirmar-email-e-corte-v1`):** repositório e camada `application` no frontend, `ClinicRegisterPage.tsx` no DS v2 com RHF + Zod, `ClinicVerifyEmailPage.tsx`, atalho de reenvio em `ClinicLoginPage.tsx`, remoção de `register-prototype/` e da v1, atualização de `docs/prototipos-v2.md` e testes Vitest (incluindo teste de corte).
4. **Aceite de Termos de Uso e Política de Privacidade / LGPD (`004-aceite-de-termos-lgpd-no-auto-cadastro`):** migration adicionando `terms_accepted_at` em `clinics` e `clinic_users`, validação `terms_accepted` no backend e persistência na transação de auto-cadastro, `DsCheckbox` obrigatório no 3º passo de `ClinicRegisterPage.tsx` e testes PHPUnit + Vitest.

## Testes

- **Backend (`./vendor/bin/phpunit modules/Clinic/tests` e `./vendor/bin/phpunit tests/Architecture`):**
  - Usa `RefreshDatabase`, `Queue::fake()`, `Notification::fake()` (ou `Mail::fake()`), seguindo os padrões de `modules/Clinic/tests/Feature/`.
  - Cobre: criação de clínica (`status = 1`, `plan_id` do plano `Premium`, `terms_accepted_at` preenchido) + usuário mestre (`role = admin`, `mestre = 1`, `Hash::check(senhaEscolhida)` verdadeiro, `Hash::check(documento)` falso, `email_verified_at` nulo); 422 para e-mail duplicado em `clinics` e em `clinic_users` (inclusive `withTrashed`), documento duplicado/inválido, slug duplicado/reservado/inválido, senha curta/confirmação diferente, termos não aceitos; throttle 429; `slug-availability` (livre, ocupado, reservado, inválido); login bloqueado antes de confirmar e liberado depois; senha errada não revela falta de confirmação; `verify-email` (válido, idempotente, expirado, adulterado, outro usuário); `resend` neutro; admin cria clínica e usuário já confirmados; migration de backfill preenche existentes.
- **Frontend (`npx vitest run`):**
  - Seguindo `resources/js/test/ClinicAuthPages.test.tsx` e `resources/js/test/finances/finance-v1-cut.test.ts`.
  - Cobre: validação por passo, preservação ao voltar, troca PJ↔PF, geração e edição do slug, bloqueio por slug indisponível/reservado, erro 422 voltando ao passo do campo com erro, tela de sucesso com reenvio e contagem de 30 s, aceite obrigatório dos termos, página `/clinica/confirmar-email` (sucesso e link vencido), reenvio no login, mapper do repositório e corte completo da v1/protótipo.

## Fora do Escopo

- Páginas jurídicas públicas completas com texto versionado de Termos de Uso e Política de Privacidade editáveis pelo painel master.
- Checkout de pagamento ou cartão de crédito durante o auto-cadastro.
- Alteração de slug pela clínica após a criação da conta.
