# 005 · Lista de pacientes no design system v2

A lista de pacientes da clínica deixa a tabela v1 e vira os cartões da C2, com
filtros na URL, inativar e reativar com confirmação e só pelos papéis certos, e
o backend como único caminho para ativar ou inativar paciente.

- **Status:** em revisão (Definição de Pronto cumprida; aguardando commit e PR)
- **Branch:** `feat/clinic-pacientes-ds` (uma PR só, por decisão do usuário)
- **Plano:** [`plans/clinic-pacientes-ds.md`](plans/clinic-pacientes-ds.md)
- **Módulos:** `modules/Patient` (contrato e repository), `modules/Clinic`
  (controller, Policy, FormRequests, rota); SPA `pages/clinic/patient`,
  `domain/clinic`, `application/clinic`, `infrastructure/repositories`

## Decisões (ADRs)

- [014 · Situação do paciente só por endpoints próprios, com Policy](../../docs/adr/014-situacao-do-paciente-so-por-endpoints-proprios.md)
- [015 · Busca, filtros e paginação da lista na URL](../../docs/adr/015-estado-da-lista-de-pacientes-na-url.md)
- [016 · A lista v2 (cartões C2) substitui a v1 de vez](../../docs/adr/016-lista-de-pacientes-v2-substitui-a-v1.md)
- [017 · Ação sem permissão aparece desabilitada, com o motivo](../../docs/adr/017-acao-sem-permissao-visivel-e-desabilitada.md)

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Paciente só muda de situação pelos endpoints com Policy](tasks/001-is-active-so-pelos-endpoints.md) | concluída | | |
| [002 · Lista de pacientes v2 em cartões substitui a v1](tasks/002-lista-v2-em-cartoes.md) | concluída | | |
| [003 · Filtros com chips e gaveta no celular, na URL](tasks/003-filtros-com-chips-na-url.md) | concluída | | |
| [004 · Inativar paciente pelo cartão, com confirmação e regra de papel](tasks/004-inativar-pelo-cartao.md) | concluída | | |
| [005 · Reativar paciente inativo, de ponta a ponta](tasks/005-reativar-paciente.md) | concluída | | |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
