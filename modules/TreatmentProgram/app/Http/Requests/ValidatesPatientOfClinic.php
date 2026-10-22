<?php

namespace Modules\TreatmentProgram\Http\Requests;

use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;
use Modules\Patient\Contracts\PatientServiceInterface;

/**
 * Isolamento: o `patient_id` enviado precisa ser de paciente da clínica do
 * usuário logado. Sem isso, um plano grava paciente de outra clínica e a
 * resposta devolve o cadastro dele.
 */
trait ValidatesPatientOfClinic
{
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (!$this->filled('patient_id') || $validator->errors()->has('patient_id')) {
                return;
            }
            // Reenviar o paciente que o plano já tem não é troca: vale mesmo
            // se ele foi removido depois, para o plano continuar editável.
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

    /** Paciente que o registro já tem; só o editar sobrescreve. */
    protected function currentPatientId(): ?int
    {
        return null;
    }
}
