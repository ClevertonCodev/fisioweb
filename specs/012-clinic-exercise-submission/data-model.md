# Phase 1 Data Model: Clinic Exercise Submission & Admin Approval

## Entidade alterada: `Exercise` (`admin_exercises`) — módulo Admin

Colunas **adicionadas** (via alteração da migration existente `2026_02_28_000007_create_admin_exercises_table.php`):

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `clinic_id` | FK → `clinics.id` (`nullOnDelete`) | Sim | `null` | Clínica de origem. `null` = catálogo global oficial (admin). |
| `review_status` | string | Não | `approved` | `pending` \| `approved` \| `rejected`. |
| `submitted_by_clinic_user_id` | FK → clinic users (`nullOnDelete`) | Sim | `null` | Admin da clínica que enviou. |
| `reviewed_by` | FK → `users.id` (`nullOnDelete`) | Sim | `null` | Admin do sistema que revisou (FR-013). |
| `reviewed_at` | timestamp | Sim | `null` | Data/hora da decisão de revisão. |

Colunas **modificadas**:

| Coluna | Antes | Depois | Motivo |
|--------|-------|--------|--------|
| `created_by` | FK NOT NULL → `users` | **nullable** | Submissões da clínica não têm admin criador. |
| `body_region_id` | FK NOT NULL | **nullable** | Fora do conjunto mínimo de submissão da clínica (R9). |

Índices adicionados: `clinic_id`, `review_status`.

### Constantes (Model `Exercise`)

```
REVIEW_PENDING  = 'pending'
REVIEW_APPROVED = 'approved'
REVIEW_REJECTED = 'rejected'
REVIEW_STATUSES = [pending => 'Pendente', approved => 'Aprovado', rejected => 'Rejeitado']
```

### Relações novas

- `clinic(): BelongsTo` → `Modules\Clinic\Models\Clinic` (FQN inline, fronteira modular).
- `submittedByClinicUser(): BelongsTo` → `ClinicUser` (FQN inline).
- `reviewedBy(): BelongsTo` → `User` (admin).

### Scopes novos

- `scopeApproved($q)` → `where('review_status', 'approved')`.
- `scopePending($q)` → `where('review_status', 'pending')`.
- `scopeVisibleToClinic($q, int $clinicId)` → `where(fn($w) => $w->approved()->orWhere('clinic_id', $clinicId))`.

## Regras de validação (por requisito)

| Campo (submissão clínica) | Regra | Requisito |
|---------------------------|-------|-----------|
| `name` | required, string, max:255 | FR-001a |
| `physio_area_id` (categoria) | required, exists:admin_physio_areas,id | FR-001a |
| `difficulty_level` | required, in: easy/medium/hard | FR-001a |
| `description` | nullable, string | FR-001a |
| `video_id` | required, exists:media_videos,id (status completed) | FR-006 |
| `thumbnail`/`duration` | tratados no fluxo Media (opcionais) | FR-001 |

## Máquina de estados: `review_status`

```
                 submit (clínica)
   (novo) ─────────────────────────►  pending
                                        │
                        approve (admin) │  reject (admin)
                        ▼               ▼
                     approved        rejected
                        │               │
             revoke (admin, edge) ◄─────┘ (re-review opcional, fora do MVP)
```

- **submit**: cria com `review_status = pending`, `clinic_id = <origem>`, `submitted_by_clinic_user_id = <user>`. Visível só para a clínica de origem.
- **approve**: `review_status = approved`, grava `reviewed_by`/`reviewed_at`. Passa a ser visível globalmente (a query global usa `approved`). (FR-009)
- **reject**: `review_status = rejected`, grava `reviewed_by`/`reviewed_at`. Continua visível só para a clínica de origem; card mostra badge. (FR-010, FR-010a)
- **revoke** (edge, opcional): admin volta `approved → rejected`/`pending`; sai do catálogo global. Não bloqueante para o MVP.

## Visibilidade (invariantes)

- **Biblioteca da clínica X** = exercícios `review_status = approved` **OU** `clinic_id = X` (qualquer status). (FR-004)
- **Exercício `pending`/`rejected` da clínica X** nunca aparece para clínica Y. (SC-002)
- **Exercício `approved`** aparece para todas as clínicas. (SC-003)
- Globais oficiais: `clinic_id = null`, `review_status = approved`.

## Campo derivado no payload da API da clínica

- `is_own_submission` = (`clinic_id === currentClinicId`). Usado no FE junto de `review_status` para exibir a badge. `clinic_id` cru não é exposto ao FE.

## Domínio frontend (`domain/clinic/exercise.ts`) — camelCase

Adicionar: `reviewStatus: 'pending' | 'approved' | 'rejected'`, `isOwnSubmission: boolean`. Mapper snake→camel na `infrastructure/repositories/api-clinic-exercises.ts`.

## Seeder (`ExerciseSeeder`)

- Exercícios oficiais existentes: `review_status = approved`, `clinic_id = null`, `created_by = <admin>`.
- (Opcional) 1–2 exercícios `pending` de uma clínica seed para validar o fluxo de revisão no dashboard.
