# Trabalho adiado · 014-clinic-criar-conta-ds

- **2026-11-01 · `refinar`:** Páginas públicas completas de Termos de Uso e Política de Privacidade com versionamento de texto jurídico e gestão pelo painel master ficam fora desta feature (nesta feature entra o checkbox obrigatório de aceite no 3º passo e o registro de `terms_accepted_at` no banco).
- **2026-11-01 · `refinar`:** Cobrança/checkout financeiro no ato do auto-cadastro fica fora desta feature (a clínica nasce ativa no plano `Premium`).
- **2026-11-01 · `code-review` antes da PR (achados não conferidos no código):**
  - Slug consulta a API a cada tecla: `handleNameChange` chama `setDebouncedSlug` direto e pula o debounce (`ClinicRegisterPage.tsx:141`). Com o limite de 30 por minuto e as 3 tentativas do React Query, aparece 429.
  - O texto "Disponível" aparece mesmo quando a consulta de disponibilidade falhou ou está desligada (`ClinicRegisterPage.tsx:536`).
  - Cadastro duplo (clique duplo ou duas abas) passa pela validação fora da transação e o segundo `insert` bate no índice único: 500 em vez de erro no campo (`ClinicRegistrationService.php`).
  - CNPJ repetido escapa quando o admin gravou o documento com máscara: o cadastro compara só os dígitos (`RegisterClinicRequest.php`).
  - Slug `"0"`: `empty()` em `ReservedClinicSlugs::isValidFormat` diz "inválido", mas o cadastro aceita.
  - `ClinicLoginPage.tsx:47` reconhece o bloqueio por e-mail não confirmado pelo texto da mensagem (`/confirme seu e-mail/i`), não por código; o reenvio usa o e-mail que está no campo, não o que foi bloqueado.
  - O validador de CPF/CNPJ ficou em `ReservedClinicSlugs` e continua duplicado no `UpdateClinicRequest`; o `RegisterClinicRequest` consulta o banco direto em vez de usar `ClinicRepository::slugExistsWithTrashed`.
- **2026-11-01 · correção do e-mail com maiúscula:** a busca usa `LOWER(email)` sem índice funcional. Nas tabelas `clinics` e `clinic_users` de hoje não pesa; se crescerem, criar índice em `LOWER(email)` no Postgres.
