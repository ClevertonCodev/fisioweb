# Botão "Trocar imagens" no modal da biblioteca, com o aviso "em revisão" no aprovado

**Tipo:** História
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 30, 36, 54, 55, 56
**Issue:** ainda não criada

## Descrição

Hoje não existe tela para a clínica trocar a mídia de um exercício que ela já enviou: as rotas de mídia só são usadas no envio novo. A decisão foi criar essa tela no modal da biblioteca v2, só para o admin e só para os exercícios da própria clínica.

## O que construir

- O modal do exercício da biblioteca v2 ganha o botão "Trocar imagens". Ele aparece quando o exercício é da própria clínica (`isOwnSubmission`) e quem está logado é admin, pela regra em `permissions.ts`.
- O botão abre a troca da thumbnail e das 2 imagens de referência, com o mesmo recorte do envio. As imagens de referência usam as rotas que já existem (pedido de URL de substituição e `reference-images`).
- **Rota nova da clínica para trocar a thumbnail de vídeo concluído** (decisão do usuário em 2026-11-11): hoje o `confirm-upload` só aceita vídeo pendente e o `PATCH` de thumbnail é só do admin. A rota nova fica em `modules/Media/routes/clinic.php` (`auth:clinic` + `clinic.admin`), passa pelo `ensureOwnedVideo` e pelo `VideoService` com a trava da 018 (`isLocked`): vídeo livre aplica na hora, vídeo travado grava `proposed_thumbnail_path` e responde `proposal_pending: true`. O caminho da thumbnail precisa ter sido emitido para este vídeo (como o `issued_image_paths` das imagens).
- Exercício pendente ou rejeitado: a troca vale na hora, e o modal mostra as imagens novas.
- Exercício aprovado: antes de salvar, aparece o aviso "A troca vai para revisão do suporte; até lá, todos continuam vendo a mídia atual". Depois de salvar, o modal mostra o selo "em revisão" enquanto `media_proposal_pending` for verdadeiro.
- O vídeo, o nome e o texto não mudam nessa tela.
- As camadas: a entidade em `domain/` ganha `mediaProposalPending`, o mapper e o repository passam o campo, e o hook da troca fica em `application/`.

## Critérios de Aceite

- [x] O botão só aparece para o admin e só em exercício da própria clínica; o fisio e a secretária não veem (teste Vitest)
- [x] A troca em exercício pendente atualiza as imagens do modal (teste Vitest)
- [x] No exercício aprovado, o aviso aparece antes de salvar e o selo depois (teste Vitest)
- [x] O recorte reaproveita o componente do envio
- [x] A rota nova da thumbnail aplica na hora no vídeo livre e vira proposta no vídeo travado; a clínica B leva 404 e nada muda; o fisio leva 403; caminho não emitido para o vídeo leva 422 (teste PHPUnit)
- [x] Um smoke no navegador com a troca num exercício aprovado, com evidência
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `018-proposta-de-midia-no-backend` (Proposta de mídia de exercício aprovado no backend).

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `resources/js/pages/clinic/program/exercise-library/ExerciseModal.tsx` e `media.tsx` (já leem `isOwnSubmission` e `reviewStatus`); `resources/js/pages/clinic/exercise-submit/ExerciseImageCropModal.tsx`; `resources/js/application/clinic/upload-video-reference-images.ts`
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`, `frontend-testing`, `qa-navegador`

## Como testar na mão

1. Como admin da clínica A, abra na biblioteca um exercício que a clínica enviou e que ainda está pendente. Clique em "Trocar imagens", troque e confira as imagens novas no modal.
2. Faça o mesmo num exercício já aprovado: aparece o aviso e, depois de salvar, o selo "em revisão".
3. Como fisio, abra o mesmo exercício: o botão não aparece.
