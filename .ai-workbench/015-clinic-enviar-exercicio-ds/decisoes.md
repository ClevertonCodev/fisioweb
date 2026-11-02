# Decisões · Enviar exercício da clínica no DS v2

## Sessão 2026-11-02

- **Limite de tamanho do vídeo no backend** → 20 MB (`20971520` bytes) em `config/cloudflare.php` e `.env.example`, valendo para clínica e admin (que já travam em 20 MB no frontend).
- **Orientação, qualidade e duração no servidor** → Manter a conferência no navegador (`video-rules.ts`) e adiar a validação no servidor (ffprobe e tamanho real no R2) no `DEFERRED.md` da feature.
- **"Ajustar vídeo" (`VideoEditor`) na tela real** → Fica onde o navegador suporta (`MediaRecorder` + `canvas.captureStream` com MP4 ou WebM) e esconde o botão/atalho quando a API do navegador não estiver disponível.
- **Recorte de imagem da capa e fotos de referência** → Criar modal de recorte no DS v2 (`DsModal`, sem shadcn) para recortar a capa e as 2 fotos de referência do PDF ao escolher um arquivo de imagem.
- **Depois de enviar** → Mostrar o cartão de confirmação ("Exercício enviado para revisão") na própria tela com os botões "Enviar outro" (limpa o formulário) e "Ir para a biblioteca" (`/clinica/exercicios`).
- **Isolamento e papel do vídeo no backend** → Fechar nesta feature: gravar `clinic_id` em `media_videos` quando criado pela clínica, restringir `/api/clinic/media/videos/*` ao papel admin da clínica e apenas às 5 rotas do fluxo de envio (`presigned-upload-request`, `presigned-thumbnail-request`, `presigned-thumbnail-replace-request`, `confirm-upload`, `reference-images`), responder 404 quando o vídeo for de outra clínica ou do catálogo (`clinic_id` nulo), remover `GET/PATCH/DELETE` de vídeos da clínica e validar por contrato público em `POST /api/clinic/exercises` que `video_id` pertence à clínica autenticada (422 caso contrário).

- **Formato do vídeo (revisto em 2026-11-02, pedido do usuário)** → Só **quadrado (1:1, como post do Instagram)**. Vídeo deitado ou em pé é bloqueado até ajustar; o "Ajustar vídeo" corta as laterais do deitado e em cima/embaixo do em pé (`squareCrop` em `video-rules.ts`), saída até 1080×1080. Substitui a regra anterior de "em pé (9:16)".
- **Rotas de vídeo do paciente** → `GET /api/patient/media/videos` e `/{id}` removidas (expunham os vídeos de todas as clínicas a qualquer paciente; o app do paciente recebe o vídeo pelo programa).

### Fora do escopo

- Conferência no servidor (via `ffprobe` ou job) do formato quadrado, resolução mínima, duração real e o tamanho efetivo do objeto no R2 após o upload.
