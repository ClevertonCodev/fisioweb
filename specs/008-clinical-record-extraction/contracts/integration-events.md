# Integration Events Contract

6 eventos `final readonly` em `Modules\ClinicalRecord\Events`. Snapshot mínimo (IDs + primitivos + `CarbonImmutable`), **nunca** Model Eloquent. `version = 1`.

Dispatch (nos Services de escrita):

```php
DB::afterCommit(fn () => Event::dispatch($event));
```

## AssessmentCreated (use case: create)

```php
final readonly class AssessmentCreated
{
    public function __construct(
        public int $version,
        public int $assessmentId,
        public int $clinicId,
        public int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public ?int $templateId,
        public string $status,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

## AssessmentUpdated (use case: update PUT, rascunho)

Mesmos campos de `AssessmentCreated`.

## AssessmentCompleted (use case: sign)

Mesmos campos. `status = 'signed'`. **Não** dispara `AssessmentUpdated` no mesmo fluxo.

## EvolutionRecorded (use case: create, update PUT, sign)

```php
final readonly class EvolutionRecorded
{
    public function __construct(
        public int $version,
        public int $evolutionId,
        public int $clinicId,
        public int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public ?int $templateId,
        public string $recordedAt,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

`recordedAt` = ISO8601 de `created_at` ou `updated_at`/`signed_at` conforme mutação; `professionalId` = `clinic_user_id`; `actorId` = guard clinic id.

## PatientFileAttached (use case: store)

```php
final readonly class PatientFileAttached
{
    public function __construct(
        public int $version,
        public int $fileId,
        public int $clinicId,
        public int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public string $originalName,
        public ?string $name,
        public string $mimeType,
        public int $size,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

## PatientFileDeleted (use case: destroy soft-delete)

Mesmos identificadores de `PatientFileAttached` (sem mime/size obrigatório se preferir mínimo — implementação usa snapshot mínimo com fileId, clinicId, patientId, actorId, occurredAt).

## Casos sem evento

| Caso de uso | Evento |
|-------------|--------|
| `POST evolutions/{id}/generate-text` | nenhum |
| `DELETE assessments/{id}` | nenhum |
| `DELETE evolutions/{id}` | nenhum |

## Consumidores

Nenhum listener obrigatório nesta extração (YAGNI). Eventos publicados para readiness EDA e consumidores futuros (ActivityLog, auditoria, storage cleanup).

## Fitness / behavior tests

- Unit: `ClinicalRecord/tests/Unit/Events/*` — cada mutação despacha evento afterCommit, snapshot sem Model.
- Architecture: event classes não referenciam `Modules\ClinicalRecord\Models\*`.
