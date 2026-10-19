# 007 · Dados da clínica no design system v2

A tela `/clinica/dados` passa do formulário v1 para o design system v2
(variante A do protótipo, "Cartão de visita ao vivo"): o mestre edita
identidade, contato e endereço; quem não é mestre só lê; ao lado, a prévia
mostra como o paciente vê os dados.

- **Status:** concluída
- **Branch:** `feat/clinic-dados-ds`
- **Plano:** [`plans/clinic-dados-ds.md`](plans/clinic-dados-ds.md)
- **Módulos:** SPA `pages/clinic/clinic-data`, `application/clinic`; seed em
  `database/seeders`; backend de perfil já existe (`modules/Clinic`)

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Dados da clínica no DS v2](tasks/001-tela-dados-clinica-ds.md) | concluída | | |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
