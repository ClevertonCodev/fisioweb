# Vídeo e imagem protegidos nas telas da clínica

**Tipo:** História
**Plano:** `../plans/midia-protegida.md`
**Histórias:** 2, 3, 4, 6, 7, 15, 24
**Issue:** ainda não criada

## Descrição

Com o link assinado da tarefa 001, o vídeo ainda toca por `<video src>` com o endereço visível, e um link vencido trava o player. Esta tarefa cria os dois componentes que as outras telas vão usar e aplica os dois nas telas da clínica.

O vídeo protegido mostra a capa, baixa o vídeo inteiro só no play, toca como `blob:`, não oferece download e pede um link novo sozinho quando o antigo venceu. A imagem protegida pede um link novo uma vez quando não carrega.

## O que construir

- Cliente de armazenamento em `infrastructure/`: axios próprio, sem interceptor e sem JWT, porque o R2 recusa link assinado com `Authorization`. O `apiClient` continua sendo o único caminho para a API do fisioweb. A exceção segue o precedente do `viaCepClient`.
- Vídeo protegido (componente compartilhado): mostra a capa por imagem protegida e não baixa nada antes do play. No play, baixa o vídeo inteiro e toca como `blob:`. Libera o `blob:` ao desmontar, usa `controlsList="nodownload"` e bloqueia o menu de contexto. Se o download responder 403, pede o link novo refazendo a query dona e tenta uma vez; se falhar de novo, mostra erro.
- Imagem protegida: `<img>` com o link assinado que, se não carregar, refaz a query dona uma vez.
- Telas da clínica: biblioteca de exercícios, envio de exercício (prévia do enviado), detalhe, histórico, montagem e modelos de programa. O `VideoThumb` passa a usar o vídeo protegido.
- Só front. Os endpoints são os da tarefa 001, sem mudança de acesso.

## Critérios de Aceite

- [ ] O vídeo protegido não baixa nada antes do play (teste Vitest).
- [ ] No play, ele toca como `blob:` e libera o `blob:` ao desmontar (teste Vitest).
- [ ] Com o download respondendo 403, ele pede link novo e toca (teste Vitest).
- [ ] O player tem `nodownload` e bloqueia o menu de contexto (teste Vitest).
- [ ] O download do vídeo não leva o cabeçalho `Authorization` (teste Vitest).
- [ ] A imagem protegida pede link novo uma vez quando não carrega (teste Vitest).
- [ ] Nenhuma tela da clínica usa mais `<video src>` com o link da API.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-video-e-capa-com-link-assinado` (Vídeo e capa com link assinado no servidor).

## Notas de Implementação

- **Branch:** `feat/midia-protegida`
- **Exemplo no código:** o `viaCepClient` (axios sem interceptor) e o `VideoThumb` com o `use-media-ready` (player a substituir). Os downloads em `blob` da evolução e do PDF do programa mostram como liberar o `blob:`.
- **Skills:** `api-client`, `frontend-ddd`, `frontend-react`, `frontend-testing`, `design-system`, `qa-navegador`.
- O CORS do bucket precisa liberar `GET` para a origem da tela, senão o download falha. Numa worktree do `fisio-app` a porta é sorteada: confira o CORS antes de concluir que o código está errado.

## Como testar na mão

1. Login como `physiotherapist` da clínica A e abra a biblioteca de exercícios.
2. Na aba Rede, só as capas carregam. No play, o vídeo baixa uma vez e toca como `blob:`.
3. Não aparecem botão de download nem menu de botão direito.
4. Force um prazo curto no `.env` local, espere vencer e dê play num vídeo ainda não baixado: ele pede link novo e toca.
5. Confira o detalhe, o histórico, a montagem e os modelos de programa.
