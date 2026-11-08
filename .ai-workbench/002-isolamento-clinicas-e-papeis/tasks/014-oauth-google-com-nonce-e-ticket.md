# Conexão com o Google com nonce de uso único e ticket confirmado por quem está logado

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 45, 46, 47
**Issue:** ainda não criada

## Descrição

Hoje o `state` do OAuth é só o uid cifrado: ele não vence, é reutilizável e não fica preso a quem conclui o fluxo. O callback público grava os tokens do Google no uid do `state`. Um usuário manda o link dele à vítima, e a agenda Google da vítima passa a cair na clínica do atacante (achado Médio `googlecalendar/oauth-callback/state-not-bound-to-initiating-session`).

## O que construir

- O `connect` gera um nonce aleatório e guarda `{uid, return}` no cache por 10 minutos. O `state` é o nonce.
- O `callback` público consome o nonce (uso único). Se ele está inválido, vencido ou já usado, o redirect é com `?google=error`. Se está válido, o callback não grava tokens: guarda `{uid, code}` no cache por 5 minutos com um ticket e redireciona para a tela de origem com `?google_ticket=...`.
- O endpoint novo `POST /api/clinic/google-calendar/complete` (`auth:clinic`, `clinic.guard`):
  - recebe `{ticket}` e consome o ticket;
  - dá 403 se o uid do ticket não for o do JWT;
  - só então troca o code e grava os tokens;
  - devolve `{data: {connected: true}}`.
- O formato legado de `state` (uid puro cifrado) deixa de ser aceito.
- SPA: as duas telas que tratam `?google=` (as ações do Google na agenda e a edição de usuário) passam a tratar `?google_ticket=`. Elas chamam o `complete`, mostram "conectado" ou "erro" como hoje e limpam a URL. A chamada passa pela camada `application`, nunca direto pelo `apiClient` na página.

## Critérios de Aceite

- [ ] O `state` do usuário A concluído sem JWT não grava tokens em ninguém (o teste `VerifierGoogleOAuthStateTest` da auditoria, invertido)
- [ ] O ticket do A com o JWT do B dá 403 e não grava tokens
- [ ] Nonce reusado, com mais de 10 minutos ou no formato legado: `?google=error`
- [ ] Ticket reusado ou com mais de 5 minutos: 422 ou 403, e nada é gravado
- [ ] O fluxo completo conecta, e o `status` mostra conectado
- [ ] As duas telas concluem com `google_ticket` e mostram o aviso (teste Vitest)
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/GoogleCalendar/app/Http/Controllers/GoogleCalendarController.php`; `resources/js/components/clinic/agenda/AgendaGoogleCalendarActions.tsx`
- **Skills:** `php-testing`, `api-client`, `frontend-ddd`, `frontend-testing`, `security-audit`

## Como testar na mão

1. Com as credenciais do Google de homologação, abra a agenda e clique em "Conectar Google Agenda".
2. Autorize: você volta para a agenda com "conectado", como antes.
3. Copie a URL de autorização, abra-a em outro navegador logado como outro usuário e conclua: a conexão não é gravada.
