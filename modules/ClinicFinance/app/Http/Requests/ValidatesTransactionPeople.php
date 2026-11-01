<?php

namespace Modules\ClinicFinance\Http\Requests;

use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;
use Modules\ClinicFinance\Contracts\TransactionPeopleServiceInterface;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Models\FinancialTransaction;

/**
 * Paciente e atendimento do lançamento (tarefa 013): só na entrada; o paciente precisa ser da
 * clínica, e o atendimento, da clínica e desse paciente. Senão, 422 no campo.
 */
trait ValidatesTransactionPeople
{
    /** @return array<string, mixed> */
    protected function peopleRules(): array
    {
        return [
            'patient_id'     => ['nullable', 'integer'],
            'appointment_id' => ['nullable', 'integer'],
        ];
    }

    /**
     * Saída sem os campos limpa o paciente que a entrada tinha; trocar o paciente sem dizer o
     * atendimento limpa o atendimento (ele era do paciente anterior).
     */
    protected function preparePeople(): void
    {
        if ($this->input('type') === FinancialTransactionType::Saida->value) {
            $this->merge([
                'patient_id'     => $this->input('patient_id'),
                'appointment_id' => $this->input('appointment_id'),
            ]);
        } elseif ($this->has('patient_id') && !$this->has('appointment_id')) {
            $this->merge(['appointment_id' => null]);
        }
    }

    protected function validatePeople(Validator $validator): void
    {
        $errors = $validator->errors();
        if ($errors->has('patient_id') || $errors->has('appointment_id') || $errors->has('type')) {
            return;
        }

        $patientId     = $this->filled('patient_id') ? (int) $this->input('patient_id') : null;
        $appointmentId = $this->filled('appointment_id') ? (int) $this->input('appointment_id') : null;
        if (is_null($patientId) && is_null($appointmentId)) {
            return;
        }

        if ($this->input('type') === FinancialTransactionType::Saida->value) {
            $field = is_null($patientId) ? 'appointment_id' : 'patient_id';
            $errors->add($field, 'Paciente e atendimento só valem em lançamento de entrada.');

            return;
        }

        $clinicId = (int) Auth::guard('clinic')->user()?->clinic_id;
        // Na edição, o lançamento gravado: o paciente excluído depois continua valendo nele.
        $current = $this->route('transaction');
        $current = $current instanceof FinancialTransaction ? $current : null;
        foreach (app(TransactionPeopleServiceInterface::class)->linkErrors($clinicId, $patientId, $appointmentId, $current) as $field => $message) {
            $errors->add($field, $message);
        }
    }
}
