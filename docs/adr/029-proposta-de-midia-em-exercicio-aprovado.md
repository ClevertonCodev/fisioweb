# ADR: A troca de mídia de um exercício já aprovado vira proposta, guardada no vídeo, até o operador revisar

**Status:** aceito em 2026-11-11 (feature 002, tarefa 018). A tela da clínica é
a tarefa 019, e a revisão do operador (aprovar ou rejeitar a proposta), a 020
(itens 9 a 12).

## Contexto

A clínica envia um exercício com vídeo próprio (`media_videos.clinic_id` = a
clínica). Quando o operador aprova, o exercício aparece no catálogo de todas as
clínicas (`Exercise::scopeVisibleToClinic`), mas continua com o `clinic_id` da
clínica que enviou, e o vídeo continua dela.

As rotas de mídia da clínica (`modules/Media/routes/clinic.php`) só conferiam a
posse do vídeo. Depois da aprovação, a clínica A ainda trocava a thumbnail e as
imagens de referência, e a clínica B passava a ver as imagens novas sem nenhuma
revisão: na biblioteca (`videos[].metadata.reference_images`, `thumbnail_url`) e
no PDF dos programas (`admin_exercise_media`). É o achado Médio
`admin/exercise-approval/owner-clinic-rewrites-approved-media` da auditoria de
controle de acesso. Uma variante: um vídeo ainda pendente na aprovação recebia a
thumbnail depois, pelo `confirm-upload`.

Três restrições moldaram a solução:

