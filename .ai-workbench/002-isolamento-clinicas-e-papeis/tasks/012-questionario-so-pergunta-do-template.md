# Resposta de questionário só com pergunta do próprio template

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 44
**Issue:** ainda não criada

## Descrição

Hoje a resposta de um questionário aceita qualquer `question_id` que exista no banco, inclusive de template de outra clínica. Com isso, o template da outra clínica deixa de poder ser apagado de vez (achado Baixo da auditoria).

## O que construir

- A resposta pela clínica e a resposta pelo link público (token) conferem que cada `answers.*.question_id` pertence ao template do questionário respondido. Fora disso, 422.
- A checagem fica no lugar que conhece o questionário (FormRequest com o questionário resolvido, ou o service), no padrão dos `ensureIdsBelongTo...` que já existem.
- Sem migration. Sem mudança no SPA.

## Critérios de Aceite

- [ ] Resposta com `question_id` de outro template dá 422 pela clínica (o teste `AuditQuestionnaireForeignQuestionTest` da auditoria, invertido)
- [ ] O mesmo pelo link público por token
- [ ] Resposta com as perguntas do próprio template continua 200
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/ClinicQuestionnaire/app/Http/Requests/AnswerPatientQuestionnaireRequest.php`; o padrão `ensureIdsBelongToTemplate` no módulo
- **Skills:** `php-testing`

## Como testar na mão

1. Responda um questionário pelo link do paciente: continua funcionando.
2. Pela API, mande uma resposta com o `question_id` de um template de outra clínica: deve dar 422.
