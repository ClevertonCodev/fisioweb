# Fisioterapeuta responsável obrigatório no paciente

**Tipo:** História
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

Hoje `patients.clinic_user_id` guarda quem cadastrou o paciente: o `PatientService` grava o usuário logado. Muitas vezes quem cadastra é a secretária, que não atende. A regra decidida é a seguinte:
- todo paciente tem um responsável, que é admin ou fisioterapeuta da clínica (`ClinicUser::ATTENDABLE_ROLES`);
- a secretária cadastra, mas escolhe o fisio responsável;
- ela nunca é responsável.

Essa é a base da regra "fisio vê só os pacientes dele" (tarefa 013).

## O que construir

- **Clinic**: contrato público de leitura em `Contracts/Public` que responde se um usuário pertence à clínica e tem papel que atende. O Patient usa esse contrato sem importar o model `ClinicUser`.
- **Patient**:
  - criar e editar paciente exigem `clinic_user_id`, validado como usuário da própria clínica com papel admin ou fisio, senão 422;
  - o `PatientService` para de gravar o usuário logado como responsável, e o valor vem do formulário.
- **Migration de dados** no Patient: zera `clinic_user_id` dos pacientes cujo responsável atual é secretária. Os outros não mudam.
- **SPA**:
  - o formulário de paciente (novo e edição) ganha o campo "Fisioterapeuta responsável", um select obrigatório no Zod alimentado por `GET /api/clinic/users/professionals`, que já devolve admin e fisio, e só o próprio usuário para fisio;
  - para fisio, o campo vem preenchido com ele mesmo;
  - a entidade em `domain/clinic/patient.ts` ganha o id do responsável, e o mapper e o repository em `infrastructure/` passam a ler e enviar o campo;
  - paciente sem responsável abre a edição com o campo vazio e não salva até alguém escolher.
- O filtro "profissional" da lista de pacientes continua filtrando pelo responsável.

## Critérios de Aceite

- [ ] Criar ou editar paciente com responsável secretária devolve 422.
- [ ] O mesmo vale com responsável de outra clínica e com o campo vazio.
- [ ] Admin e fisio da própria clínica são aceitos como responsável.
- [ ] O responsável gravado é o enviado no formulário, não o usuário logado (teste com secretária cadastrando e escolhendo um fisio).
- [ ] Teste da migration: paciente com responsável secretária fica com `clinic_user_id` nulo; com responsável fisio ou admin, não muda.
- [ ] O Patient não importa model nem repository do Clinic (`ModuleBoundaryTest` verde).
- [ ] Teste de UI (Vitest): o formulário não envia sem responsável. Para fisio, o select vem preenchido com ele.
- [ ] Teste do repository e do mapper do frontend com o campo novo.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - `modules/Clinic/app/Contracts/Public/ClinicUserGoogleConnectionReadServiceInterface.php` (contrato público de leitura do Clinic);
  - `modules/Clinic/tests/Feature/ProfessionalsListTest.php` (endpoint de profissionais);
  - `resources/js/test/api-clinic-patients.test.ts`.
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-module`, `forms-shadcn`, `frontend-ddd`, `frontend-testing`, `php-testing`
- Paciente é dado pessoal (LGPD). A migration só zera uma referência e não apaga dado do paciente.

## Como testar na mão

1. Como secretária da A, cadastre um paciente pela tela "Novo paciente". O campo "Fisioterapeuta responsável" é obrigatório e lista só admin e fisios. Escolha um fisio e salve.
2. Na lista de pacientes, filtre pelo profissional escolhido → o paciente aparece.
3. Como fisio da A, abra "Novo paciente" → o campo já vem com o próprio nome.
4. Pela API, crie um paciente com `clinic_user_id` de uma secretária → 422.
