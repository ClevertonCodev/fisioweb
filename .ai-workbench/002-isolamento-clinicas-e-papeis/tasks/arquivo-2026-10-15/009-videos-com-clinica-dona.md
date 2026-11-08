# Vídeos com clínica dona e rotas da clínica reduzidas ao fluxo de envio

**Tipo:** Bug
**Plano:** `../plans/isolamento-clinicas-e-papeis.md`
**Issue:** ainda não criada

## Descrição

As rotas `/api/clinic/media/videos/*` não checam papel nem dono. Qualquer usuário de qualquer clínica, inclusive uma secretária, apaga ou altera qualquer vídeo por id, inclusive os do catálogo do admin master. O `destroy` apaga o arquivo no R2, e assim derruba os vídeos de exercício de todas as clínicas. O vídeo hoje nasce sem dono, então não há como saber de quem ele é.

O SPA da clínica usa só o fluxo de envio de exercício:
- presigned-upload;
- thumbnail;
- thumbnail-replace;
- confirm-upload;
- reference-images.

A decisão foi tirar da clínica as rotas sem uso, gravar a clínica dona no presigned-upload e devolver 404 nas rotas com `{video}` quando o vídeo não é da clínica.

## O que construir

- Migration no módulo Media: coluna `clinic_id` nula em `media_videos`, sem chave estrangeira, porque Media é compartilhado e não depende de Clinic. Vídeos existentes ficam nulos, como catálogo do admin master.
- As rotas da clínica passam para um controller próprio da clínica no Media, que herda o controller base da clínica. O `VideoController` atual atende só o admin.
- A clínica mantém, com entrada e saída iguais às de hoje (envelope `data`):
  - `POST videos/presigned-upload-request`, que grava o `clinic_id` do usuário no vídeo criado;
  - `POST videos/{video}/presigned-thumbnail-request`;
  - `POST videos/{video}/presigned-thumbnail-replace-request`;
  - `POST videos/{video}/confirm-upload`;
  - `PUT videos/{video}/reference-images`.

  As quatro rotas com `{video}` devolvem 404 se o vídeo não for da clínica do usuário, o que inclui vídeo de catálogo com `clinic_id` nulo.
- Saem da clínica: `GET videos`, `GET videos/{video}`, `PATCH videos/{video}`, `PATCH videos/{video}/metadata`, `DELETE videos/{video}`. As rotas do admin não mudam.
- Envio de exercício (módulo Clinic): o `video_id` precisa ser vídeo da própria clínica, senão 422. O Media expõe a consulta "de qual clínica é este vídeo" por contrato público.
- SPA: nada muda. O repository de vídeos da clínica não usa as rotas removidas.

## Critérios de Aceite

- [ ] O teste que reproduz a falha foi escrito antes da correção e estava vermelho: o DELETE de vídeo do catálogo pela clínica devolvia 200.
- [ ] `DELETE /api/clinic/media/videos/{id}` devolve 404 para qualquer papel (a rota não existe mais), e o vídeo e o arquivo no R2 continuam lá (`Storage::fake`).
- [ ] Thumbnail, thumbnail-replace, confirm-upload e reference-images em vídeo da B ou do catálogo devolvem 404, e nada é alterado.
- [ ] O presigned-upload grava o `clinic_id` da clínica do usuário.
- [ ] Enviar exercício com `video_id` da B ou do catálogo devolve 422.
- [ ] O fluxo completo de envio de exercício pela clínica continua verde: upload, thumbnail, confirm, reference-images, envio.
- [ ] As rotas de vídeo do admin continuam funcionando, inclusive sobre vídeo enviado por clínica.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-checagem-de-clinica-e-usuarios` (Checagem de clínica no controller base e usuários de outra clínica com 404)

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis`
- **Exemplo no código:**
  - `modules/Media/tests/Feature/VideoReferenceImagesTest.php`;
  - `modules/Clinic/tests/Feature/ExerciseSubmissionTest.php` (fluxo de envio de exercício);
  - `resources/js/infrastructure/repositories/api-clinic-videos.ts` (as rotas que o SPA usa).
- **Skills:** `security`, `architecture-paradigm-modular-monolith`, `laravel-eloquent`, `php-testing`
- Cuidado com o case das pastas do Media no git (`Database/Migrations` maiúsculo; ver memória do projeto).

## Como testar na mão

1. Como fisio da A, envie um exercício com vídeo pela tela "Enviar exercício" → upload, thumbnail e envio funcionam como antes.
2. Pela API, como secretária da A, `DELETE /api/clinic/media/videos/{id de vídeo do catálogo}` → 404. No painel admin, o vídeo continua tocando.
3. Como B, `POST /api/clinic/media/videos/{id do vídeo da A}/presigned-thumbnail-replace-request` → 404.
4. No painel admin, edite e apague um vídeo → continua funcionando.
