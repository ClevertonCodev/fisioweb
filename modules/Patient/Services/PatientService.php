<?php

namespace Modules\Patient\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\Patient\Models\Patient;

class PatientService implements PatientServiceInterface
{
    public function __construct(
        private PatientRepositoryInterface $repository,
    ) {}

    public function find(int $id): ?Patient
    {
        return $this->repository->find($id);
    }

    public function list(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginateByClinic($clinicId, $filters, $perPage);
    }

    public function findOrCreateAndLink(array $data, int $clinicId, int $registeredBy): Patient
    {
        return DB::transaction(function () use ($data, $clinicId, $registeredBy) {
            // Se CPF foi informado, verifica se já existe no sistema
            if (!empty($data['cpf'])) {
                $existing = Patient::where('cpf', $data['cpf'])->first();

                if ($existing) {
                    // Já existe: vincula à clínica se ainda não estiver vinculado
                    if (!$this->repository->isLinkedToClinic($existing->id, $clinicId)) {
                        $this->repository->linkToClinic($existing->id, $clinicId, $registeredBy);
                    }

                    return $existing->fresh('clinics');
                }
            }

            // Não existe: cria novo patient e vincula à clínica
            // Senha padrão = CPF (sem formatação). Se não tem CPF, usa os 8 primeiros chars do nome.
            $defaultPassword = !empty($data['cpf'])
                ? preg_replace('/\D/', '', $data['cpf'])
                : substr(preg_replace('/\s+/', '', $data['name']), 0, 8);

            $data['password'] = Hash::make($defaultPassword);

            $patient = $this->repository->create($data);
            $this->repository->linkToClinic($patient->id, $clinicId, $registeredBy);

            return $patient->fresh('clinics');
        });
    }

    public function update(int $id, array $data): Patient
    {
        return $this->repository->update($id, $data);
    }

    public function unlinkFromClinic(int $patientId, int $clinicId): bool
    {
        return $this->repository->unlinkFromClinic($patientId, $clinicId);
    }
}
