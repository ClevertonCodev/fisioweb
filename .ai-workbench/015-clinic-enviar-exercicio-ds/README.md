# 015 · Enviar exercício da clínica no DS v2

Substitui a tela v1 e o protótipo de `/clinica/exercicios/enviar` pela tela oficial no Design System v2 (variante A: Vídeo, Informações e Imagens com prévia da biblioteca e checklist ao lado), conectada ao upload real no R2 com recorte de imagem em `DsModal`, limite de 20 MB no backend e isolamento dos vídeos por clínica.

- **Status:** concluída
- **Branch:** `feat/clinic-enviar-exercicio-ds`
- **Plano:** [`plans/clinic-enviar-exercicio-ds.md`](plans/clinic-enviar-exercicio-ds.md)
- **Decisões:** [`decisoes.md`](decisoes.md)
- **Módulos:** `modules/Media`, `modules/Clinic`, `config/cloudflare.php`, `resources/js/{pages/clinic,application/clinic,test}`

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [`001-limite-20mb-e-isolamento-video-clinica`](tasks/001-limite-20mb-e-isolamento-video-clinica.md) | concluída | ainda não criada | - |
| [`002-tela-enviar-exercicio-ds-e-corte-v1`](tasks/002-tela-enviar-exercicio-ds-e-corte-v1.md) | concluída | ainda não criada | - |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
