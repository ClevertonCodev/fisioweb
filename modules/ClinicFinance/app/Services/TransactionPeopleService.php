<?php

namespace Modules\ClinicFinance\Services;

use Modules\ClinicFinance\Contracts\TransactionPeopleServiceInterface;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\Patient\Contracts\Public\PatientDirectoryReadServiceInterface;

class TransactionPeopleService implements TransactionPeopleServiceInterface
{
    /** Teto de pacientes que a busca por nome leva para o filtro dos lançamentos. */
    private const SEARCH_PATIENT_LIMIT = 500;

    /** Quantos pacientes o seletor do modal mostra por busca. */
    private const PICKER_LIMIT = 20;

    public function __construct(
        protected PatientDirectoryReadServiceInterface $patients,
        protected PatientServiceInterface $patientService,
        protected AppointmentReadServiceInterface $appointments,
    ) {}

    public function attachTo(int $clinicId, iterable $transactions): void
    {
        $list = collect($transactions);
        if ($list->isEmpty()) {
            return;
        }

        $patientIds     = $list->pluck('patient_id')->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();
        $appointmentIds = $list->pluck('appointment_id')->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();

        $names = empty($patientIds) ? [] : $this->patients->namesByIds($clinicId, $patientIds);
        $slots = empty($appointmentIds) ? [] : $this->appointments->getSnapshotsByIds($clinicId, $appointmentIds);

        foreach ($list as $transaction) {
            /** @var FinancialTransaction $transaction */
            $name = $names[(int) $transaction->patient_id] ?? null;
            $slot = $slots[(int) $transaction->appointment_id] ?? null;

            $transaction->withPeople(
                is_null($name) ? null : ['id' => $name->id, 'name' => $name->name],
                is_null($slot) ? null : $this->appointmentRef($slot),
            );
        }
    }

    public function linkErrors(int $clinicId, ?int $patientId, ?int $appointmentId, ?FinancialTransaction $current = null): array
    {
        if (is_null($patientId)) {
            return is_null($appointmentId) ? [] : ['appointment_id' => 'Escolha o paciente antes do atendimento.'];
        }

        // Na edição, o paciente que já está no lançamento (desta clínica) vale mesmo excluído
        // depois: o modal reenvia o que estava gravado.
        $keptPatient = !is_null($current)
            && (int) $current->clinic_id === $clinicId
            && $current->patient_id === $patientId;

        if (!$keptPatient && is_null($this->patientService->findForClinic($clinicId, $patientId))) {
            return ['patient_id' => 'Paciente não encontrado.'];
        }

        if (is_null($appointmentId) || ($keptPatient && $current->appointment_id === $appointmentId)) {
            return [];
        }

        $slot = $this->appointments->getSnapshotById($appointmentId);
        if (is_null($slot) || $slot->clinicId !== $clinicId || $slot->patientId !== $patientId) {
            return ['appointment_id' => 'Atendimento não encontrado para este paciente.'];
        }

        return [];
    }

    public function patientIdsMatching(int $clinicId, string $term): array
    {
        return array_map(
            fn ($patient) => $patient->id,
            $this->patients->searchByName($clinicId, $term, self::SEARCH_PATIENT_LIMIT, withTrashed: true),
        );
    }

    public function searchPatients(int $clinicId, string $term): array
    {
        return array_map(
            fn ($patient) => ['id' => $patient->id, 'name' => $patient->name],
            $this->patients->searchByName($clinicId, $term, self::PICKER_LIMIT),
        );
    }

    public function appointmentsOf(int $clinicId, int $patientId): ?array
    {
        if (is_null($this->patientService->findForClinic($clinicId, $patientId))) {
            return null;
        }

        return array_map(
            fn (AppointmentSnapshotDTO $slot) => [...$this->appointmentRef($slot), 'title' => $slot->title],
            $this->appointments->listForPatientInClinic($clinicId, $patientId),
        );
    }

    /** @return array{id: int, starts_at: string} */
    private function appointmentRef(AppointmentSnapshotDTO $slot): array
    {
        return ['id' => $slot->id, 'starts_at' => $slot->startsAt->toIso8601String()];
    }
}
