# Decisões · 014 Criar conta da clínica no DS v2 (front + backend)

Rota pública `/clinica/criar-conta` a partir do protótipo A, "Três passos"
(`resources/js/pages/clinic/register-prototype/`), mais confirmação de e-mail
em `/clinica/confirmar-email` e backend real de auto-cadastro em `modules/Clinic`.

## Sessão 2026-11-01

- **Escopo (front + backend)** → o protótipo A ("Três passos": Sua clínica → Seu acesso → Endereço dos links) vira a tela de verdade em `/clinica/criar-conta`, ligada ao novo endpoint público `POST /api/clinic/auth/register`. A v1 (`ClinicRegisterPageV1`), a pasta `register-prototype/` e o `?variant=` saem.
- **Onde vive** → backend no módulo `modules/Clinic` (dono de `Clinic` e `ClinicUser`); frontend em `resources/js/pages/clinic/`, `application/clinic/` e `infrastructure/repositories/`.
- **Senha do usuário mestre** → o auto-cadastro grava a senha escolhida pela pessoa (`Hash::make($password)`), nunca o documento (`CPF`/`CNPJ`). O conflito com `ClinicObserver::created` (que cria o mestre com senha igual ao documento) é resolvido de forma explícita na transação de auto-cadastro, sem duplicar o mestre e sem gravar a senha do documento nem por um instante.
- **Confirmação de e-mail obrigatória** → no auto-cadastro, o usuário mestre nasce com `email_verified_at = null`, a API responde `201` sem emitir token JWT e dispara o e-mail de confirmação na fila (`afterCommit`). O link assinado e com validade (24 h) aponta para `/clinica/confirmar-email?...`, que chama `POST /api/clinic/auth/verify-email`. Link já usado responde sucesso idempotente; vencido ou adulterado responde 4xx.
- **Reenvio de confirmação** → `POST /api/clinic/auth/verify-email/resend` com `email` responde sempre igual (exista a conta ou não, ou já esteja confirmada), com throttle próprio; na tela final do cadastro há botão com espera de 30 s e na tela de login há atalho quando o login é barrado por falta de confirmação.
- **Login barra quem não confirmou** → em `AuthController::canLogIn` (checado só depois da senha certa, para não revelar quem tem conta), usuário com `email_verified_at` nulo recebe 403 com mensagem pedindo confirmação do e-mail.
- **Não trancar usuários atuais nem cadastros pelo admin** → migration de backfill preenche `email_verified_at` nos `clinic_users` existentes onde está nulo; `ClinicObserver::created` e `ClinicUserService::create` passam a preencher `email_verified_at = now()`. Só o auto-cadastro nasce pendente de confirmação.
- **Disponibilidade de endereço (slug) vs. privacidade de e-mail/documento** → `GET /api/clinic/auth/slug-availability?slug=` é público (com throttle) e retorna `{ data: { available, reason: "taken|reserved|invalid"|null } }`, pois o slug já é público nos links de pacientes. Não há endpoint de checagem prévia para e-mail ou documento (evita enumeração de clientes); duplicidade de e-mail (em `clinics` e `clinic_users` com `withTrashed`) ou documento aparece apenas no `422` do `POST /api/clinic/auth/register`, fazendo a tela voltar ao passo do primeiro campo com erro.
- **ADR** → registrar em `docs/adr/028-auto-cadastro-da-clinica-com-confirmacao-de-email.md` o fluxo, a justificativa do 422 no cadastro versus neutralidade no login/reenvio, o backfill de `email_verified_at` e a lista de slugs reservados.
- **Situação e plano inicial da clínica no auto-cadastro** → a clínica nasce ativa (`status = 1`, `Clinic::STATUS_ACTIVE`) e vinculada ao plano `Premium` (`plan_id` do plano `'Premium'` em `admin_plans`, ou `null` se o plano ainda não estiver semeado no ambiente/teste).
- **Lista de endereços (slugs) reservados** → bloquear tanto os segmentos técnicos de rota/sistema (`clinica`, `admin`, `paciente`, `login`, `design-system`, `api`, `log-viewer`, `up`, `storage`, `build`, `assets`, `vendor`, `sanctum`, `clinic`, `patient`, `auth`, `register`, `criar-conta`, `confirmar-email`, `recuperar-senha`, `redefinir-senha`, `questionarios`, `questionnaires`, `webhook`, `webhooks`, `app`, `www`, `mail`, `status`) quanto palavras da marca/suporte (`fisioweb`, `suporte`, `ajuda`, `oficial`, `termos`, `privacidade`).
- **Termos de uso / LGPD** → incluir checkbox obrigatório (`DsCheckbox`) de aceite dos Termos de Uso e Política de Privacidade no 3º passo do cadastro (`termsAccepted: true`) e gravar a data/hora do aceite no backend (`terms_accepted_at` em `clinics` e/ou `clinic_users`), em tarefa própria.

### Fora do escopo

- Páginas jurídicas completas de Termos de Uso e Política de Privacidade com versionamento de texto legal e gestão pelo painel master.
- Fluxo de cobrança/pagamento no ato do auto-cadastro.
