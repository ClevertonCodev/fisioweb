# Rede de segurança e migração de ClinicQuestionnaire

**Tipo:** Tarefa
**Plano:** `../plans/clinic-base-controller.md`
**Issue:** ainda não criada

## Descrição

O módulo `ClinicQuestionnaire` tem dois controllers que leem o guard `clinic` direto. O PatientQuestionnaireController já tem testes de outra clínica. O QuestionnaireTemplateController não tem nenhum teste. Antes de migrar, escrevemos os testes de outra clínica para os modelos de questionário contra o código atual. Depois os dois controllers passam a usar o controller base.

Cobre as histórias 11, 16, 17 e 18 do plano.

## O que construir

- **Rede de segurança (antes da migração, passando no código atual).** Um usuário da clínica B:
  - não vê modelo de questionário de A em `GET /api/clinic/questionnaire-templates`;
  - em `GET`, `PUT` e `DELETE /api/clinic/questionnaire-templates/{id}` com modelo de A, recebe o status de hoje e não altera nada.
- **Migração:** QuestionnaireTemplateController e PatientQuestionnaireController passam a estender o controller base e trocam todo acesso ao guard pelos métodos novos. A checagem de dono, que compara o `clinic_id` do paciente ou do modelo e devolve 404, continua igual, com o lado do model convertido para `int`.
- O QuestionnaireAnswerController não usa o guard `clinic` e fica fora.
- Guard `clinic`. Permissões pelas Policies atuais, que não mudam. Não tem migration nem frontend.

## Critérios de Aceite

- [ ] Os testes novos de outra clínica para modelos de questionário existem e passam **antes** da migração. O commit de teste vem antes do commit de refatoração.
- [ ] Nenhum `Auth::guard('clinic')` ou `auth('clinic')` sobra em QuestionnaireTemplateController e PatientQuestionnaireController.
- [ ] Continuam verdes sem alteração:
  - [ ] `PatientQuestionnaireControllerTest`;
  - [ ] o `ModuleBoundaryTest` de `ClinicQuestionnaire`;
  - [ ] o teste que obriga os controllers do módulo a depender de interfaces de Service.
- [ ] Um usuário de outra clínica não vê, não altera e não responde questionários desta clínica.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-controller-base-e-modulo-clinic` (Criar ClinicAuthenticatedController e migrar Patient, ClinicProfile e Exercise)

## Notas de Implementação

- **Branch:** `feat/clinic-base-controller-questionnaire`
- **Exemplo no código:** `modules/ClinicQuestionnaire/tests/Feature/PatientQuestionnaireControllerTest.php`.
- **Skills:** `php-testing`, `security`.

## Como testar na mão

1. Na clínica A, criar um modelo de questionário e aplicá-lo a um paciente.
2. Como `admin` de A, abrir a lista de modelos e o questionário do paciente: tudo aparece como antes.
3. Como usuário de B:
   - `GET /api/clinic/questionnaire-templates`: o modelo de A não aparece;
   - `PUT /api/clinic/questionnaire-templates/{id do modelo de A}`: mesmo status de antes da mudança, sem alterar o modelo.
