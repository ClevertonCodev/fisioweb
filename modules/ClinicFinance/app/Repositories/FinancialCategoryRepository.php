<?php

namespace Modules\ClinicFinance\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicFinance\Contracts\FinancialCategoryRepositoryInterface;
use Modules\ClinicFinance\Enums\FinancialCategoryOrigin;
use Modules\ClinicFinance\Models\ClinicCategoryOverride;
use Modules\ClinicFinance\Models\FinancialCategory;

class FinancialCategoryRepository implements FinancialCategoryRepositoryInterface
{
    public function __construct(
        protected FinancialCategory $model,
        protected ClinicCategoryOverride $overrideModel,
    ) {}

    public function listAvailableForClinic(int $clinicId, ?string $type = null): Collection
    {
        $query = $this->model->availableForClinic($clinicId);

        if ($type !== null) {
            $query->where('type', $type);
        }

        return $query->get();
    }

    public function find(int $id): ?FinancialCategory
    {
        return $this->model->find($id);
    }

    public function findAvailableForClinic(int $clinicId, int $categoryId): ?FinancialCategory
    {
        return $this->model->availableForClinic($clinicId)->where('id', $categoryId)->first();
    }

    public function createCustom(int $clinicId, string $name, string $type): FinancialCategory
    {
        return $this->model->create([
            'clinic_id'     => $clinicId,
            'name'          => $name,
            'type'          => $type,
            'origin'        => FinancialCategoryOrigin::Custom,
            'active'        => true,
            'display_order' => 1000,
        ]);
    }

    public function toggleActive(int $clinicId, FinancialCategory $category): FinancialCategory
    {
        if ($category->origin === FinancialCategoryOrigin::System) {
            $override = $this->overrideModel->firstOrNew([
                'clinic_id'              => $clinicId,
                'financial_category_id'  => $category->id,
            ]);

            if ($override->exists && $override->active === false) {
                $override->delete();
            } else {
                $override->active = false;
                $override->save();
            }

            return $category->refresh();
        }

        $category->update(['active' => !$category->active]);

        return $category->refresh();
    }

    public function deleteCustom(FinancialCategory $category): bool
    {
        return (bool) $category->delete();
    }

    public function hasTransactions(FinancialCategory $category): bool
    {
        return $category->transactions()->exists();
    }
}
