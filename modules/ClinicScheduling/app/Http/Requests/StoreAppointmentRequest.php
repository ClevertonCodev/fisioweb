<?php

namespace Modules\ClinicScheduling\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Autorização efetiva via AppointmentPolicy no controller.
    }

    /**
     * Defesa em profundidade: o fisioterapeuta só marca para si mesmo —
     * ignora qualquer clinic_user_id enviado e força o próprio id (FR-010).
     */
    protected function prepareForValidation(): void
    {
        $user = Auth::guard('clinic')->user();

        if ($user?->isPhysiotherapist()) {
            $this->merge(['clinic_user_id' => $user->id]);
        }
    }

    public function rules(): array
    {
        return [
            'patient_id'     => ['required', 'exists:patients,id'],
            'clinic_user_id' => ['required', 'exists:clinic_users,id'],
            'title'          => ['nullable', 'string', 'max:255'],
            'description'    => ['nullable', 'string'],
            'location'       => ['nullable', 'string', 'max:255'],
            'starts_at'      => ['required', 'date'],
            'ends_at'        => ['required', 'date', 'after:starts_at'],
        ];
    }

    public function messages(): array
    {
        return [
            'ends_at.after' => 'O término deve ser posterior ao início.',
        ];
    }

    /**
     * Garante isolamento multi-tenant: paciente e fisioterapeuta pertencem à
     * clínica do usuário autenticado; o responsável é um fisioterapeuta
     * (FR-012/FR-021). Models de outros módulos referenciados por FQN inline
     * para preservar a fronteira modular.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $clinicId = Auth::guard('clinic')->user()?->clinic_id;

            if ($this->filled('patient_id')) {
                $patientOk = \Modules\Patient\Models\Patient::where('id', $this->input('patient_id'))
                    ->where('clinic_id', $clinicId)
                    ->exists();
                if (!$patientOk) {
                    $validator->errors()->add('patient_id', 'Paciente não pertence à clínica.');
                }
            }

            if ($this->filled('clinic_user_id')) {
                $userOk = \Modules\Clinic\Models\ClinicUser::where('id', $this->input('clinic_user_id'))
                    ->where('clinic_id', $clinicId)
                    ->where('role', \Modules\Clinic\Models\ClinicUser::ROLE_PHYSIOTHERAPIST)
                    ->exists();
                if (!$userOk) {
                    $validator->errors()->add('clinic_user_id', 'Fisioterapeuta inválido para a clínica.');
                }
            }
        });
    }
}
