# Fisio vê só os pacientes dele

**Tipo:** História
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

Hoje o fisioterapeuta vê todos os pacientes da clínica. A regra decidida: ele vê só os pacientes de que é responsável (tarefa 011) ou com que tem vínculo de atendimento (tarefa 012). Admin e secretária continuam vendo todos da clínica. Paciente de outro fisio dá 404 e não aparece em lista nenhuma.

Como todos os módulos já usam a busca de paciente acessível do Patient (tarefa 003), a regra entra num lugar só: dentro dessa busca e da listagem do contrato.

## O que construir

- **Patient**: para usuário com papel fisioterapeuta, a busca de paciente acessível e a listagem consideram só pacientes com responsável igual a ele **ou** com vínculo em `patient_care_links`. Para admin e secretária, nada muda.
- O efeito aparece sem mudança de código nos outros módulos:
  - lista e ficha de pacientes;
  - prontuário: evoluções, avaliações, arquivos;
  - questionários do paciente;
  - seletor de paciente da agenda (usa a listagem);
  - validação de paciente ao agendar e ao criar ou editar plano (tarefa 005).

  Paciente sem vínculo dá 404 na leitura e 422 na validação.
- **TreatmentProgram**: a listagem de planos, para fisio, mostra só planos de pacientes acessíveis a ele ou planos sem paciente criados por ele.
- **Dashboard**: já filtra o fisio pelo responsável (`DashboardScope`) e mostra só métricas, então não muda. Fica registrado no critério.
- **SPA**: nada muda. O SPA já mostra o que a API devolve, e o 404 já é tratado.
- Sem migration (as tabelas vêm das tarefas 011 e 012).

## Critérios de Aceite

- [ ] Fisio A não vê na lista o paciente cujo responsável é o fisio B e com que ele não tem vínculo.
- [ ] Fisio A recebe 404 ao abrir esse paciente, as evoluções, as avaliações, os arquivos e os questionários dele.
- [ ] Fisio A recebe 422 ao agendar consulta ou criar plano para esse paciente.
- [ ] Depois que a secretária agenda uma consulta do fisio A com esse paciente, ele passa a aparecer para o A.
- [ ] Fisio vê o paciente de que é responsável mesmo sem nenhum atendimento.
- [ ] Admin e secretária continuam vendo todos os pacientes da clínica.
- [ ] O seletor de paciente da agenda (`GET /api/clinic/patients?per_page=200&is_active=1`) devolve, para fisio, só os pacientes dele.
- [ ] A lista de planos do fisio não mostra plano de paciente de outro fisio. Mostra o plano sem paciente criado por ele.
- [ ] O dashboard do fisio continua igual (teste existente verde).
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade. Vínculo de fisio da B com paciente da B não muda nada para a A.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `003-busca-de-paciente-acessivel` (Busca de paciente acessível no Patient e todos os módulos usando ela)
- `005-plano-so-com-paciente-acessivel` (Plano de tratamento só aceita paciente acessível)
- `011-fisioterapeuta-responsavel-obrigatorio` (Fisioterapeuta responsável obrigatório no paciente)
- `012-vinculo-fisio-paciente` (Vínculo fisio-paciente por eventos, com backfill e ADR)

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - `modules/ClinicScheduling/tests/Feature/AppointmentIndexVisibilityTest.php` (visibilidade por papel na agenda);
  - `modules/Clinic/app/Services/DashboardScope.php` (escopo por papel);
  - `modules/Clinic/tests/Feature/PatientClinicIsolationTest.php`.
- **Skills:** `security`, `laravel-eloquent`, `architecture-paradigm-modular-monolith`, `php-testing`
- O filtro da listagem é uma subconsulta em `patient_care_links` ou uma junção, sem N+1. Conferir a paginação com fisio dono de muitos pacientes.
- Depois do merge, avisar as clínicas: paciente cadastrado sem consulta e sem responsável (os antigos de secretária) não aparece para nenhum fisio até a recepção escolher o responsável.

## Como testar na mão

1. Na clínica A, com os fisios X e Y, cadastre o paciente P com responsável Y.
2. Entre como X. P não aparece na lista de pacientes nem no seletor da agenda, e abrir `/clinica/pacientes/...` mostra "não encontrado".
3. Entre como secretária e agende uma consulta de X com P.
4. Entre de novo como X → P aparece na lista, e o prontuário abre.
5. Entre como admin → vê todos os pacientes, inclusive P.
