<?php

namespace Modules\Clinic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Autorização efetiva via AppointmentPolicy no controller.
    }

    /**
     * Defesa em profundidade: o fisioterapeuta não reatribui a consulta para
     * outro responsável — força o próprio id quando enviado (FR-010).
     */
    protected function prepareForValidation(): void
    {
        $user = Auth::guard('clinic')->user();

        if ($user?->isPhysiotherapist() && $this->has('clinic_user_id')) {
            $this->merge(['clinic_user_id' => $user->id]);
        }
    }

    public function rules(): array
    {
        return [
            'patient_id'     => ['sometimes', 'required', 'exists:patients,id'],
            'clinic_user_id' => ['sometimes', 'required', 'exists:clinic_users,id'],
            'title'          => ['nullable', 'string', 'max:255'],
            'description'    => ['nullable', 'string'],
            'location'       => ['nullable', 'string', 'max:255'],
            'starts_at'      => ['sometimes', 'required', 'date'],
            'ends_at'        => ['sometimes', 'required', 'date', 'after:starts_at'],
        ];
    }

    public function messages(): array
    {
        return [
            'ends_at.after' => 'O término deve ser posterior ao início.',
        ];
    }

    /**
     * Mantém isolamento multi-tenant: paciente e fisioterapeuta pertencem à
     * clínica do usuário autenticado (FR-012/FR-021).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $clinicId = Auth::guard('clinic')->user()?->clinic_id;

            if ($this->filled('patient_id')) {
                $patientOk = Patient::where('id', $this->input('patient_id'))
                    ->where('clinic_id', $clinicId)
                    ->exists();
                if (!$patientOk) {
                    $validator->errors()->add('patient_id', 'Paciente não pertence à clínica.');
                }
            }

            if ($this->filled('clinic_user_id')) {
                $userOk = ClinicUser::where('id', $this->input('clinic_user_id'))
                    ->where('clinic_id', $clinicId)
                    ->where('role', ClinicUser::ROLE_PHYSIOTHERAPIST)
                    ->exists();
                if (!$userOk) {
                    $validator->errors()->add('clinic_user_id', 'Fisioterapeuta inválido para a clínica.');
                }
            }
        });
    }
}
