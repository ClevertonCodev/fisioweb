<?php

namespace Modules\Clinic\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Contracts\ClinicServiceInterface;
use Modules\Clinic\Models\Clinic;

class ClinicService implements ClinicServiceInterface
{
    public function __construct(
        protected ClinicRepositoryInterface $clinicRepository,
    ) {}

    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->clinicRepository->paginate($filters, $perPage);
    }

    public function findById(int $id): Clinic
    {
        return $this->clinicRepository->findOrFail($id);
    }

    public function create(array $data): Clinic
    {
        $clinic = $this->clinicRepository->create($data);

        Log::info('clinic criada com sucesso', ['clinic_id' => $clinic->id]);

        return $clinic;
    }

    public function update(int $id, array $data): Clinic
    {
        $clinic = $this->clinicRepository->update($id, $data);

        Log::info('clinic atualizada com sucesso', ['clinic_id' => $clinic->id]);

        return $clinic;
    }

    public function cancel(int $id): Clinic
    {
        $clinic = $this->clinicRepository->findOrFail($id);
        $this->clinicRepository->update($id, ['status' => Clinic::STATUS_CANCELLED]);

        Log::info('clinic cancelada com sucesso', ['clinic_id' => $id]);

        return $clinic->fresh();
    }

    public function reactivate(int $id): Clinic
    {
        $clinic = $this->clinicRepository->findOrFail($id);
        $this->clinicRepository->update($id, ['status' => Clinic::STATUS_ACTIVE]);

        Log::info('clinic reativada com sucesso', ['clinic_id' => $id]);

        return $clinic->fresh();
    }

    public function delete(int $id): bool
    {
        $result = $this->clinicRepository->delete($id);

        Log::info('clinic removida com sucesso', ['clinic_id' => $id]);

        return $result;
    }
}
