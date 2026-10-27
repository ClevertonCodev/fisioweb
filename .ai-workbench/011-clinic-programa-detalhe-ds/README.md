# 011 · Detalhe do programa no DS v2

O detalhe do programa (`/clinica/programas/:id`) deixa a v1 e o protótipo
`?variant=` e vira o "Painel do programa" v2 de verdade, com WhatsApp e todas
as ações reais, para o fisioterapeuta acompanhar e reenviar o programa no
visual já escolhido.

- **Status:** implementada, sem commit; revisão adversária pendente (o usuário roda)
- **Branch:** `feat/clinic-historico-exercicios-programas` (o usuário pediu para seguir nesta)
- **Plano:** [`plans/clinic-programa-detalhe-ds.md`](plans/clinic-programa-detalhe-ds.md)
- **Decisões:** [`decisoes.md`](decisoes.md)
- **Módulos:** `TreatmentProgram` (sem mudança de código de produção; só teste
  de regressão do `show`); SPA `pages/clinic/program`, `application/clinic`,
  `components/clinic/program/ProgramShareDialog`, gaveta de programa do
  prontuário (`pages/clinic/patient/patient-record`)

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Painel do programa v2 de verdade e corte da v1](tasks/001-painel-do-programa-e-corte.md) | concluída (sem revisão adversária) | | |
| [002 · Menu ⋯ com as seis ações](tasks/002-menu-de-acoes-do-programa.md) | concluída (sem revisão adversária) | | |
| [003 · WhatsApp real com a mensagem compartilhada](tasks/003-whatsapp-do-programa.md) | concluída (sem revisão adversária) | | |
| [004 · "Voltar" volta para a origem](tasks/004-voltar-para-a-origem.md) | concluída (sem revisão adversária) | | |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
