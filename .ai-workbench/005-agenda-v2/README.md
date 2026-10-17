# 005 · Agenda da clínica no design system v2

Leva para produção a agenda e o modal de consulta do protótipo v2. A visão e o fim de semana passam a ser salvos na conta do usuário, cada clínica ganha a própria lista de tipos de serviço com duração padrão, e o modal mostra o histórico completo do paciente para quem o atende.

- **Status:** implementada, com uma pendência aceita pelo usuário (2026-10-17)
- **Pendência:** editar no modal o horário de consultas que terminam em outro dia (passam da meia-noite ou duram vários dias). A revisão adversária foi até a rodada 7 achando casos novos nesse ponto, e a correção da rodada 7 não foi revisada. O usuário decidiu deixar como está e resolver depois. Opções levantadas: travar o horário desses eventos no modal, ou pôr um campo de data no término.
- **Branch:** `feat/clinic-agenda-ds`
- **Plano:** [`plans/agenda-v2.md`](plans/agenda-v2.md)
- **Módulos:** `Clinic` (preferências do usuário), `ClinicScheduling` (tipos de serviço e histórico do paciente). No SPA: `pages/clinic` (agenda), `components/clinic/agenda`, `domain/`, `application/` e `infrastructure/` da clínica. Sai a v1 da agenda e a pasta do protótipo.

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Tela da agenda v2 em produção (calendário)](tasks/001-tela-da-agenda-v2.md) | implementada | | |
| [002 · Coluna da esquerda da agenda (flutuante, fixa e gaveta)](tasks/002-coluna-da-agenda.md) | implementada | | |
| [003 · Modal de consulta v2 de produção (RHF + Zod)](tasks/003-modal-de-consulta-v2.md) | implementada | | |
| [004 · Preferências do usuário: visão e fim de semana salvos](tasks/004-preferencias-do-usuario.md) | implementada | | |
| [005 · Tipos de serviço por clínica com duração padrão](tasks/005-tipos-de-servico-por-clinica.md) | implementada | | |
| [006 · Editar os tipos de serviço no modal](tasks/006-editar-tipos-de-servico.md) | implementada | | |
| [007 · Histórico completo do paciente no modal](tasks/007-historico-do-paciente.md) | implementada | | |

Dependências: 002, 003 e 004 dependem só da 001. A 005 e a 007 dependem da 003. A 006 depende da 005.

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
