<?php

namespace Modules\Patient\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\ActivityLoggerInterface;
use Modules\Clinic\Enums\ActivityType;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\Patient\Models\Patient;

class PatientService implements PatientServiceInterface
{
    public function __construct(
        protected PatientRepositoryInterface $repository,
        protected ActivityLoggerInterface $activityLogger,
    ) {}

    public function find(int $id): ?Patient
    {
        return $this->repository->find($id);
    }

    public function findForClinic(int $clinicId, int $id): ?Patient
    {
        $patient = $this->repository->find($id);

        return !is_null($patient) && (int) $patient->clinic_id === $clinicId ? $patient : null;
    }

    public function list(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginateByClinic($clinicId, $filters, $perPage);
    }

    public function create(array $data, int $clinicId): Patient
    {
        $cpf = isset($data['cpf']) ? preg_replace('/\D/', '', $data['cpf']) : null;

        $patient = $this->repository->create(array_merge($data, [
            'clinic_id'      => $clinicId,
            'clinic_user_id' => Auth::guard('clinic')->id(),
            'cpf'            => $cpf,
            // CPF é a senha padrão; estrangeiros sem CPF usam o e-mail
            'password'       => $cpf ?: $data['email'],
        ]));

        $this->activityLogger->log(
            $clinicId,
            ActivityType::PatientCreated,
            "Novo paciente cadastrado — {$patient->name}",
            $patient,
        );

        return $patient->load('clinicUser:id,name');
    }

    public function update(int $id, array $data): Patient
    {
        $current = $this->repository->find($id);

        if (!is_null($current)) {
            $newDefaultPassword = $this->defaultPasswordToFollow($current, $data);

            if (!is_null($newDefaultPassword)) {
                $data['password'] = $newDefaultPassword;
            }
        }

        $patient = $this->repository->update($id, $data);

        if ($patient->clinic_id) {
            $this->activityLogger->log(
                $patient->clinic_id,
                ActivityType::PatientUpdated,
                "Paciente atualizado — {$patient->name}",
                $patient,
            );
        }

        return $patient;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function defaultPasswordToFollow(Patient $current, array $data): ?string
    {
        $oldDefault = $current->cpf ?: $current->email;
        $newCpf     = array_key_exists('cpf', $data) ? $data['cpf'] : $current->cpf;
        $newEmail   = array_key_exists('email', $data) ? $data['email'] : $current->email;
        $newDefault = $newCpf ?: $newEmail;

        if (empty($newDefault) || $newDefault === $oldDefault) {
            return null;
        }

        return $newDefault;
    }

    public function bulkInactivate(int $clinicId, array $ids): int
    {
        return $this->repository->bulkInactivate($clinicId, $ids);
    }

    public function reactivate(int $clinicId, int $id): ?Patient
    {
        return $this->repository->reactivate($clinicId, $id);
    }
}
