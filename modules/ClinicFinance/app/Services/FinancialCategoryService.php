<?php

namespace Modules\ClinicFinance\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\ClinicFinance\Contracts\FinancialCategoryRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialCategoryServiceInterface;
use Modules\ClinicFinance\Events\FinancialCategoryCreated;
use Modules\ClinicFinance\Models\FinancialCategory;

class FinancialCategoryService implements FinancialCategoryServiceInterface
{
    public function __construct(
        protected FinancialCategoryRepositoryInterface $repository,
    ) {}

    public function list(int $clinicId, ?string $type = null): Collection
    {
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

        return $this->repository->toggleActive($clinicId, $category);
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
