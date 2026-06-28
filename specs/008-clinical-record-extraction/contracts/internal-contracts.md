# Internal Contracts (within ClinicalRecord)

Contratos internos ao módulo — **não** são API pública cross-module. Vivem em `Modules\ClinicalRecord\Contracts\`.

## Service interfaces (Controllers → Services)

| Interface | Implementação | Responsabilidade |
|-----------|---------------|------------------|
| `AssessmentServiceInterface` | `AssessmentService` | CRUD assessment, sign, destroy; validação template via Admin contract; eventos Created/Updated/Completed |
| `EvolutionServiceInterface` | `EvolutionService` | CRUD evolution, sign, generateText (read-only), destroy; evento EvolutionRecorded |
| `EvolutionTemplateServiceInterface` | `EvolutionTemplateService` | CRUD templates, sections, items |
| `PatientFileServiceInterface` | `PatientFileService` | list, store (upload via FileServiceInterface), destroy; eventos Attached/Deleted |

Controllers injetam **somente** `*ServiceInterface`.

## Repository interfaces (Services → Repositories)

| Interface | Implementação | Responsabilidade |
|-----------|---------------|------------------|
| `AssessmentRepositoryInterface` | `AssessmentRepository` | Queries Eloquent assessment + answers/options; eager loads |
| `EvolutionRepositoryInterface` | `EvolutionRepository` | Queries evolution + checked items; template items para generateText |
| `EvolutionTemplateRepositoryInterface` | `EvolutionTemplateRepository` | CRUD template tree; count evolutions by template |
| `PatientFileRepositoryInterface` | `PatientFileRepository` | listByPatient, create, soft delete |

Services injetam **somente** `*RepositoryInterface` para persistência/queries.

## Cross-module dependencies (permitidas em Services)

| Contrato | Módulo | Uso |
|----------|--------|-----|
| `PatientServiceInterface` | Patient | Validar paciente pertence à clínica |
| `AssessmentTemplateReadServiceInterface` | Admin | Validar template + endpoints assessment-templates |
| `FileServiceInterface` | Cloudflare | Upload de PatientFile |
| `PdfGeneratorInterface` | Pdf | Download PDF evolução |

## Bindings

Registrados em `ClinicalRecordServiceProvider`:

```php
$this->app->bind(AssessmentServiceInterface::class, AssessmentService::class);
$this->app->bind(AssessmentRepositoryInterface::class, AssessmentRepository::class);
// ... demais pares Service/Repository
Gate::policy(Assessment::class, AssessmentPolicy::class);
// ... demais policies
```

## Layer rules

- **Controller**: auth, authorize, delega Service, envelope JSON.
- **Service**: orquestra caso de uso, transação, contratos cross-module, `DB::afterCommit` eventos.
- **Repository**: Eloquent/SQL apenas.
- **Policy**: ownership `clinic_id` + papel.
