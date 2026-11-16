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
- As telas de programa e de execução do app chamam as rotas `patient/programs/{publicToken}`, que ficam fora do `auth:patient` (o link do programa abre sem login). Os 7 serviços dessas rotas recusam com 404 o plano cujo paciente não pode usar o app, pela mesma regra, consultada pelo contrato público `PatientAppAccessInterface` do módulo Patient (achado da revisão adversária, rodada 1).
- Sem migration. Sem mudança no SPA: o 401 já leva ao login.

## Critérios de Aceite

- [x] Depois de desativar o paciente, o token antigo dá 401 em `me`, em `programs` e em `refresh` (o teste da auditoria, invertido)
- [x] Depois de desativar o paciente, o link do programa dá 404 nas 7 rotas de `{publicToken}` e não grava nada
- [x] O paciente ativo continua com 200
- [x] O login do paciente desativado continua 401
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Clinic/app/Auth/ActiveClinicUserProvider.php`; a checagem de elegibilidade no serviço de autenticação do paciente
- **Skills:** `php-testing`

## Como testar na mão

1. Entre no app do paciente com o paciente de smoke.
2. Pela clínica, inative esse paciente.
3. Recarregue o app (a lista ou o detalhe de um programa): ele cai no login.
4. Abra o link do programa numa aba sem login: a tela não mostra o programa, e `GET /api/patient/programs/{publicToken}` dá 404.
