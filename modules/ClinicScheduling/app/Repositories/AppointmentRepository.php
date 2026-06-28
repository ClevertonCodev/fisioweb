<?php

namespace Modules\ClinicScheduling\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Contracts\AppointmentRepositoryInterface;
use Modules\ClinicScheduling\Models\Appointment;

class AppointmentRepository implements AppointmentRepositoryInterface
{
    public function __construct(
        protected Appointment $model,
    ) {}

    public function find(int $id): ?Appointment
    {
        return $this->model->find($id);
    }

    public function findOrFail(int $id): Appointment
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Appointment
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Appointment
    {
        $appointment = $this->model->findOrFail($id);
        $appointment->update($data);

        return $appointment->refresh();
    }

    public function listForCalendar(int $clinicId, array $filters = []): Collection
    {
        $query = $this->model->with(['patient', 'clinicUser'])
            ->forClinic($clinicId);

        if (!empty($filters['clinic_user_id'])) {
            $query->where('clinic_user_id', $filters['clinic_user_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['from'])) {
            $query->where('ends_at', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $query->where('starts_at', '<=', $filters['to']);
        }

        return $query->orderBy('starts_at')->get();
    }
}
