# Status decidido no backend e link novo quando o paciente muda

**Tipo:** Bug
**Plano:** `../plans/clinic-programa-assistente-ds.md`
**Histórias:** 19, 20, 22, 23, 24
**Issue:** ainda não criada

## Descrição

Hoje a tela manda o status: `active` com paciente e `draft` sem. Editar um
programa concluído ou arquivado o reativa. Além disso, o link do paciente
(`public_token`) não pede login e sempre age como o paciente atual do plano. Se
o paciente for trocado, quem tem o link antigo passa a ver as cargas do novo
paciente e a registrar séries em nome dele.

A abordagem tem duas partes. Primeiro, a regra de status passa para o
`TreatmentPlanService`. Segundo, sempre que o `patient_id` muda, o backend gera
um `public_token` novo.

## O que construir

- **Dono:** módulo `TreatmentProgram`, sem migration. Rotas `POST` e `PUT /api/clinic/treatment-plans`, guard `clinic`.
- **Criar sem `status`:** com paciente, `active`; sem paciente, `draft`. Os eventos de ativação são disparados como hoje.
- **Editar sem `status`:**
  - Paciente removido: `draft`.
  - Era `draft` e ganhou paciente: `active` (dispara `TreatmentPlanActivated`).
  - Qualquer outro caso: mantém (concluído e arquivado continuam como estão).
- **`status` explícito:** se vier no payload, continua valendo como hoje, por compatibilidade.
- **Paciente mudou** (troca por outro ou remoção): o plano ganha `public_token` novo. O antigo responde 404 em todas as rotas `patient/programs/{publicToken}`. Editar sem mexer no paciente mantém o link.
- **Isolamento:** a validação de paciente da própria clínica (`ValidatesPatientOfClinic`) não muda. As execuções e cargas continuam filtradas pelo `patient_id` de quem fez, e "visto"/"concluído N vezes" (na linha do plano) são zerados na troca, então o paciente novo, pelo link novo, não vê o que o anterior registrou (corrigido na revisão adversária, rodada 1).
- **ADR 025:** completar com a decisão do link novo ao trocar de paciente (se a tarefa 001 ainda não o criou, criar aqui).

## Critérios de Aceite

- [x] Criar sem `status`, com paciente, grava `active` e dispara a ativação; sem paciente, grava `draft` (PHPUnit).
- [x] Editar um rascunho dando paciente, sem `status`, grava `active` e dispara `TreatmentPlanActivated` (PHPUnit).
- [x] Editar um programa concluído e um arquivado sem `status` mantém a situação (PHPUnit).
- [x] Editar tirando o paciente grava `draft` (PHPUnit).
- [x] Trocar o paciente gera `public_token` novo; o antigo dá 404 no `show` e ao iniciar uma execução (PHPUnit).
- [x] Tirar o paciente também troca o link; editar sem mexer no paciente mantém o link (PHPUnit).
- [x] Pelo link novo, o paciente novo não recebe as cargas do anterior (PHPUnit).
- [x] `status` explícito no payload continua valendo (a v1 segue funcionando).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (`TreatmentPlanIsolationTest` verde).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda manualmente.

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** a mesma da tarefa 001.
- **Exemplo no código:** `modules/TreatmentProgram/tests/Feature/TreatmentProgramEventsTest.php` (eventos de ativação); `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramIsolationTest.php` e `SharedProgramControllerTest.php` (link público).
- **Skills:** `backend-clean-code`, `php-testing`, `security`.

## Como testar na mão

1. Programa 7 com paciente A: copie o link (`share_url`) e abra numa aba anônima.
2. Edite o programa trocando para o paciente B (pela API ou pela v1).
3. Recarregue o link antigo: "Programa não encontrado".
4. O link novo, que vem na resposta, abre sem as cargas do paciente A.
5. Conclua um programa e salve uma edição de título sem `status`: ele continua concluído.
