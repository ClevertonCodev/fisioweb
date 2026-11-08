# `/log-viewer` atrás de basic auth em produção

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 1, 2, 3, 4, 5
**Issue:** ainda não criada

## Descrição

Hoje o `LogViewer::auth` devolve sempre `true`, e isso desliga a trava de produção do pacote. Um anônimo lê e apaga os logs. Com `MAIL_MAILER=log`, ele ainda pega no log o link de "esqueci minha senha" de qualquer conta e toma a conta. É o achado Alto `platform/log-viewer/unauthenticated-read-delete`.

A correção põe o log-viewer atrás de basic auth no nginx, e a aplicação só libera em produção o pedido que passou por ele. Esta tarefa sai numa PR própria, antes do resto da feature.

## O que construir

- No núcleo, o callback do log-viewer libera fora de produção. Em produção, ele só libera o pedido que tem `REMOTE_USER` preenchido pelo servidor, que o cliente não forja por cabeçalho. Sem isso, a resposta é 403. Vale para a UI e para a `api` do pacote.
- O `config/log-viewer.php` continua com `enabled=true`.
- O provision de servidor novo:
  - gera o `htpasswd` com usuário e senha aleatórios e os mostra uma vez no fim, sem gravar no repositório;
  - põe `auth_basic` no `location` do `/log-viewer` e garante que o FastCGI repassa o `REMOTE_USER`;
  - troca `LOG_LEVEL=debug` por `info` no `.env` gerado.
- Um passo a passo curto para o servidor que já existe, no `docs/` de infraestrutura (ou na descrição da PR).
- Sem tela, sem migration. O `MAIL_MAILER=log` continua (decisão).

## Critérios de Aceite

- [ ] Em `env=production`, sem `REMOTE_USER`: `GET /log-viewer`, `GET /log-viewer/api/files` e `DELETE /log-viewer/api/files/{id}` dão 403 (o teste `AuditLogViewerTest` da auditoria, invertido)
- [ ] Em `env=production`, com `REMOTE_USER` no servidor: `GET /log-viewer/api/files` dá 200
- [ ] Em `env=local`: 200 sem nada
- [ ] Um cabeçalho `Remote-User` mandado pelo cliente não libera (403)
- [ ] O `provision.sh` gera o `htpasswd`, o `auth_basic` e `LOG_LEVEL=info`, sem segredo gravado no repositório
- [ ] O checklist do servidor atual está escrito
- [ ] Não se aplica caso de outra clínica: a rota não é de clínica
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `fix/log-viewer-basic-auth` (PR própria, sai antes)
- **Exemplo no código:** `app/Providers/AppServiceProvider.php`; `infra/provision.sh` (bloco do nginx e do `.env`); o teste `AuditLogViewerTest.php.txt` em `run-1/agents/*/artifacts/evidence/`
- **Skills:** `php-testing`, `security-audit`

## Como testar na mão

1. Rode a suíte com `APP_ENV=production` no teste (ou mude o `env` da aplicação no teste) e confira o 403.
2. No servidor (depois do deploy e do passo manual), rode `curl -s -o /dev/null -w '%{http_code}' https://<dominio>/log-viewer/api/files`: deve dar 401 (o nginx pede a senha). Com `-u usuario:senha`, deve dar 200.
