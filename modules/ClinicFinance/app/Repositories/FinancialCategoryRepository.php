<?php

namespace Modules\ClinicFinance\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicFinance\Contracts\FinancialCategoryRepositoryInterface;
use Modules\ClinicFinance\Enums\FinancialCategoryOrigin;
use Modules\ClinicFinance\Models\ClinicCategoryOverride;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialSeries;

class FinancialCategoryRepository implements FinancialCategoryRepositoryInterface
{
    public function __construct(
        protected FinancialCategory $model,
        protected ClinicCategoryOverride $overrideModel,
        protected FinancialSeries $seriesModel,
    ) {}

    public function listAvailableForClinic(int $clinicId, ?string $type = null): Collection
    {
        $query = $this->model->availableForClinic($clinicId);

        if (!is_null($type)) {
            $query->where('type', $type);
        }

        return $query->get();
    }

    public function listManageableForClinic(int $clinicId, ?string $type = null): Collection
    {
        $query = $this->model->manageableForClinic($clinicId);

        if (!is_null($type)) {
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

    public function isDisabledForClinic(int $clinicId, int $categoryId): bool
    {
        return $this->overrideModel->newQuery()
            ->where('clinic_id', $clinicId)
            ->where('financial_category_id', $categoryId)
            ->where('active', false)
            ->exists();
    }

    public function setDisabledForClinic(int $clinicId, int $categoryId, bool $disabled): void
    {
        $override = $this->overrideModel->firstOrNew([
            'clinic_id'             => $clinicId,
            'financial_category_id' => $categoryId,
        ]);

        if ($disabled) {
            $override->active = false;
            $override->save();
        } elseif ($override->exists) {
            $override->delete();
        }
    }

    public function setActive(FinancialCategory $category, bool $active): FinancialCategory
    {
        $category->update(['active' => $active]);

        return $category->refresh();
    }

    public function deleteCustom(FinancialCategory $category): bool
    {
        return (bool) $category->delete();
    }

    public function hasTransactions(FinancialCategory $category): bool
    {
        return $category->transactions()->withTrashed()->exists()
            || $this->seriesModel->newQuery()->where('financial_category_id', $category->id)->exists();
    }
}
