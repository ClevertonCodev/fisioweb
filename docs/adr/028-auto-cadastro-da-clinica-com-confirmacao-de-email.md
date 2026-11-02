# ADR 028: Auto-cadastro da clínica com confirmação de e-mail

- **Status:** Aceito
- **Data:** 2026-11-01
- **Módulos:** `Clinic`, `Admin`

## Contexto

Até aqui, a rota pública `/clinica/criar-conta` era apenas visual: não existia endpoint público de auto-cadastro e toda clínica precisava ser criada pelo painel administrativo (`POST /api/admin/clinics`). Ao abrir o auto-cadastro para que clínicas e fisioterapeutas autônomos criem a própria conta na tela v2 ("Três passos"), surgiram quatro problemas de segurança e operação:

1. **Senha do usuário mestre:** o `ClinicObserver::created` cria automaticamente o usuário mestre (`role = admin`, `mestre = 1`) com senha igual ao hash do CPF/CNPJ da clínica. Se o auto-cadastro disparasse esse observer sem coordenação, a senha escolhida na tela seria ignorada ou haveria tentativa de criar dois usuários mestres com o mesmo e-mail.
2. **Confirmação de posse do e-mail:** sem confirmar o e-mail antes do primeiro login, qualquer pessoa poderia cadastrar o e-mail de terceiro e entrar imediatamente no painel.
3. **Usuários atuais sem `email_verified_at`:** a coluna `email_verified_at` já existia em `clinic_users`, mas nunca era preenchida em produção nem pelo `ClinicObserver` nem pelo `ClinicUserService::create`. Exigir `email_verified_at` no login sem preparar a base trancaria todos os usuários atuais.
4. **Privacidade vs. usabilidade na validação:** o endereço da clínica (`slug`) precisa de verificação em tempo real no 3º passo do cadastro, enquanto e-mail e CPF/CNPJ não devem ter endpoint público de consulta avulsa.

## Decisão

1. **Auto-cadastro em transação única (`POST /api/clinic/auth/register`):**
   - Cria a `Clinic` ativa (`status = 1`) vinculada ao plano `Premium` (consultado via contrato público `Modules\Admin\Contracts\Public\PlanCatalogReadServiceInterface`, sem acoplar `Clinic` ao model interno `Plan` do módulo `Admin`) com `$clinic->skipMasterUserObserver = true`, evitando que o `ClinicObserver` crie um usuário mestre com senha baseada no documento.
   - Cria na mesma transação o `ClinicUser` mestre (`role = admin`, `mestre = 1`, `status = 1`) com `Hash::make($password)`, `email_verified_at = null` e `terms_accepted_at = now()` (também gravado em `clinics`).
   - Não emite token JWT no `201` e despacha `SendClinicEmailVerificationJob` na fila com `afterCommit()`, enviando um link assinado (HMAC-SHA256 com `app.key` e validade de 24 horas) para `/clinica/confirmar-email`.

2. **Confirmação de e-mail e bloqueio no login:**
   - `POST /api/clinic/auth/verify-email` valida validade, assinatura HMAC e hash SHA-1 do e-mail do usuário; marca `email_verified_at = now()` e responde `200` de forma idempotente se o link válido for aberto mais de uma vez. Links vencidos ou adulterados respondem `422`.
   - `POST /api/clinic/auth/verify-email/resend` recebe o e-mail e responde sempre a mesma mensagem `200` (exista a conta ou não, ou já esteja confirmada), enfileirando o job apenas quando há usuário ativo pendente de confirmação.
   - `AuthController::canLogIn` (executado somente depois de `attempt` conferir a senha certa) bloqueia usuários com `email_verified_at` nulo com `403`. Senha errada continua retornando `401` (`Credenciais inválidas.`), sem revelar se o e-mail existe ou se falta confirmar.

3. **Backfill e fluxos administrativos:**
   - A migration `2026_11_01_000001_backfill_email_verified_at_on_clinic_users_table` preenche `email_verified_at = now()` em todos os `clinic_users` existentes onde a coluna estava nula.
   - `ClinicObserver::created` (criação de clínica pelo painel master) e `ClinicUserService::create` (criação de membro de equipe pelo administrador da clínica) passam a gravar `email_verified_at = now()`. Apenas o auto-cadastro nasce pendente de confirmação.

4. **Consulta pública de `slug` vs. `422` de e-mail e documento no envio:**
   - `GET /api/clinic/auth/slug-availability?slug=` é público (com throttle) e retorna `available` e `reason` (`taken`, `reserved`, `invalid` ou `null`). Como o `slug` já faz parte das URLs públicas dos pacientes (`/{slug}/paciente/...`), consultar sua disponibilidade não expõe dado sensível novo.
   - Não existe endpoint de consulta prévia de disponibilidade de e-mail ou CPF/CNPJ (o que facilitaria enumeração silenciosa de clientes). No envio do formulário (`POST /api/clinic/auth/register`), a validação retorna `422` por campo quando e-mail (em `clinics` ou `clinic_users` com `withTrashed`) ou documento já está cadastrado — escolha padrão de mercado para permitir que a pessoa corrija o campo no próprio passo do assistente, mantendo login, recuperação de senha e reenvio de confirmação estritamente neutros.

5. **Lista de endereços (`slugs`) reservados (`ReservedClinicSlugs::SLUGS`):**
   - Bloqueia segmentos técnicos de rotas do SPA e do backend (`clinica`, `clinic`, `admin`, `paciente`, `patient`, `login`, `auth`, `register`, `criar-conta`, `confirmar-email`, `recuperar-senha`, `redefinir-senha`, `design-system`, `api`, `log-viewer`, `up`, `storage`, `build`, `assets`, `vendor`, `sanctum`, `questionarios`, `questionnaires`, `webhook`, `webhooks`, `app`, `www`, `mail`, `status`) e termos institucionais/suporte (`fisioweb`, `suporte`, `ajuda`, `oficial`, `termos`, `privacidade`).

## Consequências

- Clínicas criadas por auto-cadastro só acessam o painel após confirmarem o e-mail, e entram com a senha escolhida no cadastro (o CPF/CNPJ nunca funciona como senha).
- Usuários atuais e contas criadas pelo admin não sofrem interrupção de acesso.
- Novas rotas de primeiro nível adicionadas no futuro em `resources/js/routes/` ou `routes/web.php` devem ser incluídas em `ReservedClinicSlugs::SLUGS`.
