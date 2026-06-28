# Public Contracts (cross-module)

## Exposed by Admin (consumido por ClinicalRecord)

### AssessmentTemplateReadServiceInterface

**Path**: `Modules\Admin\Contracts\Public\AssessmentTemplateReadServiceInterface`

**Implementação**: `Modules\Admin\Services\AssessmentTemplateReadService`

**Binding**: `AdminServiceProvider`

**Consumidores**: `AssessmentService`, `SharedAssessmentTemplateController` (ambos em ClinicalRecord)

```php
namespace Modules\Admin\Contracts\Public;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AssessmentTemplateReadServiceInterface
{
    /**
     * Template ativo com estrutura para validação de payload (create/update assessment).
     * Retorna null se inexistente/inativo.
     *
     * @return array{
     *   id: int,
     *   sections: array<int, array{
     *     id: int,
     *     fields: array<int, array{
     *       id: int,
     *       type: string,
     *       options?: array<int, array{id: int}>
     *     }>
     *   }>
     * }|null
     */
    public function findActiveForValidation(int $templateId): ?array;

    /** Catálogo paginado — shape compatível com index atual de assessment-templates. */
    public function listActive(?string $search, int $perPage): LengthAwarePaginator;

    /** Detalhe para show — shape compatível com show atual (sections.fields.options). */
    public function findActiveForShow(int $id): ?array;
}
```

**Boundary**: ClinicalRecord importa apenas esta interface (pasta `Contracts\Public`), não `Modules\Admin\Models\*` em Services.

---

## Exposed by ClinicalRecord

**Nenhum contrato público de leitura/escrita exposto nesta extração** (research R13).

Integração futura via **integration events** (6 eventos) ou read model a criar quando houver consumidor (Dashboard clínico, relatórios, etc.).

---

## Consumed by ClinicalRecord (já existentes)

| Interface | Módulo | Path |
|-----------|--------|------|
| `PatientServiceInterface` | Patient | `Modules\Patient\Contracts\PatientServiceInterface` |
| `FileServiceInterface` | Cloudflare | `Modules\Cloudflare\Contracts\FileServiceInterface` |
| `PdfGeneratorInterface` | Pdf | `Modules\Pdf\Contracts\PdfGeneratorInterface` |

**Nota**: `PatientServiceInterface::find()` retorna `Patient` model — aceitável como retorno de contrato público; Service de ClinicalRecord usa apenas para checar `clinic_id`, não para regra de negócio complexa cross-module.

---

## Fitness / boundary

- `ModuleBoundaryTest` em `ClinicalRecord/app`: zero `use Modules\*\Models\*` / `Repositories\*` de outros módulos (exceto ADR-008 FQN inline em Models).
- Imports de `Contracts\Public\*` e `Contracts\*Interface` de outros módulos são permitidos.
