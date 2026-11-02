# Limite de 20 MB e isolamento por clínica dos vídeos de exercício

**Tipo:** Bug
**Plano:** `../plans/clinic-enviar-exercicio-ds.md`
**Histórias:** 2, 7
**Issue:** ainda não criada

## Descrição

O backend hoje aceita até 500 MB em `config/cloudflare.php` (enquanto clínica e admin travam em 20 MB no navegador) e compartilha o mesmo `VideoController` entre `/api/admin/media/videos/*` e `/api/clinic/media/videos/*`, sem gravar `clinic_id` no vídeo nem conferir posse ou papel. Com isso, qualquer usuário autenticado de outra clínica pode alterar ou apagar vídeos alheios ou do catálogo, ou vincular `video_id` de outra clínica ao enviar um exercício.

## O que construir

Ajustar o limite padrão de vídeo em `config/cloudflare.php` e `.env.example` para 20 MB (`20971520` bytes). Criar migration no módulo `Media` adicionando `clinic_id` nullable em `media_videos`. Criar controller próprio da clínica no módulo `Media` (herdando `ClinicAuthenticatedController`), restrito ao papel administrador da clínica (`403` para outros papéis), mantendo em `modules/Media/routes/clinic.php` apenas as 5 rotas do fluxo de envio (`presigned-upload-request`, `presigned-thumbnail-request`, `presigned-thumbnail-replace-request`, `confirm-upload`, `reference-images`). No `presigned-upload-request` da clínica, gravar o `clinic_id` do usuário autenticado; nas 4 rotas com `{video}`, responder `404` se o vídeo não pertencer à clínica do usuário (incluindo vídeos do catálogo com `clinic_id` nulo). Expor no contrato `VideoServiceInterface` a verificação de posse do vídeo por clínica e validar em `SubmitExerciseRequest` (`POST /api/clinic/exercises`) que `video_id` pertence à clínica autenticada (`422` caso contrário).

## Critérios de Aceite

- [x] `POST /api/clinic/media/videos/presigned-upload-request` e `POST /api/admin/media/videos/presigned-upload-request` recusam `size` acima de 20 MB (`20971520`) com 422 (PHPUnit).
- [x] `POST /api/clinic/media/videos/presigned-upload-request` grava `clinic_id` da clínica autenticada e responde 403 para fisioterapeuta e secretária (PHPUnit).
- [x] `DELETE`, `GET` e `PATCH` em `/api/clinic/media/videos/*` respondem 404 (rotas removidas da clínica), mantendo as rotas de `/api/admin/media/videos/*` funcionando (PHPUnit).
- [x] `presigned-thumbnail-request`, `presigned-thumbnail-replace-request`, `confirm-upload` e `reference-images` na clínica respondem 404 quando o vídeo pertence a outra clínica ou ao catálogo (`clinic_id` nulo) (PHPUnit).
- [x] `POST /api/clinic/exercises` responde 422 em `video_id` quando o vídeo pertence a outra clínica ou ao catálogo (`clinic_id` nulo) e 201 quando pertence à própria clínica (PHPUnit).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda manualmente.

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-enviar-exercicio-ds`
- **Exemplo no código:** `modules/Media/tests/Feature/VideoReferenceImagesTest.php`, `modules/Clinic/tests/Feature/ExerciseSubmissionTest.php`
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-clean-code`, `laravel-eloquent`, `php-testing`, `security`

## Como testar na mão

1. Como admin da clínica A, solicitar presigned upload de vídeo de 25 MB → 422.
2. Como admin da clínica A, criar vídeo de 5 MB → 200 com `video_id` gravado com `clinic_id` da clínica A.
3. Como admin da clínica B, chamar `confirm-upload` ou `POST /api/clinic/exercises` com o `video_id` da clínica A → 404 no Media e 422 no envio de exercício.
