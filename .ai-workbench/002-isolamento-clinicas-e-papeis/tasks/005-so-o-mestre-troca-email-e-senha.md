# Só o mestre troca o próprio e-mail e a própria senha

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 16, 17, 18
**Issue:** ainda não criada

## Descrição

Hoje qualquer admin da clínica troca o e-mail e a senha do mestre e entra como ele (reforço provado pela auditoria, `AuditMestreCredentialChangeTest`). O ADR 019 já prevê a proteção, mas o backend ainda não aplica.

A abordagem é a parte mínima do ADR 019, no service do Clinic: só o próprio mestre muda o e-mail e a senha do mestre. A troca de senha com código por e-mail continua fora.

## O que construir

- O `ClinicUserService` recusa com 403 a mudança de `email` ou `password` do mestre feita por qualquer pessoa que não seja ele ("Só o mestre altera o e-mail e a senha dele."). A regra fica no service, não na Policy, para o `Gate::before` não passar por cima.
- Os outros campos do mestre continuam com as regras atuais (não muda de papel, não é desativado).
- O SPA da edição de usuário v2 desabilita os campos de e-mail e senha quando o alvo é o mestre e quem edita não é ele, mostrando o motivo (ADR 017: ação sem permissão fica visível e desabilitada). A regra vai para `permissions.ts`, com teste.
- O admin continua trocando a senha de fisio e de secretária, como hoje.

## Critérios de Aceite

- [x] O admin comum leva 403 no `PUT /api/clinic/users/{mestre}` com `email`, e o e-mail não muda (o teste da auditoria, invertido)
- [x] O admin comum leva 403 com `password`, e a senha não muda
- [x] O mestre troca o próprio e-mail e a própria senha: 200
- [x] O admin troca a senha de um fisio: 200
- [x] Os campos ficam desabilitados com o motivo para o admin comum editando o mestre (teste Vitest de `permissions.ts` e da tela)
- [x] O admin de outra clínica continua levando 404 no usuário da clínica A
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-troca-de-senha-derruba-sessoes` (Trocar a senha derruba as outras sessões).

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Services/ClinicUserService.php` (as regras do mestre que já existem); `resources/js/application/clinic/permissions.ts`; `docs/adr/019-troca-de-senha-de-usuario-da-clinica.md`
- **Skills:** `backend-clean-code`, `php-testing`, `design-system`, `frontend-testing`, `security-audit`

## Como testar na mão

1. Faça login como um admin que não é o mestre e abra `/clinica/usuarios/{mestre}/editar`.
2. Os campos de e-mail e senha aparecem desabilitados, com o motivo.
3. Pela API, tente o `PUT` com e-mail novo: deve dar 403.
4. Faça login como o mestre: os campos ficam liberados.
