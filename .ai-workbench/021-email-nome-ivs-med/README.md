# 021 — E-mail de confirmação com o nome IVS MED e em português

Veio da skill `correcao-rapida` (vibe code). Tarefa: `000-email-nome-ivs-med`.

```
Hoje:      QUANDO o sistema manda o e-mail de confirmação da clínica, o assunto diz "— Fisioweb" e o texto padrão do Laravel sai em inglês ("Regards,", "If you're having trouble clicking…", "All rights reserved.").
Esperado:  QUANDO o sistema manda esse e-mail, o assunto DEVE usar o nome do app (config('app.name'), "IVS MED" no servidor) e os textos padrão DEVEM sair em português.
Continua:  QUANDO o e-mail é enviado, o link de confirmação e o texto próprio (saudação, linhas, botão "Confirmar meu e-mail") DEVEM CONTINUAR iguais.
Continua:  QUANDO o e-mail de redefinição de senha (ResetPassword do Laravel, admin e clínica) é enviado, ele DEVE sair inteiro em português, sem misturar idiomas (o lang/pt_BR.json é global).
```

## Arquivos alterados

- `modules/Clinic/app/Notifications/VerifyClinicEmailNotification.php` — assunto usa `config('app.name')`.
- `lang/pt_BR.json` (novo) — tradução das chaves do template de e-mail do Laravel (`Hello!`, `Whoops!`, `Regards,`, subcopy do botão, `All rights reserved.`) e das 5 chaves do `ResetPassword` (assunto, corpo e botão).
- `tests/Unit/Mail/ResetPasswordEmailTranslationTest.php` (novo) — e-mail de redefinição de senha inteiro em português.
- `modules/Clinic/tests/Unit/Notifications/VerifyClinicEmailNotificationTest.php` (novo) — 3 testes (assunto, tradução, conteúdo que continua).

## Contexto

No servidor, `APP_NAME` passou a "IVS MED" (com `CACHE_PREFIX`, `REDIS_PREFIX` e `SESSION_COOKIE` fixados nos valores antigos). `APP_LOCALE=pt_BR` no servidor.

## Smoke test

Pulado por escolha do usuário: a mudança só aparece no e-mail; o teste renderiza o HTML inteiro. A conferência real é reenviar a confirmação depois do deploy.
