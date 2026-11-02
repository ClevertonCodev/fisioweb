# 014 · Criar conta da clínica no DS v2 com confirmação de e-mail

Transforma o protótipo A ("Três passos") na tela oficial de `/clinica/criar-conta` no DS v2 e implementa o auto-cadastro real da clínica no backend com confirmação obrigatória de e-mail e aceite de termos (LGPD).

- **Status:** concluída
- **Branch:** `feat/clinic-criar-conta-ds`
- **Plano:** [`plans/clinic-criar-conta-ds.md`](plans/clinic-criar-conta-ds.md)
- **Decisões:** [`decisoes.md`](decisoes.md)
- **Módulos:** `modules/Clinic`, `modules/Admin` (contrato público de leitura de plano), `resources/js/{pages/clinic,application/clinic,infrastructure/repositories,routes}`

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [`001-auto-cadastro-clinica-e-slug-disponivel`](tasks/001-auto-cadastro-clinica-e-slug-disponivel.md) | concluída | ainda não criada | - |
| [`002-confirmacao-de-email-e-bloqueio-no-login`](tasks/002-confirmacao-de-email-e-bloqueio-no-login.md) | concluída | ainda não criada | - |
| [`003-telas-criar-conta-confirmar-email-e-corte-v1`](tasks/003-telas-criar-conta-confirmar-email-e-corte-v1.md) | concluída | ainda não criada | - |
| [`004-aceite-de-termos-lgpd-no-auto-cadastro`](tasks/004-aceite-de-termos-lgpd-no-auto-cadastro.md) | concluída | ainda não criada | - |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
