# Phase 0 Research: Clinic Exercise Submission & Admin Approval

Todas as incógnitas do Technical Context foram resolvidas por inspeção do código existente. Nenhum `NEEDS CLARIFICATION` restante.

## R1 — Onde vive a entidade Exercise e como a clínica já a consome

- **Decisão**: Reutilizar `Modules\Admin\Models\Exercise` (tabela `admin_exercises`). Adicionar submissão/revisão como casos de uso no módulo Admin, expostos por contrato público.
- **Rationale**: `Modules\Clinic\Http\Controllers\ExerciseController` **já** injeta `Modules\Admin\Contracts\ExerciseServiceInterface` e lê o catálogo do Admin. Criar uma tabela/entidade paralela na clínica duplicaria o catálogo e quebraria os favoritos (`clinic_exercise_favorites.exercise_id` → `admin_exercises`) e a prescrição (`admin_exercise_video`, programas).
- **Alternativas rejeitadas**: (a) tabela `clinic_exercises` separada — duplicação e migração dos favoritos/programas; (b) query direta em `admin_exercises` dentro do módulo Clinic — viola a fronteira modular (Princípio 3).

## R2 — Como registrar origem e status de revisão sem migration nova

- **Decisão**: Alterar a migration existente `2026_02_28_000007_create_admin_exercises_table.php` adicionando:
  - `clinic_id` (nullable, FK → `clinics`, `nullOnDelete`) — clínica de origem; `null` = catálogo global oficial.
  - `review_status` (string, default `approved`) — `pending` | `approved` | `rejected`.
  - `submitted_by_clinic_user_id` (nullable, FK → clinic users, `nullOnDelete`) — quem enviou.
  - `reviewed_by` (nullable, FK → `users` admin) + `reviewed_at` (nullable timestamp) — rastreabilidade da revisão (FR-013).
  - Tornar `created_by` **nullable** (hoje é obrigatório e aponta para `users`/admin; submissões de clínica não têm admin criador).
  - Índices: `clinic_id`, `review_status`.
- **Rationale**: Usuário autorizou modificar migrations e rodar `migrate:fresh` + seeders (app só local). Um único ponto de verdade evita joins extras. Globais existentes recebem `review_status = approved`, `clinic_id = null`.
- **Alternativas rejeitadas**: tabela pivô de revisão separada — complexidade desnecessária para status 1:1 com o exercício.

## R3 — Filtro de visibilidade da biblioteca da clínica

- **Decisão**: No `ExerciseRepository::paginate`, quando chamado no contexto da clínica, aplicar:
  `WHERE review_status = 'approved' OR clinic_id = :currentClinicId`. O `currentClinicId` é passado pelo Service a partir de `Auth::guard('clinic')->user()->clinic_id`.
- **Rationale**: Backend como fonte de verdade (Princípio 1). Garante SC-002 (0% vazamento de pendentes/rejeitados entre clínicas) e SC-003 (aprovado aparece para todas).
- **Alternativas rejeitadas**: filtrar no frontend — inseguro; expõe pendentes de outras clínicas na resposta da API.

## R4 — Fluxo de upload do vídeo

- **Decisão**: Reutilizar o fluxo **presigned** do módulo Media já disponível na clínica (`clinic/media/videos/presigned-upload-request` → PUT no R2 → `confirm-upload`) e o hook FE `usePresignedUpload`. Após o vídeo confirmado (`media_videos.id`), o endpoint de submissão da clínica cria o `Exercise` e associa via `admin_exercise_video` (`syncVideo`).
- **Rationale**: Não reinventar upload; a clínica já tem rotas Media e a UI de referência (imagem 2 = `AdminVideoCreatePage`). Limites/formats (20MB vídeo, 5MB thumb) já validados pelo Media (FR-006).
- **Alternativas rejeitadas**: upload multipart direto no endpoint de exercício — ignora R2/presign e duplica validação.

## R5 — Autorização (quem envia / quem aprova)

- **Decisão**:
  - Submeter: apenas **admin da clínica** (`ClinicUser::isAdmin()`), imposto por FormRequest/Policy no backend + `RequireClinicAdmin` no FE (só UX). (FR-012a)
  - Aprovar/rejeitar: apenas guard `admin` (sistema), via `ExercisePolicy` registrada no ServiceProvider do módulo Admin. (FR-012)
- **Rationale**: Segue a skill `security` (Policies backend autoritativas + permissions no FE). `ClinicUser` já expõe `isAdmin()`.
- **Alternativas rejeitadas**: permitir qualquer usuário da clínica — decisão de clarificação Q2 = somente admin da clínica.

## R6 — Notificação de revisão no dashboard admin

- **Decisão**: Endpoint admin `GET admin/exercises/pending-count` (ou incluir no payload do `DashboardController`) retornando o total de exercícios `review_status = pending`. O `AdminDashboardPage` exibe um card/badge "N exercícios a revisar" com link para a lista de pendentes. (FR-007, SC-004)
- **Rationale**: Simples, sem infra de notificação persistente; atende "aviso/contador no dashboard" da spec. Reaproveita o `DashboardController` existente.
- **Alternativas rejeitadas**: sistema de notificações Laravel (`notifications` table) — over-engineering para um contador; pode evoluir depois.

## R7 — Badge "disponível apenas para a clínica que enviou"

- **Decisão**: O payload da biblioteca da clínica inclui `review_status` e um booleano derivado `is_own_submission` (`clinic_id === currentClinicId`). O `ExerciseCard` mostra badge quando `is_own_submission && review_status !== 'approved'`. (FR-010a, FR-011, SC-005)
- **Rationale**: Clarificação Q3. Mantém domínio puro no FE (mapper snake→camel: `reviewStatus`, `isOwnSubmission`).
- **Alternativas rejeitadas**: expor `clinic_id` cru ao FE e decidir lá — vaza id e mistura responsabilidade.

## R8 — "Categoria" da UI = qual campo do modelo

- **Decisão**: "Categoria" exibida nos cards (ex.: "Traumato-Ortopédica") corresponde a `physio_area_id` (FK `admin_physio_areas`). O form de envio da clínica seleciona `physio_area_id` (obrigatório), `difficulty_level` (obrigatório), `name` (obrigatório), `description` (opcional). `body_region_id` é obrigatório no schema atual → ver R9.
- **Rationale**: Confirmado pelos cards e pelo `ExerciseRepository`/filtros existentes.

## R9 — Campos obrigatórios legados no schema vs. form mínimo da clínica

- **Decisão**: Para não sobrecarregar o admin da clínica, o form captura o conjunto mínimo da clarificação (nome, categoria=physio_area, dificuldade, descrição, vídeo/thumb/duração). Campos hoje `NOT NULL` que a clínica não preenche (`body_region_id`) serão tornados **nullable** na migration existente (mesma migration de R2), pois não fazem parte do conjunto mínimo de submissão.
- **Rationale**: Consistência entre o form especificado e o schema, sem migration nova. `body_region_id` já é usado só como filtro opcional na leitura.
- **Alternativas rejeitadas**: exigir `body_region_id` no form da clínica — contraria a clarificação Q1 (conjunto de campos definido).
