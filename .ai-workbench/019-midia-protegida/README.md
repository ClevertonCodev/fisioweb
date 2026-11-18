# 019 · Mídia protegida

Nenhum vídeo, capa, imagem ou foto tem mais endereço público: cada tela recebe um link assinado que vence, para que ninguém copie a biblioteca nem abra arquivo fora do sistema.

- **Status:** concluída em 2026-11-17. Revisão adversária fechada na rodada 6 por decisão do usuário, sem APROVADO formal: as correções da rodada 6 foram conferidas por teste com mutação e smoke, não por um revisor (ver `review/000-feature-019/decisoes.md`, local).
- **Branch:** `feat/midia-protegida`
- **Plano:** [`plans/midia-protegida.md`](plans/midia-protegida.md)
- **Decisões:** [`decisoes.md`](decisoes.md)
- **Módulos:** `Cloudflare`, `Media`, `Admin`, `Clinic`, `Patient`, `TreatmentProgram`, `ClinicScheduling`, `ClinicalRecord`, `ClinicFinance`, `Pdf`; SPA `pages/clinic`, `pages/admin`, `pages/patient`, `components/`, `infrastructure/`

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [`001-video-e-capa-com-link-assinado`](tasks/001-video-e-capa-com-link-assinado.md) | concluída | | |
| [`002-video-e-imagem-protegidos-na-clinica`](tasks/002-video-e-imagem-protegidos-na-clinica.md) | concluída | | |
| [`003-midia-protegida-no-admin`](tasks/003-midia-protegida-no-admin.md) | concluída | | |
| [`004-imagens-de-referencia-privadas`](tasks/004-imagens-de-referencia-privadas.md) | concluída | | |
| [`005-area-do-paciente-com-video-protegido`](tasks/005-area-do-paciente-com-video-protegido.md) | concluída | | |
| [`006-foto-do-profissional-privada`](tasks/006-foto-do-profissional-privada.md) | concluída | | |
| [`007-foto-do-paciente-privada`](tasks/007-foto-do-paciente-privada.md) | concluída | | |
| [`008-pdf-do-programa-com-midia-assinada`](tasks/008-pdf-do-programa-com-midia-assinada.md) | concluída | | |
| [`009-fechar-a-porta`](tasks/009-fechar-a-porta.md) | concluída | | |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`, `DEFERRED.md`, `roteiros/`: no git (os roteiros do smoke não têm senha; o login vem de `FISIO_LOGIN`/`FISIO_SENHA` ou do `credentials.json`).
- `evidence/`, `review/`: locais, fora do git.
