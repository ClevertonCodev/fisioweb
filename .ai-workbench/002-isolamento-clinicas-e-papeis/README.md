# 002 · Isolamento entre clínicas e regras de papel

Fecha as falhas da auditoria em que uma clínica alcança dados de outra (usuários, pacientes no plano, questionário público, vídeos, exercícios, modelos de evolução) e acerta duas regras de papel: a secretária só lê o prontuário e o fisioterapeuta vê só os pacientes dele. Ganham as clínicas e os pacientes, que passam a ter os dados isolados de verdade.

- **Status:** planejada
- **Branch:** `feat/isolamento-clinicas-e-papeis` (uma PR só, por decisão do usuário)
- **Plano:** [`plans/isolamento-clinicas-e-papeis.md`](plans/isolamento-clinicas-e-papeis.md)
- **Módulos:** núcleo `app/Http/Controllers`, `Clinic`, `Patient`, `ClinicScheduling`, `ClinicFinance`, `ClinicalRecord`, `ClinicQuestionnaire`, `TreatmentProgram`, `Media`, `tests/Architecture`, `docs/adr`. No SPA: `pages/clinic/patient` (formulário e prontuário), `components/clinic/patient`, `domain/clinic/patient.ts`, `application/clinic/permissions.ts`.

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Checagem de clínica no controller base e usuários de outra clínica com 404](tasks/001-checagem-de-clinica-e-usuarios.md) | a fazer | | |
| [002 · `Gate::before` nega o admin em recurso de outra clínica](tasks/002-gate-before-por-clinica.md) | a fazer | | |
| [003 · Busca de paciente acessível no Patient e todos os módulos usando ela](tasks/003-busca-de-paciente-acessivel.md) | a fazer | | |
| [004 · Padronizar as checagens restantes, unificar o 404 e criar a trava de arquitetura](tasks/004-padronizar-checagens-e-trava.md) | a fazer | | |
| [005 · Plano de tratamento só aceita paciente acessível](tasks/005-plano-so-com-paciente-acessivel.md) | concluída na branch `feat/clinic-historico-exercicios-programas` (2026-10-22) | | |
| [006 · Favoritos e plano só com exercício visível para a clínica](tasks/006-exercicios-visiveis-favoritos-e-plano.md) | a fazer | | |
| [007 · Modelos de evolução só do sistema ou da própria clínica](tasks/007-modelos-de-evolucao-por-clinica.md) | a fazer | | |
| [008 · Remover o questionário público e validar `question_id` contra o template](tasks/008-remover-questionario-publico.md) | a fazer | | |
| [009 · Vídeos com clínica dona e rotas da clínica reduzidas ao fluxo de envio](tasks/009-videos-com-clinica-dona.md) | a fazer | | |
| [010 · Secretária só lê o prontuário](tasks/010-secretaria-so-le-prontuario.md) | a fazer | | |
| [011 · Fisioterapeuta responsável obrigatório no paciente](tasks/011-fisioterapeuta-responsavel-obrigatorio.md) | a fazer | | |
| [012 · Vínculo fisio-paciente por eventos, com backfill e ADR](tasks/012-vinculo-fisio-paciente.md) | a fazer | | |
| [013 · Fisio vê só os pacientes dele](tasks/013-fisio-ve-so-os-pacientes-dele.md) | a fazer | | |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
