# ADR: A troca de mídia de um exercício já aprovado vira proposta, guardada no vídeo, até o operador revisar

**Status:** aceito em 2026-11-11 (feature 002, tarefa 018). A revisão do operador
(aprovar ou rejeitar a proposta) é a tarefa 020, e a tela da clínica é a 019.

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
     `proposed_by_clinic_user_id` passam a ser os da última troca;
   - os pedidos de URL pré-assinada não mudam: eles só emitem o caminho.
4. **A proposta não sai do Media para outras clínicas.** O vídeo chega às
   clínicas pelas relações dos exercícios (biblioteca, programas, catálogo de
   programas), então o `Video::toArray()` tira as chaves da proposta do
   `metadata`. Quem precisa da proposta lê pelo `VideoService` (a resposta da
   própria troca para a clínica dona e, na tarefa 020, a revisão do operador).
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
   dos exercícios aprovados ligados ao vídeo de forma explícita.
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

### Regras que agentes devem preservar

- O Media não importa nada de `Modules\Admin\`. Novas perguntas do Media ao Admin
  seguem o mesmo desenho: interface no Media, implementação e ligação no Admin.
- Toda escrita de mídia feita pela clínica passa pelo `VideoService` com a
  pergunta `isLocked` (`confirmUploadByClinic`, `changeReferenceImagesByClinic`).
  Rota nova de mídia da clínica não chama `confirmPresignedUpload`,
  `syncReferenceImages` nem `updateVideo` direto.
- Quem expõe o vídeo para clínica sem passar pela serialização do model tira as
  chaves de `Video::MEDIA_PROPOSAL_KEYS`.
- Gravar a proposta não publica `VideoReferenceImagesChanged`.
- Nenhum caminho tira um exercício de `approved` (o `reject` recusa com 422).
  Quem criar um caminho assim precisa decidir antes o que acontece com a trava
  do vídeo.
