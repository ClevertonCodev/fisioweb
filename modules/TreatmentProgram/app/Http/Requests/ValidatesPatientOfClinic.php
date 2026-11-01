<?php

namespace Modules\TreatmentProgram\Http\Requests;

use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;
use Modules\Patient\Contracts\PatientServiceInterface;

trait ValidatesPatientOfClinic
{
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (!$this->filled('patient_id') || $validator->errors()->has('patient_id')) {
                return;
            }
            if ((int) $this->input('patient_id') === $this->currentPatientId()) {
                return;
            }

            $clinicId = (int) Auth::guard('clinic')->user()?->clinic_id;
            $patient  = app(PatientServiceInterface::class)
                ->findForClinic($clinicId, (int) $this->input('patient_id'));

            if (is_null($patient)) {
                $validator->errors()->add('patient_id', 'Paciente não encontrado.');
            }
        });
    }

    protected function currentPatientId(): ?int
    {
        return null;
    }
}
