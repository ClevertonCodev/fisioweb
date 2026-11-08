# Regras de papel que saíram da 002

Em 2026-11-08 a feature 002 virou "corrigir a auditoria de controle de acesso" (`security-audit-skill/fisioweb/run-1`). As regras de papel do plano de 2026-10-15 não são achado da auditoria, e sim **mudança de produto**: mudam o que cada pessoa da clínica vê e faz. Por isso saíram da 002 e esperam uma feature própria.

Este arquivo guarda o que já tinha sido pensado, como o código está hoje e o que precisa ser decidido de novo quando a feature for aberta.

## 1. A secretária só lê o prontuário

**A ideia:** a secretária continua lendo evoluções, avaliações e arquivos do paciente, porque apoia o atendimento na recepção. Mas ela não cria, não edita, não assina, não gera texto e não apaga nada do prontuário. O sigilo do registro é do profissional.

**Como está hoje no código:**

- Evolução e avaliação: as Policies de `create` já exigem fisioterapeuta (o admin passa pelo `Gate::before`). Então a secretária já leva 403 ao criar.
- Arquivo do paciente: `PatientFilePolicy::create` devolve `true` para todo mundo, e o `store` do `PatientFileController` nem chama `authorize`. **Hoje a secretária consegue anexar arquivo ao prontuário.** Só o `delete` é conferido.
- Leitura: `view` e `viewAny` devolvem `true` para todos os papéis. A regra está certa, mas os controllers de leitura não chamam `authorize`, então não há um ponto único que decida.
- SPA: `permissions.ts` já tem `manageClinicalRecords` (admin ou fisio), mas as telas do prontuário não escondem as ações de escrita com ele.

**O que o plano antigo decidiu:**

- Toda rota de escrita do prontuário chama `authorize`. A secretária recebe 403.
- As rotas de leitura também chamam `authorize` (`view`/`viewAny`), só para ter um ponto que decide. A regra não muda.
- `PatientFilePolicy` passa a exigir fisio ou admin para anexar e remover.
- As telas do prontuário escondem os botões de escrita para a secretária.

**Decidir de novo:** a secretária anexar arquivo (exame, laudo trazido pelo paciente) é proibido mesmo? A recepção costuma ser quem recebe esse papel. Pode ser "anexa, mas não apaga".

## 2. Fisioterapeuta responsável obrigatório

**A ideia:** todo paciente tem um fisioterapeuta responsável, escolhido no cadastro. A recepção cadastra, mas não atende, então ela precisa escolher quem atende.

**Como está hoje no código:** `PatientService::create` grava o usuário logado como responsável (`clinic_user_id`). Se a secretária cadastra, ela vira a responsável.

**O que o plano antigo decidiu:**

- O campo "Fisioterapeuta responsável" passa a ser obrigatório no cadastro e na edição. Só aceita admin ou fisio da própria clínica (`ClinicUser::ATTENDABLE_ROLES`), senão devolve 422.
- O admin que também atende pode ser responsável.
- Para validar, o Patient pergunta ao contrato público do Clinic, sem importar o model.
- Uma migration zera o responsável dos pacientes que hoje têm a secretária nesse papel. A próxima edição obriga a escolher um.
- No SPA, o formulário de paciente ganha um select obrigatório. Para o fisio, ele já vem preenchido com o próprio fisio.

## 3. Vínculo fisio-paciente

**A ideia:** para saber quais pacientes cada fisio pode ver, o sistema precisa saber quem já atendeu cada paciente, além do responsável.

**O que o plano antigo decidiu:**

- Uma tabela nova `patient_care_links` no módulo Patient, com `clinic_id`, `patient_id`, `clinic_user_id`, `source` (`appointment`, `treatment_plan`, `evolution` ou `assessment`) e `created_at`.
- A tabela é alimentada por listeners **síncronos** de eventos que já existem: `AppointmentScheduled`, `AppointmentRescheduled`, `TreatmentPlanCreated`, `EvolutionRecorded` e `AssessmentCreated`. Por serem síncronos, o fisio vê o paciente logo depois de a recepção agendar.
- O vínculo nunca é apagado: quem atendeu uma vez continua vendo o histórico.
- Uma migration de backfill cria os vínculos a partir das consultas, planos, evoluções e avaliações que já existem. É uma exceção de leitura entre módulos, registrada em ADR.
- Um ADR novo: "Vínculo fisioterapeuta-paciente no módulo Patient".

## 4. O fisio vê só os pacientes dele

**A ideia:** o fisio vê, na lista e pela URL, só os pacientes de que é responsável ou que já atendeu. Admin e secretária continuam vendo todos da clínica.

**Como está hoje:** o fisio vê todos os pacientes da clínica, e o desenho atual das telas v2 parte disso.

**O que o plano antigo decidiu:**

- O contrato do Patient ganha a busca de "paciente acessível" (mesma clínica e, para o fisio, responsável ou vínculo). Todo módulo que recebe `patient_id` (prontuário, questionário, plano, agenda) usa essa busca. Paciente fora da busca dá 404.
- A lista e o seletor de paciente da agenda e do plano aplicam o mesmo filtro.
- A lista de planos mostra ao fisio só os planos dos pacientes dele, ou os planos sem paciente que ele criou.
- Os widgets do dashboard que mostram pacientes seguem a mesma regra.
- Pendência já registrada (feature 005): o histórico do paciente na agenda (`GET /api/clinic/patients/{patient}/appointments`) hoje libera o fisio que tem pelo menos uma consulta com o paciente; essa regra passaria a ser "paciente acessível".

**Decidir de novo:**

- As clínicas querem mesmo isso? Em clínica pequena, um fisio cobre o outro o tempo todo, e esconder pacientes pode atrapalhar mais que proteger.
- Depois do deploy, pacientes cadastrados pela secretária sem consulta ficam sem responsável e não aparecem para nenhum fisio até a recepção escolher um. Avisar as clínicas.

## Resumo das permissões que o plano antigo queria

| Ação | Admin | Fisio | Secretária |
|---|---|---|---|
| Ver paciente e prontuário | todos da clínica | só os dele | todos da clínica, só leitura no prontuário |
| Escrever no prontuário | sim | só nos dele | não (403) |
| Ser responsável por paciente | sim | sim | não |

## Também ficou fora: a refatoração estrutural

O plano antigo também tinha três tarefas de reforço de isolamento. A auditoria mostrou que hoje nenhuma delas fecha uma brecha explorável:

- **Checagem de clínica única no controller base**, trocando os cerca de 33 `if ($x->clinic_id !== ...)` espalhados. Os `if` atuais estão certos, e as suítes de isolamento passam.
- **`Gate::before` mais estreito**, negando ao admin um recurso de outra clínica. Hoje ele libera o admin para tudo, mas todo endpoint confere `clinic_id` antes. Seria só uma segunda barreira.
- **Teste de arquitetura** que falha se um controller comparar `clinic_id` na mão.

Elas valem quando a feature de papéis vier, porque a busca de "paciente acessível" do item 4 já mexe nesses mesmos pontos.

## Arquivos antigos

As tarefas `002`, `003`, `004`, `010`, `011`, `012` e `013` e o plano `plano-2026-10-15.md`, todos em `tasks/arquivo-2026-10-15/`, descrevem esse desenho em detalhe. Elas não valem mais para a 002, mas servem de ponto de partida para a feature nova.
