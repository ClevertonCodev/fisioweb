# 012 · Assistente de programa no DS v2 (novo, editar e modelos)

Novo programa, editar programa e criar/editar modelo passam a ser uma tela só,
o assistente v2 em três etapas, salvando de verdade, para o fisioterapeuta
montar e ajustar programas sem apagar o que o paciente já registrou.

- **Status:** implementada; falta a revisão adversária (o usuário roda manualmente)
- **Branch:** `feat/clinic-programa-assistente-ds` (criada a partir de `feat/clinic-historico-exercicios-programas`, que tem a 011)
- **Plano:** [`plans/clinic-programa-assistente-ds.md`](plans/clinic-programa-assistente-ds.md)
- **Decisões:** [`decisoes.md`](decisoes.md)
- **Módulos:** `TreatmentProgram` (salvar e editar programa, link público); `Admin`
  (contrato público do catálogo de exercícios); SPA `pages/clinic/program`,
  `application/clinic`, `infrastructure/repositories`, `domain/clinic`,
  `routes/clinic/program-routes`; sai a v1 em `components/clinic/program`

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Editar sem apagar o histórico do paciente](tasks/001-editar-sem-apagar-historico.md) | concluída | | |
| [002 · Status no backend e link novo ao trocar paciente](tasks/002-status-e-link-ao-trocar-paciente.md) | concluída | | |
| [003 · Só exercício visível para a clínica](tasks/003-exercicio-visivel-para-a-clinica.md) | concluída | | |
| [004 · Novo programa de verdade](tasks/004-novo-programa-de-verdade.md) | concluída | | |
| [005 · Rascunho, prontuário, etapas, datas e Voltar](tasks/005-rascunho-prontuario-etapas-e-datas.md) | concluída | | |
| [006 · Editar programa no assistente](tasks/006-editar-programa-no-assistente.md) | concluída | | |
| [007 · Modelos no assistente e corte da v1](tasks/007-modelos-e-corte-da-v1.md) | concluída | | |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
