<?php

namespace Modules\Patient\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Models\Patient;

class PatientRepository implements PatientRepositoryInterface
{
    public function find(int $id): ?Patient
    {
        return Patient::with('clinicUser:id,name')->find($id);
    }

    public function findOrFail(int $id): Patient
    {
        return Patient::findOrFail($id);
    }

    /** Labels dos campos de avaliação que alimentam o resumo do diagnóstico */
    private const DIAGNOSIS_FIELD_LABELS = ['Diagnóstico clínico', 'Diagnóstico(s)'];

    public function paginateByClinic(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        // Resposta de "Diagnóstico clínico" da última avaliação assinada do paciente
        $assessmentDiagnosis = DB::table('clinic_assessment_answers as caa')
            ->join('clinic_assessments as ca', 'ca.id', '=', 'caa.assessment_id')
            ->join('admin_assessment_fields as f', 'f.id', '=', 'caa.admin_assessment_field_id')
            ->whereColumn('ca.patient_id', 'patients.id')
            ->where('ca.status', 'signed')
            ->whereNull('ca.deleted_at')
            ->whereIn('f.label', self::DIAGNOSIS_FIELD_LABELS)
            ->whereNotNull('caa.value')
            ->where('caa.value', '!=', '')
            ->orderByDesc('ca.signed_at')
            ->limit(1)
            ->select('caa.value');

        $query = Patient::where('clinic_id', $clinicId)
            ->with('clinicUser:id,name')
            ->select('patients.*')
            ->selectSub($assessmentDiagnosis, 'assessment_diagnosis');

        if (!empty($filters['search'])) {
            $search       = $filters['search'];
            $searchDigits = preg_replace('/\D+/', '', $search);
            $query->where(function ($q) use ($search, $searchDigits) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
                if (!empty($searchDigits)) {
                    $q->orWhere('cpf', 'like', "%{$searchDigits}%");
                }
            });
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->where('is_active', $filters['is_active']);
        }

        if (!empty($filters['statuses'])) {
            $query->whereIn('status', $filters['statuses']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['professional_ids'])) {
            $query->whereIn('clinic_user_id', $filters['professional_ids']);
        }

        $page = $filters['page'] ?? null;

        $paginator = $query
            ->orderBy('created_at', 'desc')
            ->orderBy('name', 'asc')
            ->paginate($perPage, ['*'], 'page', $page);

        // Avaliação assinada tem prioridade sobre o campo manual do cadastro
        $paginator->getCollection()->transform(function (Patient $patient) {
            if ($patient->assessment_diagnosis) {
                $patient->diagnosis = $patient->assessment_diagnosis;
            }

            return $patient->makeHidden('assessment_diagnosis');
        });

        return $paginator;
    }

    public function bulkInactivate(int $clinicId, array $ids): int
    {
        return Patient::where('clinic_id', $clinicId)
            ->whereIn('id', $ids)
            ->update(['is_active' => false]);
    }

    public function create(array $data): Patient
    {
        return Patient::create($data);
    }

    public function update(int $id, array $data): Patient
    {
        $patient = $this->findOrFail($id);
        $patient->update($data);

        return $patient->fresh();
    }
}
