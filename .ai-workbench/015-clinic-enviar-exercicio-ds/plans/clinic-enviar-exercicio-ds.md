# Enviar exercício da clínica no DS v2 com isolamento do vídeo

Data: 2026-11-02
Fonte: `decisoes.md`, conversa com o usuário e `docs/prototipos-v2.md`

## Problema

A tela `/clinica/exercicios/enviar` hoje mostra a versão v1 (shadcn) em produção e, só em desenvolvimento, alterna para o protótipo A por `?variant=`. No protótipo A, o envio é simulado (`useFakeSubmit`) e nada é gravado na API, além de ter deixado de fora o recorte de imagem que existia na v1. No backend, `config/cloudflare.php` e `.env.example` permitem vídeos de até 500 MB (enquanto o frontend trava em 20 MB), e as rotas `/api/clinic/media/videos/*` compartilham o mesmo `VideoController` do admin sem gravar `clinic_id` no vídeo nem checar posse ou papel de administrador da clínica — permitindo que outra clínica ou papel menor consulte, altere ou apague qualquer vídeo, ou envie um exercício apontando para `video_id` de outra clínica ou do catálogo.

## Solução

Substituir a v1 e a pasta `exercise-submit-prototype/` pela tela oficial v2 em `/clinica/exercicios/enviar` usando a variante A ("Seções + prévia ao lado": Vídeo, Informações, Imagens para capa e PDF do paciente) com `@/components/ds`, React Hook Form + Zod, envio real via `useSubmitExercise`, recorte de imagem no DS v2 (`DsModal` + `react-image-crop`) para a capa e as 2 fotos de referência do PDF, captura de quadro atual do vídeo como capa, e "Ajustar vídeo" (`VideoEditor`) visível onde o navegador suporta `MediaRecorder` + `canvas.captureStream`. No backend, alinhar `max_video_size` em 20 MB (`20971520` bytes), gravar `clinic_id` em `media_videos` quando enviado pela clínica, isolar `/api/clinic/media/videos/*` em controller próprio da clínica (apenas para admin da clínica e apenas nas 5 rotas de upload, respondendo 404 para vídeo de outra clínica ou do catálogo) e validar no envio do exercício (`POST /api/clinic/exercises`) por contrato público que o `video_id` pertence à clínica autenticada.

## Histórias de Usuário

1. Como administrador da clínica, quero enviar um novo exercício pela tela `/clinica/exercicios/enviar` no Design System v2, organizando vídeo, informações e imagens em três seções numeradas com prévia da biblioteca e checklist ao lado.
2. Como administrador da clínica, quero que o vídeo selecionado seja conferido no navegador (formato aceito, tamanho até 20 MB, orientação em pé 9:16 e aviso de qualidade abaixo de 480p), bloqueando o envio se estiver deitado ou acima de 20 MB.
3. Como administrador da clínica, quero poder ajustar o vídeo no próprio navegador (cortar para 9:16 e escolher início/fim) quando meu navegador suportar `MediaRecorder` + `canvas.captureStream`, ocultando o botão quando não houver suporte.
4. Como administrador da clínica, quero definir a capa do exercício tanto capturando o quadro atual do vídeo quanto enviando uma imagem (JPEG, PNG ou WebP até 5 MB) com recorte no modal do DS v2.
5. Como administrador da clínica, quero enviar até 2 fotos de referência para o PDF do paciente (posição inicial e posição final), recortando cada uma no modal do DS v2 antes de aplicar.
6. Como administrador da clínica, quero acompanhar o progresso real do envio em três etapas (`DsSteps`: Enviando vídeo, Confirmando upload, Salvando exercício) e, ao concluir, ver o cartão de confirmação com "Enviar outro" (limpa o formulário) e "Ir para a biblioteca" (`/clinica/exercicios`).
7. Como administrador da clínica, quero que meus vídeos e exercícios em revisão fiquem isolados na minha clínica, sem que outra clínica ou usuário sem permissão veja, altere, apague ou vincule meu vídeo.
8. Como equipe de engenharia, quero remover a tela v1, a pasta `exercise-submit-prototype/` e o seletor `?variant=`, mantendo apenas a implementação v2 testada.

