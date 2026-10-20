<?php

namespace Modules\ClinicScheduling\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Contracts\AppointmentRepositoryInterface;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
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

    public function patientHasAppointmentInClinic(int $clinicId, int $patientId): bool
    {
        return $this->model->forClinic($clinicId)
            ->where('patient_id', $patientId)
            ->exists();
    }

    public function clinicUserAttendsPatient(int $clinicId, int $clinicUserId, int $patientId): bool
    {
        return $this->model->forClinic($clinicId)
            ->forClinicUser($clinicUserId)
            ->where('patient_id', $patientId)
            ->where('status', '!=', AppointmentStatus::Cancelled->value)
            ->exists();
    }

    public function paginateForPatient(int $clinicId, int $patientId, int $perPage): LengthAwarePaginator
    {
        return $this->model->with('clinicUser:id,name')
            ->forClinic($clinicId)
            ->where('patient_id', $patientId)
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->paginate($perPage, ['id', 'clinic_user_id', 'title', 'starts_at', 'ends_at', 'status']);
    }
}
