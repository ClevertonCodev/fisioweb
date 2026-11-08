# Paciente desativado perde o token na hora

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 49
**Issue:** ainda não criada

## Descrição

Hoje o login novo do paciente desativado dá 401, mas o token antigo continua com 200 em `me`, em `programs` e no `refresh` (achado Baixo da auditoria). Falta o que o guard da clínica já tem: conferir a cada requisição.

## O que construir

- O guard `patient` passa a usar um provider próprio no módulo Patient, no molde do `ActiveClinicUserProvider`. O `retrieveById` devolve nulo quando o paciente não pode entrar, pela mesma regra que o login usa para decidir se o paciente é elegível.
- Isso corta as rotas autenticadas do paciente e o refresh.
- Sem migration. Sem mudança no SPA: o 401 já leva ao login.

## Critérios de Aceite

- [ ] Depois de desativar o paciente, o token antigo dá 401 em `me`, em `programs` e em `refresh` (o teste da auditoria, invertido)
- [ ] O paciente ativo continua com 200
- [ ] O login do paciente desativado continua 401
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Auth/ActiveClinicUserProvider.php`; a checagem de elegibilidade no serviço de autenticação do paciente
- **Skills:** `php-testing`

## Como testar na mão

1. Entre no app do paciente com o paciente de smoke.
2. Pela clínica, inative esse paciente.
3. Recarregue o app: ele cai no login.
