# 022 · Módulo de e-mail

A clínica passa a mandar programa, questionário e avisos de consulta ao paciente por e-mail pelo servidor (com a marca IVS MED e um modal "Enviar ao paciente" que também abre o WhatsApp), o paciente ganha a página para responder o questionário e o lembrete de consulta 24 h antes, e os e-mails do sistema ganham a mesma marca.

- **Status:** em andamento
- **Branch:** `feat/modulo-comunicacao`
- **Plano:** [`plans/modulo-comunicacao.md`](plans/modulo-comunicacao.md)
- **Decisões:** [`decisoes.md`](decisoes.md)
- **Passagem:** [`HANDOFF.md`](HANDOFF.md) (levantamento de 2026-11-18)
- **Protótipo:** branch `prototype/022-emails` (`a5afbd0`), fora da `main`
- **Módulos:** `Email` (novo), `TreatmentProgram`, `ClinicQuestionnaire`, `ClinicScheduling`, `Patient`, `Clinic`; SPA em `pages/clinic` (programa, prontuário, agenda, paciente, dados da clínica), `pages/patient` (questionário público) e página pública de sair dos lembretes

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Módulo Email e e-mails do sistema](tasks/001-modulo-email-e-emails-do-sistema.md) | concluída | | |
| [002 · Programa por e-mail no detalhe + modal C](tasks/002-programa-por-email-no-detalhe.md) | a fazer | | |
| [003 · Modal C no assistente de programa](tasks/003-modal-no-assistente-de-programa.md) | a fazer | | |
| [004 · Página pública do questionário](tasks/004-pagina-publica-do-questionario.md) | concluída | | |
| [005 · Questionário por e-mail](tasks/005-questionario-por-email.md) | a fazer | | |
| [006 · Agenda: avisar ao marcar](tasks/006-agenda-avisar-ao-marcar.md) | a fazer | | |
| [007 · Agenda: avisar ao remarcar e cancelar](tasks/007-agenda-avisar-ao-remarcar-e-cancelar.md) | a fazer | | |
| [008 · Configuração do lembrete](tasks/008-configuracao-do-lembrete.md) | concluída | | |
| [009 · Disparar o lembrete 24 h antes](tasks/009-disparar-lembrete.md) | a fazer | | |
| [010 · Sair dos lembretes](tasks/010-sair-dos-lembretes.md) | a fazer | | |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
