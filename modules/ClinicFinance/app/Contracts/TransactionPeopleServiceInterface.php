<?php

namespace Modules\ClinicFinance\Contracts;

use Modules\ClinicFinance\Models\FinancialTransaction;

/**
 * Paciente e atendimento do lançamento de entrada. Finanças guarda só os ids; nome, posse e
 * horário vêm dos contratos públicos de Patient e ClinicScheduling.
 */
interface TransactionPeopleServiceInterface
{
    /**
     * Preenche `patient` (`{id, name}`) e `appointment` (`{id, starts_at}`) dos lançamentos,
     * com uma consulta por módulo para a lista inteira.
     *
     * @param  iterable<FinancialTransaction>  $transactions
     */
    public function attachTo(int $clinicId, iterable $transactions): void;

    /**
     * Erros por campo (`patient_id`, `appointment_id`) se o paciente não é da clínica ou o
     * atendimento não é da clínica e do paciente. Vazio quando está tudo certo. Na edição,
     * `$current` é o lançamento como está gravado: o paciente e o atendimento que já estão
     * nele passam mesmo se foram excluídos depois (só se o lançamento é desta clínica).
     *
     * @return array<string, string>
     */
    public function linkErrors(int $clinicId, ?int $patientId, ?int $appointmentId, ?FinancialTransaction $current = null): array;

    /**
     * Ids dos pacientes da clínica (inclusive excluídos) cujo nome contém o termo, para a busca.
     *
     * @return list<int>
     */
    public function patientIdsMatching(int $clinicId, string $term): array;

    /**
     * Pacientes da clínica para o seletor do modal: `{id, name}`.
     *
     * @return list<array{id: int, name: string}>
     */
    public function searchPatients(int $clinicId, string $term): array;

    /**
     * Atendimentos do paciente na clínica para o seletor: `{id, starts_at, title}`. `null` se o
     * paciente não é da clínica.
     *
     * @return list<array{id: int, starts_at: string, title: ?string}>|null
     */
    public function appointmentsOf(int $clinicId, int $patientId): ?array;
}
