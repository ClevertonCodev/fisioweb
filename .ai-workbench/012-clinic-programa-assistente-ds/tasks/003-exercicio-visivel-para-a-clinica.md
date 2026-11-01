# Criar e editar programa só aceitam exercício visível para a clínica

**Tipo:** Bug
**Plano:** `../plans/clinic-programa-assistente-ds.md`
**Histórias:** 36, 37
**Issue:** ainda não criada

## Descrição

A validação de criar e editar programa só confere se o `exercise_id` existe.
Uma clínica que monte a requisição na mão consegue pôr no programa um exercício
privado (enviado e não aprovado) de outra clínica, e o vídeo aparece para o
paciente. A biblioteca da clínica já filtra o que é visível; o salvar, não.

A abordagem é perguntar ao módulo `Admin`, pelo contrato público do catálogo,
quais ids são visíveis para a clínica, e recusar o resto com 422.

## O que construir

- **Contrato no `Admin`:** o `ExerciseCatalogReadServiceInterface` ganha um método que recebe uma lista de ids e o `clinic_id` e devolve os visíveis (aprovados no catálogo ou da própria clínica), numa consulta só. A implementação usa a regra que a biblioteca já usa (`scopeVisibleToClinic`). O `TreatmentProgram` só conhece a interface.
- **Validação nos dois endpoints** (`POST` e `PUT /api/clinic/treatment-plans`, guard `clinic`): exercício não visível responde 422 em `exercises.N.exercise_id`, com mensagem em pt-BR, e nada é gravado.
- **Exceção na edição:** um exercício que já estava no programa (veio com o `id` dele e o mesmo `exercise_id`) continua aceito, mesmo que tenha deixado de ser visível depois. Se a tarefa 001 ainda não estiver pronta, a exceção vale para o `exercise_id` que o programa já tinha.
- **Sem migration.** Policy e papéis não mudam.

## Critérios de Aceite

- [x] Criar com exercício privado de outra clínica responde 422 e não cria nada (PHPUnit).
- [x] Editar acrescentando exercício privado de outra clínica responde 422 e não muda nada (PHPUnit).
- [x] Exercício aprovado do catálogo e exercício enviado pela própria clínica (mesmo pendente) passam (PHPUnit).
- [x] Exercício que já estava no programa continua aceito na edição (PHPUnit).
- [x] O `TreatmentProgram` não importa o Model `Exercise` (só o contrato).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda manualmente.

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** a mesma da tarefa 001.
- **Exemplo no código:** o trait `ValidatesPatientOfClinic` no `TreatmentProgram` (validação depois das regras, por contrato de outro módulo); `ExerciseCatalogReadService` no `Admin`; o filtro `visible_to_clinic_id` no `ExerciseController` da clínica.
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-clean-code`, `php-testing`, `security`.

## Como testar na mão

1. Com a clínica A, envie um exercício (fica pendente).
2. Logado na clínica B, faça `POST /api/clinic/treatment-plans` com o `exercise_id` desse exercício: 422.
3. Logado na clínica A, o mesmo `POST` passa.
4. Na clínica A, um programa com esse exercício continua salvando na edição.
