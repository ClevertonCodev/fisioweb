# Operador revisa a proposta de mídia (antes e depois, aprovar e rejeitar)

**Tipo:** História
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 32, 33, 34
**Issue:** ainda não criada

## Descrição

Com a proposta gravada (018), o operador precisa vê-la e decidir. Esta tarefa leva as propostas para a fila de revisão do painel admin, com o antes e o depois.

## O que construir

- Endpoints do Admin (guard `admin`):

  | Método | URL | Efeito |
  |---|---|---|
  | GET | `/api/admin/exercises/media-proposals` | `{data: [{exercise, video_id, current: {thumbnail_url, reference_images}, proposed: {...}, proposed_at}]}` |
  | PUT | `/api/admin/exercises/{id}/media-proposal/approve` | aplica a proposta ao vídeo, sincroniza as imagens do PDF dos exercícios aprovados ligados e limpa a proposta |
  | PUT | `/api/admin/exercises/{id}/media-proposal/reject` | descarta a proposta e apaga do R2 os objetos propostos |

- O exercício continua `approved` o tempo todo.
- O `pending-count` soma as propostas.
- O Admin aplica e descarta pelo contrato público do Media, sem importar model do Media.
- SPA admin (v1, shadcn): a revisão de exercício ganha a seção "Mídia proposta", com o antes e o depois lado a lado e os botões aprovar e rejeitar. O contador de pendentes inclui as propostas.

## Critérios de Aceite

- [ ] A lista mostra a proposta com a mídia atual e a proposta
- [ ] Aprovar aplica: a clínica B passa a ver as imagens novas, o PDF também, e o `media_proposal_pending` some
- [ ] Rejeitar descarta: a mídia antiga fica e os objetos propostos são apagados
- [ ] Aprovar ou rejeitar sem proposta dá 422
- [ ] O guard `clinic` nas rotas dá 401
- [ ] O `pending-count` conta as propostas
- [ ] A seção "Mídia proposta" aprova e rejeita (teste Vitest)
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `018-proposta-de-midia-no-backend` (Proposta de mídia de exercício aprovado no backend).

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Admin/app/Services/ExerciseSubmissionService.php` e o `ExerciseReviewController`; `resources/js/pages/admin/exercises/AdminExerciseReviewPage.tsx`
- **Skills:** `architecture-paradigm-modular-monolith`, `php-testing`, `forms-shadcn`, `frontend-ddd`, `frontend-testing`

## Como testar na mão

1. Depois do passo 2 do teste manual da tarefa 019, como operador, abra a revisão de exercícios: a proposta aparece com o antes e o depois.
2. Aprove e, como clínica B, abra o exercício: as imagens são as novas.
3. Repita com outra proposta e rejeite: as imagens continuam as antigas.
