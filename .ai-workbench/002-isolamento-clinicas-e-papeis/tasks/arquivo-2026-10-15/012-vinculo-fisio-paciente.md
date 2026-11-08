# Vínculo fisio-paciente por eventos, com backfill e ADR

**Tipo:** História
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

Para o fisioterapeuta ver só os pacientes dele (tarefa 013), o sistema precisa saber quem já atendeu cada paciente, além do responsável no cadastro. Esses atendimentos ficam em módulos diferentes: consultas na ClinicScheduling, planos na TreatmentProgram, evoluções e avaliações na ClinicalRecord. A lista de pacientes é paginada, então perguntar a quatro módulos na hora seria caro e espalharia a regra.

A decisão foi o módulo Patient guardar o vínculo numa tabela própria. Ela é alimentada por listeners **síncronos** de eventos públicos que já existem e já carregam `clinicId`, `patientId` e `professionalId`. Uma migration preenche o histórico, e um ADR registra a fronteira nova.

## O que construir

- **Tabela `patient_care_links`** no módulo Patient: `clinic_id`, `patient_id`, `clinic_user_id`, `source` (`appointment`, `treatment_plan`, `evolution`, `assessment`), `created_at`. Chave única em (patient_id, clinic_user_id), e a primeira origem fica gravada.
- **Listeners síncronos** no Patient para:
  - `AppointmentScheduled` e `AppointmentRescheduled` (ClinicScheduling);
  - `TreatmentPlanCreated` (TreatmentProgram);
  - `EvolutionRecorded` e `AssessmentCreated` (ClinicalRecord).

  O listener ignora evento sem paciente ou sem profissional, não duplica vínculo e grava o `clinic_id` do evento.
- Os listeners importam só as classes de evento dos outros módulos, nunca models ou repositories.
- **O vínculo não é apagado** em cancelamento, arquivamento ou exclusão de consulta ou plano.
- **Backfill**: migration de dados no Patient que lê consultas, planos, evoluções e avaliações existentes e cria os vínculos que faltam. É idempotente. É exceção pontual de leitura de tabelas de outros módulos, registrada no ADR.
- **ADR novo** em `docs/adr/`: "Vínculo fisioterapeuta-paciente no módulo Patient". Registra o dono, os eventos consumidos, por que tabela e não consulta na hora, por que síncrono e a exceção do backfill.
- O contrato do Patient ganha uma consulta "este usuário tem vínculo com este paciente?". A busca e a lista ainda não usam a consulta; isso entra na tarefa 013.
- Sem mudança no SPA.

## Critérios de Aceite

- [ ] Agendar consulta do fisio X com o paciente P cria o vínculo (X, P, `appointment`), na mesma requisição. Teste com o evento real, sem `Event::fake`.
- [ ] Remarcar consulta para outro fisio Y cria o vínculo (Y, P) e mantém o de X.
- [ ] Criar plano, registrar evolução e criar avaliação criam o vínculo com a origem certa.
- [ ] Evento repetido não duplica o vínculo, e evento sem paciente ou sem profissional é ignorado.
- [ ] Cancelar a consulta não remove o vínculo.
- [ ] Teste do backfill: com dados antigos nas quatro origens, a migration cria os vínculos esperados; rodar de novo não duplica.
- [ ] `ModuleBoundaryTest` verde: o Patient não importa model nem repository de outro módulo.
- [ ] O ADR está em `docs/adr/`, numerado em sequência.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade. O vínculo grava o `clinic_id` do evento, e o teste confere que um evento da B não cria vínculo visível para a A.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `003-busca-de-paciente-acessivel` (Busca de paciente acessível no Patient e todos os módulos usando ela)

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - o `EventServiceProvider` do Clinic com `RecordSchedulingActivity`, que ouve eventos da ClinicScheduling;
  - `modules/ClinicScheduling/tests/Unit/Events/AppointmentServiceEventsTest.php`;
  - `docs/adr/007-clinic-finance-temporary-shared-writes.md` (modelo de exceção registrada em ADR).
- **Skills:** `architecture-paradigm-modular-monolith`, `laravel-eloquent`, `php-modern`, `php-testing`
- Listener síncrono: não implementar `ShouldQueue`, para o fisio ver o paciente na resposta seguinte ao agendamento.
- A tabela guarda só ids. Não é cópia de dado clínico (LGPD).

## Como testar na mão

1. Como secretária da A, agende uma consulta do fisio X com um paciente cujo responsável é outro fisio.
2. No banco, `patient_care_links` tem a linha (paciente, X, `appointment`).
3. Cancele a consulta → a linha continua.
4. Rode `php artisan migrate` numa base com dados antigos → os vínculos das consultas e evoluções antigas aparecem.
