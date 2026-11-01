<?php

namespace Modules\ClinicFinance\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\ClinicFinance\Contracts\FinancialCategoryRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialCategoryServiceInterface;
use Modules\ClinicFinance\Enums\FinancialCategoryOrigin;
use Modules\ClinicFinance\Events\FinancialCategoryCreated;
use Modules\ClinicFinance\Models\FinancialCategory;

class FinancialCategoryService implements FinancialCategoryServiceInterface
{
    public function __construct(
        protected FinancialCategoryRepositoryInterface $repository,
    ) {}

    public function list(int $clinicId, ?string $type = null, bool $includeInactive = false): Collection
    {
        if ($includeInactive) {
            // Para a clínica, a do sistema que ela desligou vale como desligada.
            return $this->repository->listManageableForClinic($clinicId, $type)
                ->each(fn (FinancialCategory $category) => $this->withActiveForClinic(
                    $category,
                    $category->active && !$category->disabled_for_clinic,
                )->makeHidden('disabled_for_clinic'));
        }

        return $this->repository->listAvailableForClinic($clinicId, $type);
    }

    public function create(int $clinicId, array $data): FinancialCategory
    {
        $category = $this->repository->createCustom($clinicId, $data['name'], $data['type']);

        $event = new FinancialCategoryCreated(
            version: 1,
            categoryId: (int) $category->id,
            clinicId: (int) $clinicId,
            actorId: Auth::guard('clinic')->id(),
            name: $category->name,
            type: $category->type->value,
            occurredAt: now()->toImmutable(),
        );

        DB::afterCommit(fn () => Event::dispatch($event));

        return $category;
    }

    public function toggle(int $clinicId, FinancialCategory $category): FinancialCategory
    {
        abort_if(
            $category->origin->value === 'custom' && (int) $category->clinic_id !== $clinicId,
            404,
        );

        if ($category->origin !== FinancialCategoryOrigin::System) {
            return $this->repository->setActive($category, !$category->active);
        }

        // A do sistema é de todas as clínicas: liga e desliga só para esta, pelo registro de desligada.
        $disabling = !$this->repository->isDisabledForClinic($clinicId, (int) $category->id);
        $this->repository->setDisabledForClinic($clinicId, (int) $category->id, $disabling);

        return $this->withActiveForClinic($category->refresh(), !$disabling);
    }

    /** O `active` que vale para a clínica, sem a categoria parecer alterada (não é para gravar). */
    private function withActiveForClinic(FinancialCategory $category, bool $active): FinancialCategory
    {
        $category->active = $active;
        $category->syncOriginalAttribute('active');

        return $category;
    }

    public function delete(int $clinicId, FinancialCategory $category): void
    {
        abort_if((int) $category->clinic_id !== $clinicId, 404);

        if ($this->repository->hasTransactions($category)) {
            abort(response()->json([
                'message' => 'Categoria possui transações; desative-a em vez de excluir.',
            ], 409));
        }

        $this->repository->deleteCustom($category);
    }
}