## Decisões de Implementação

- **Módulos donos no backend:**
  - `Modules\Media` é dono de `media_videos` e das rotas `/api/clinic/media/videos/*` e `/api/admin/media/videos/*`.
  - `Modules\Clinic` é dono de `POST /api/clinic/exercises` (`ExerciseController::store` e `SubmitExerciseRequest`).
  - `Modules\Admin` é dono do catálogo `admin_exercises` e expõe `ExerciseSubmissionServiceInterface`.
- **Limite de tamanho do vídeo:** `config/cloudflare.php` e `.env.example` passam a usar `20971520` bytes (20 MB) em `max_video_size` / `CLOUDFLARE_MAX_VIDEO_SIZE`, alinhando backend, clínica e admin.
- **Migration em `modules/Media/database/migrations/`:** adiciona coluna `clinic_id` (`unsignedBigInteger`, nullable, indexada, sem FK cruzando módulo) em `media_videos`. Vídeos do catálogo master permanecem com `clinic_id = null`.
- **Isolamento e rotas de vídeo da clínica (`Modules\Media`):**
  - Novo `ClinicVideoController` em `Modules\Media\Http\Controllers\ClinicVideoController` estendendo `App\Http\Controllers\ClinicAuthenticatedController`.
  - Apenas administrador da clínica (`$this->clinicUser()->isAdmin()`, senão `403`) pode acessar as rotas de escrita de vídeo da clínica.
  - `modules/Media/routes/clinic.php` mantém apenas as 5 rotas usadas no fluxo de envio:
    - `POST /api/clinic/media/videos/presigned-upload-request` (grava `clinic_id` da clínica autenticada no vídeo pendente);
    - `POST /api/clinic/media/videos/{video}/presigned-thumbnail-request`;
    - `POST /api/clinic/media/videos/{video}/presigned-thumbnail-replace-request`;
    - `POST /api/clinic/media/videos/{video}/confirm-upload`;
    - `PUT /api/clinic/media/videos/{video}/reference-images`.
  - Nas 4 rotas que recebem `{video}`, o vídeo deve pertencer à clínica autenticada (`$video->clinic_id === $this->clinicId()`); se não existir, tiver `clinic_id = null` (catálogo) ou pertencer a outra clínica, responde `404`.
  - As rotas `GET /api/clinic/media/videos`, `GET /api/clinic/media/videos/{video}`, `PATCH /api/clinic/media/videos/{video}`, `PATCH /api/clinic/media/videos/{video}/metadata` e `DELETE /api/clinic/media/videos/{video}` saem da clínica. As rotas `/api/admin/media/videos/*` continuam intactas no `VideoController`.
- **Colaboração entre módulos (`Clinic` → `Media`):**
  - `VideoServiceInterface` (contrato de `Modules\Media\Contracts\VideoServiceInterface`) ganha `isOwnedByClinic(int $videoId, int $clinicId): bool` (ou consulta equivalente) e `requestPresignedUpload` aceita `?int $clinicId = null`.
  - `Modules\Clinic\Http\Requests\SubmitExerciseRequest` valida, após as regras básicas de formato, que `video_id` pertence à clínica autenticada via `VideoServiceInterface::isOwnedByClinic`, retornando `422` em `video_id` quando o vídeo for de outra clínica ou do catálogo (`clinic_id` nulo).
