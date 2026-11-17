# Vídeo e imagem protegidos no painel admin

**Tipo:** História
**Plano:** `../plans/midia-protegida.md`
**Histórias:** 8, 9, 24
**Issue:** ainda não criada

## Descrição

O painel master mostra os vídeos e as capas do catálogo, das revisões de exercício, das propostas de mídia (ADR 029) e dos programas modelo. Depois da tarefa 001, essas telas recebem link assinado mas ainda tocam pelo player antigo. Esta tarefa troca os players e as imagens pelos componentes protegidos da tarefa 002.

## O que construir

- Telas do admin: lista, detalhe e edição de vídeo; prévia de vídeo do exercício; revisão de exercício; cartão de proposta de mídia (atual e proposta lado a lado); passos do programa modelo (seleção, configuração e detalhes); detalhe, criação e edição de programa do admin.
- Os mappers do admin já leem `video_url` desde a tarefa 001. Aqui muda só a apresentação.
- Guard `admin`, sem mudança de acesso. Nenhum endpoint novo.

## Critérios de Aceite

- [ ] Nenhuma tela do admin usa mais `<video src>` ou `<img src>` cru para vídeo e capa. Todas usam os componentes protegidos.
- [ ] A proposta de mídia mostra a capa atual e a capa proposta, as duas por link assinado.
- [ ] O vídeo toca como `blob:` e não oferece download.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-video-e-imagem-protegidos-na-clinica` (componentes protegidos).

## Notas de Implementação

- **Branch:** `feat/midia-protegida`
- **Exemplo no código:** as telas da clínica migradas na tarefa 002.
- **Skills:** `frontend-react`, `frontend-testing`, `forms-shadcn` (telas v1 do admin), `qa-navegador`.
- O critério de outra clínica vale para os endpoints da clínica que alimentam a proposta: a clínica B não vê a proposta da A.

## Como testar na mão

1. Login no admin e abra a lista de vídeos, o detalhe e a edição de um vídeo.
2. Com uma proposta de mídia pendente da clínica A, abra a revisão: as capas atual e proposta aparecem, e os vídeos tocam.
3. Abra um programa modelo e confira as capas e os vídeos.