- O exercício e a aprovação são do módulo **Admin**; o vídeo e a mídia são do
  módulo **Media**. Desde a tarefa 017, o código do Media não pode citar nada de
  `Modules\Admin\` (`tests/Architecture/ModuleBoundaryTest.php`,
  `test_media_production_code_does_not_reference_admin_module`), nem um contrato
  público do Admin.
- A decisão de produto (`decisoes.md` da feature 002) é que a clínica pode trocar
  a mídia, mas a troca passa por revisão, e as outras clínicas continuam vendo a
  mídia aprovada enquanto isso, inclusive nos programas e nos PDFs que já usam o
  exercício.
- Ainda não há cliente real, mas não queremos migration de schema para isso.

## Decisão

1. **O Admin decide o que é "vídeo travado"; o Media pergunta por uma porta
   dele.** Vídeo travado é o vídeo ligado (`admin_exercise_video`) a pelo menos
   um exercício que não está só na revisão da própria clínica dona: aprovado,
   global (`clinic_id` nulo) ou de outra clínica. A pergunta é a interface
   `Modules\Media\Contracts\VideoLockQueryInterface::isLocked(videoId,
   ownerClinicId)`, declarada no Media e implementada no Admin
   (`Modules\Admin\Services\ExerciseVideoLockQuery`, que lê pelo
   `ExerciseRepositoryInterface::videoHasExerciseBeyondOwnerReview`). A ligação
   fica no `AdminServiceProvider`. Assim a dependência aponta do Admin para o
   Media, como já acontece com o evento da 017, e o teste de fronteira continua
   valendo sem exceção. O Media não tem implementação padrão: sem o Admin, o
   container falha, em vez de tratar todo vídeo como livre.
2. **O Media guarda a proposta no `metadata` do próprio vídeo**, sem migration:
   `proposed_thumbnail_path`, `proposed_reference_images` (no mesmo formato de
   `reference_images`), `proposed_at` e `proposed_by_clinic_user_id`. O
   `proposed_at` é a marca de "proposta pendente".
3. **As rotas da clínica** (`ClinicVideoController`):
   - vídeo não travado: tudo como antes. O `confirm-upload` grava a thumbnail, e
     o `PUT reference-images` grava as imagens e publica o evento
     `VideoReferenceImagesChanged` da 017, que atualiza o PDF dos exercícios não
     aprovados da clínica dona;
   - vídeo travado: o `confirm-upload` com `thumbnail_path` confirma o vídeo
     (status, URL, duração), mas a thumbnail vai para `proposed_thumbnail_path`;
     o `PUT reference-images` grava `proposed_reference_images` e **não publica o
     evento**, porque nada mudou para quem usa o exercício;
   - as duas respondem o mesmo envelope `data` de antes, com
     `data.proposal_pending` (verdadeiro quando o vídeo ficou com proposta);
   - uma proposta nova substitui a anterior campo a campo: uma troca de imagens
     não apaga a thumbnail proposta antes, e vice-versa. O `proposed_at` e o
     `proposed_by_clinic_user_id` passam a ser os da última troca. Desde a
     tarefa 020, o objeto da proposta substituída sai do storage (item 11);
   - vídeo que voltou a ficar livre (o exercício aprovado foi apagado ou
     desligado do vídeo) com proposta antiga: a troca da clínica vale na hora e
     **apaga a proposta antiga**, com os objetos dela (tarefa 020). Sem isso, a
     resposta dizia `proposal_pending: true` e aprovar a proposta antiga desfazia
     a troca nova;
   - desde a tarefa 020, as três escritas da clínica (`confirmUploadByClinic`,
     `changeThumbnailByClinic`, `changeReferenceImagesByClinic`) leem o vídeo com
     `lockForUpdate` numa transação, e a pergunta `isLocked` e a gravação ficam
     dentro dela. Assim a escrita da clínica e a decisão do operador sobre a
     proposta (que trava a mesma linha) não se atropelam;
   - os pedidos de URL pré-assinada não mudam: eles só emitem o caminho.
4. **A proposta não sai do Media para outras clínicas.** O vídeo chega às
   clínicas pelas relações dos exercícios (biblioteca, programas, catálogo de
   programas), então o `Video::toArray()` deixa sair do `metadata` só as chaves
   públicas (`Video::PUBLIC_METADATA_KEYS`, hoje só `reference_images`). As
   outras guardam caminhos que ninguém revisou: a proposta (`proposed_*`) e os
   caminhos emitidos para upload (`issued_image_paths`,
   `pending_thumbnail_path`), que são os mesmos da proposta. Na tarefa 019, a
   revisão adversária achou o caminho da capa proposta saindo para a clínica B
   por `issued_image_paths`, e a regra passou de "tirar a proposta" para "deixar
   sair só o público". O admin, que precisa do `metadata` inteiro, recebe o
   vídeo por `Video::toAdminArray()` (detalhe, lista e PATCH de metadados).
   Quem precisa da proposta lê pelo `VideoService` (a
   resposta da própria troca para a clínica dona e, na tarefa 020, a revisão do
   operador).
5. **A listagem de exercícios da clínica** (`GET /api/clinic/exercises`) devolve
   `media_proposal_pending` só nos exercícios da própria clínica
   (`is_own_submission`). O Clinic pergunta ao Media pelo
   `VideoServiceInterface::videoIdsWithPendingMediaProposal`, numa consulta só
   por página. Nos exercícios das outras clínicas e nos globais, o campo não
   aparece.
6. **O exercício não volta para pendente.** A alternativa era tirar o exercício
   do catálogo até nova revisão, mas isso quebraria os programas e os PDFs das
   outras clínicas que já usam o exercício, por uma troca de imagem que ainda nem
   foi avaliada. Com a proposta, o exercício continua aprovado e visível, com a
   mídia aprovada, e só a mídia nova espera.
7. **O evento da 017 continua no lugar da chamada direta.** O Media não chama o
   serviço de sincronização do Admin: ele publica `VideoReferenceImagesChanged`
   quando a mídia muda de verdade (troca aplicada pela clínica dona ou pelo
   operador). Na tarefa 020, aprovar a proposta aplica a mídia e sincroniza o PDF
   dos exercícios ligados ao vídeo de forma explícita (item 10), sem o evento.
8. **O operador não rejeita exercício já aprovado.** A trava olha o status
   atual do exercício. Se o operador pudesse passar um aprovado para
   `rejected`, o vídeo destravaria, e a troca da clínica dona voltaria a valer
   na hora, chegando aos programas, ao app do paciente e ao PDF da clínica B,
   que continuam carregando o exercício (o `TreatmentPlanExercise::exercise`
   não filtra visibilidade). Por isso o `PUT /api/admin/exercises/{id}/reject`
   responde 422 ("Exercício já aprovado. Para tirar do catálogo, desative-o.")
   quando o exercício está aprovado (`ExerciseAlreadyApprovedException`). Para
   tirar o exercício da listagem padrão da biblioteca e dos programas novos, o
   operador desativa (`is_active`), e o vídeo continua travado. A desativação
   não some com o exercício de tudo: a listagem da clínica ainda aceita
   `?is_active=0` e os favoritos não filtram `is_active` (ver `DEFERRED.md` da
   feature 002). Decisão do usuário em 2026-11-11, na revisão adversária da 018.
   Desde a tarefa 020, a recusa é atômica: a rejeição grava com
   `review_status != approved` na mesma instrução
   (`ExerciseRepositoryInterface::updateUnlessApproved`), e um aprovar
   concorrente não é desfeito.
9. **A fila do operador é por vídeo; as rotas, por exercício** (tarefa 020). A
   proposta mora no vídeo, e um vídeo pode estar em vários exercícios.
   - `GET /api/admin/exercises/media-proposals` (`auth:admin`) devolve uma
     entrada por vídeo com proposta e ligado a pelo menos um exercício não
     apagado: `{video_id, proposal_version, proposed_at,
     proposed_by_clinic_user_id, exercise, linked_exercises, current:
     {thumbnail_url, reference_images}, proposed: {thumbnail_url,
     reference_images}}`. O `exercise` é o representante (o aprovado primeiro,
     depois o menor id), e `linked_exercises` traz todos. No `proposed`, nulo quer
     dizer "sem mudança" nesse campo; a lista vazia de imagens quer dizer "sem
     fotos".
   - `PUT /api/admin/exercises/{id}/media-proposal/approve` e `.../reject`
     (`auth:admin`) recebem `{video_id, proposal_version}`. O `{id}` é a porta de
     entrada: qualquer exercício ligado ao vídeo serve. Vídeo não ligado ao
     exercício ou sem proposta: 422 ("Este exercício não tem proposta de mídia
     esperando revisão."). Exercício que não existe: 404.
   - O `pending-count` soma os exercícios pendentes e as entradas da fila.
   - A fila é paginada (`page`, `per_page` de 1 a 100, padrão 20, com `meta`
     de `current_page`, `per_page`, `total` e `last_page`), em ordem de id do
     vídeo. O Media dá os ids dos vídeos com proposta, o Admin fica com os
     que têm exercício ligado e o Media monta só as propostas da página. O
     `pending-count` conta esses ids, sem montar a fila (revisão adversária
     da 020, ACHADO-002).
   - Proposta em vídeo sem nenhum exercício ligado não entra na fila nem no
     contador (ver `DEFERRED.md` da feature 002).
10. **Aprovar e rejeitar decidem sobre a mídia que o operador viu.** O
    `proposal_version` é um hash das chaves `proposed_*` e da mídia atual do
    vídeo (`thumbnail_path` e os caminhos de `reference_images`)
    (`MediaProposal::$version`). Muda a cada troca da clínica, mesmo no mesmo
    segundo, e também quando o operador troca a mídia do vídeo direto depois da
    proposta: aprovar a proposta antiga desfaria essa troca (code review de
    2026-11-11). A troca direta do operador (`syncReferenceImages`) também lê o
    vídeo com `lockForUpdate` dentro de uma transação, para não regravar uma
    proposta já decidida. O Media lê o vídeo com `lockForUpdate`, confere a versão e, se ela
    mudou, responde 409 ("A proposta mudou desde que a revisão foi aberta.
    Recarregue a lista e confira a mídia nova.") sem tocar em nada. O Admin usa
    só o contrato do Media (`VideoServiceInterface::pendingMediaProposals`,
    `approveMediaProposal`, `rejectMediaProposal`, o DTO `MediaProposal` e as
    exceções `MediaProposalNotPendingException` e
    `MediaProposalChangedException`), sem model do Media.
    - Aprovar copia `proposed_thumbnail_path` para a capa e
      `proposed_reference_images` para `reference_images`, só nos campos que a
      proposta troca, limpa as chaves `proposed_*` e não muda o status do
      exercício. Na mesma transação, o Admin chama
      `ExerciseReferenceImageSyncService::syncFromVideo` como troca do operador:
      as imagens do PDF de todos os exercícios ligados ao vídeo passam a ser as
      aprovadas. O Media não publica `VideoReferenceImagesChanged` ao aprovar,
      para a sincronização não rodar duas vezes. Aprovar não apaga a capa nem as
      fotos substituídas (como a troca da clínica em vídeo livre, ver
      `DEFERRED.md`).
    - Rejeitar limpa as chaves `proposed_*` e não muda o status do exercício.
11. **Quais objetos saem do storage.** Rejeitar, trocar a proposta e descartar a
    proposta antiga num vídeo livre apagam os caminhos da proposta que saiu,
    **menos** os que o vídeo ainda usa depois da gravação: a capa, as
    `reference_images` e a proposta que ficou. O caso comum é a clínica manter
    uma foto atual e trocar só a outra: o caminho da foto mantida está na
    proposta e na mídia em uso, e não pode sair. A remoção roda depois do commit
    (`DB::afterCommit`) e confere o uso com o vídeo relido; uma falha ao apagar é
    reportada e não desfaz a decisão.
12. **Tela do operador** (`AdminExerciseReviewPage`, v1): a seção "Mídia
    proposta" mostra cada entrada com a mídia atual e a proposta lado a lado e os
    botões "Aprovar mídia" e "Rejeitar mídia", que mandam o `video_id` e o
    `proposal_version` mostrados. Erro (409, 422) vira toast com a mensagem do
    servidor e recarrega a fila e o contador; o aprovar e o rejeitar de exercício
    pendente ganharam o mesmo tratamento.

## Consequências

- A clínica B não vê imagem nem thumbnail que o operador não revisou, nem na
  biblioteca, nem nos programas, nem no PDF.
- O operador continua trocando a mídia na hora pelas rotas do admin
  (`/api/admin/media/videos/...`), sem proposta: ele é quem revisa.
- O vídeo ainda pendente na aprovação é confirmado normalmente pela clínica, e só
  a thumbnail vira proposta. O arquivo do vídeo em si não passa por essa revisão
  (ver `DEFERRED.md` da feature 002).
- A sincronização da 017 (`ExerciseReferenceImageSyncService::syncFromVideo`)
  continua filtrando aprovado e global na troca feita pela clínica, como defesa:
  com a trava, a clínica não chega a publicar o evento para um vídeo nessas
  condições.
- Custo: o `metadata` do vídeo passa a ter duas finalidades (mídia em uso e
  proposta), e o `Video::toArray()` precisa ser lembrado ao expor o vídeo por
  outro caminho que não a serialização do model.
- Fica uma janela fora da proposta: o operador aprova um exercício **pendente**
  enquanto a clínica troca a mídia dele (vídeo ainda livre). A troca vale na
  hora, e o operador aprova uma mídia que não viu. O `approve` do exercício não
  recebe versão da mídia (ver `DEFERRED.md` da feature 002).

### Regras que agentes devem preservar

- O Media não importa nada de `Modules\Admin\`. Novas perguntas do Media ao Admin
  seguem o mesmo desenho: interface no Media, implementação e ligação no Admin.
- Toda escrita de mídia feita pela clínica passa pelo `VideoService` com a
  pergunta `isLocked` (`confirmUploadByClinic`, `changeReferenceImagesByClinic`).
  Rota nova de mídia da clínica não chama `confirmPresignedUpload`,
  `syncReferenceImages` nem `updateVideo` direto.
- Quem expõe o vídeo para uma clínica que não é a dona sem passar pela
  serialização do model manda do `metadata` só as chaves de
  `Video::PUBLIC_METADATA_KEYS`. Chave nova no `metadata` fica fora das outras
  clínicas até alguém pôr na lista. A resposta das rotas de mídia da própria
  dona (`formatVideo`, depois do `ensureOwnedVideo`) traz o `metadata` inteiro,
  com a proposta dela.
- Gravar a proposta não publica `VideoReferenceImagesChanged`.
- Nenhum caminho tira um exercício de `approved` (o `reject` recusa com 422).
  Quem criar um caminho assim precisa decidir antes o que acontece com a trava
  do vídeo.
- Toda escrita da clínica na mídia do vídeo lê a linha com `lockForUpdate`
  (`VideoRepository::findForUpdate`) dentro de uma transação, e pergunta
  `isLocked` dentro dela. A decisão do operador trava a mesma linha.
- Aprovar e rejeitar exigem o `proposal_version` que o operador viu, e o 409 não
  muda nada. Chave nova de proposta entra em `Video::MEDIA_PROPOSAL_KEYS`, para
  mudar a versão e sair na limpeza.
- Apagar objeto da proposta sempre passa pelo `deleteObjectsNoLongerUsed`: só
  sai o caminho que o vídeo não usa mais (capa, `reference_images` e proposta),
  conferido depois do commit.
- O Admin decide a proposta só pelo `VideoServiceInterface`; aprovar sincroniza
  o PDF de todos os exercícios ligados ao vídeo, e não publica o evento.