- **Camadas no frontend (`resources/js/`):**
  - `resources/js/pages/clinic/exercise-submit/`: componentes da tela v2 (`ExerciseSubmitView`, `VideoDropzone`, `VideoEditor`, `ExerciseImageSlot`, `ExerciseImageCropModal`, `video-rules`, `use-object-url`), usando exclusivamente `@/components/ds` (`DsCard`, `DsButton`, `DsInput`, `DsSelect`, `DsTextarea`, `DsRadioGroup`, `DsRadio`, `DsAlert`, `DsBadge`, `DsSteps`, `DsModal`, `DsSwitch`, `DsTooltip`, `dsCn`).
  - `resources/js/pages/clinic/ClinicSubmitExercisePage.tsx`: renderiza a tela v2 em todos os ambientes, sem `?variant=`, sem `PrototypeSwitcher` e sem código v1.
  - Reaproveita `useSubmitExercise` e `useClinicExerciseOptions` de `@/application/clinic`.
  - Remove a pasta `resources/js/pages/clinic/exercise-submit-prototype/`.

## Fatias Verticais

1. **Limite de 20 MB e isolamento por clínica dos vídeos de exercício (`001-limite-20mb-e-isolamento-video-clinica`):** ajuste de `max_video_size` para 20 MB, migration `clinic_id` em `media_videos`, `ClinicVideoController` no módulo `Media` restrito a admin da clínica e às 5 rotas de upload com checagem de posse por `clinic_id` (404 para outra clínica ou catálogo), e validação em `SubmitExerciseRequest` garantindo que `video_id` pertence à clínica autenticada (422), com testes PHPUnit.
2. **Tela v2 de enviar exercício, recorte de imagem DS v2 e corte da v1 (`002-tela-enviar-exercicio-ds-e-corte-v1`):** tela oficial em `/clinica/exercicios/enviar` no DS v2 (variante A) conectada ao `useSubmitExercise`, modal de recorte de imagem em `DsModal` para capa e fotos do PDF, "Ajustar vídeo" condicional ao suporte do navegador, cartão de sucesso ("Enviar outro" e "Ir para a biblioteca"), remoção da v1 e de `exercise-submit-prototype/`, atualização de `docs/prototipos-v2.md` e testes Vitest.

## Testes

- **Backend (`./vendor/bin/phpunit modules/Media/tests modules/Clinic/tests tests/Architecture`):**
  - `PresignedVideoUploadRequest` recusa vídeo acima de 20 MB (422) e aceita até 20 MB.
  - `POST /api/clinic/media/videos/presigned-upload-request` grava `clinic_id` da clínica autenticada e nega fisioterapeuta/secretária com 403.
  - `DELETE /api/clinic/media/videos/{id}`, `GET` e `PATCH` na clínica retornam 404 (rotas removidas).
  - Thumbnail, thumbnail-replace, confirm-upload e reference-images em vídeo de outra clínica ou do catálogo (`clinic_id = null`) retornam 404 para clínica B e 403 para não-admin.
  - `POST /api/clinic/exercises` com `video_id` de outra clínica ou do catálogo (`clinic_id = null`) retorna 422 em `video_id`.
  - Fluxo completo da clínica A (presigned → confirm → reference-images → submit exercise) funciona e `admin` continua gerenciando qualquer vídeo.
- **Frontend (`npx vitest run`):**
  - Regras de vídeo (`checkVideo`, `hasBlocking`): formato inválido, tamanho > 20 MB (fail), vídeo deitado (fail), vídeo em pé 9:16 (ok), 3:4 (warn), resolução < 480p (warn).
  - Página `/clinica/exercicios/enviar`: renderiza seções, prévia e checklist; valida campos obrigatórios (nome, categoria e vídeo); bloqueia envio quando o vídeo está bloqueado; envia dados reais via `useSubmitExercise` (incluindo capa e até 2 fotos do PDF); mostra cartão de conclusão com "Enviar outro" e "Ir para a biblioteca" (`/clinica/exercicios`).
  - Teste de corte garantindo que `exercise-submit-prototype` foi removido e que `ClinicSubmitExercisePage` não importa `PrototypeSwitcher` nem componentes shadcn (`@/components/ui/`).

## Fora do Escopo

- Conferência no servidor (via `ffprobe` ou job) de orientação em pé, resolução mínima, duração real e tamanho efetivo do objeto no R2 após o upload (registrado no `DEFERRED.md` da feature).
