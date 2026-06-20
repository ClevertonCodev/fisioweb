<?php

namespace Modules\Clinic\Services;

use Modules\Clinic\Contracts\FinancialCategoryRepositoryInterface;
use Modules\Clinic\Models\FinancialCategory;

class FinancialCategoryService
{
    public function __construct(
        protected FinancialCategoryRepositoryInterface $repository,
    ) {}

    public function list(int $clinicId, ?string $type = null)
    {
        return $this->repository->listAvailableForClinic($clinicId, $type);
    }

    public function create(int $clinicId, array $data): FinancialCategory
    {
        return $this->repository->createCustom($clinicId, $data['name'], $data['type']);
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
