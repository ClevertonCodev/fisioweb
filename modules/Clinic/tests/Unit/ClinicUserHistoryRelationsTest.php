<?php

namespace Modules\Clinic\Tests\Unit;

use Illuminate\Database\Eloquent\SoftDeletingScope;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Models\ClinicActivity;
use Modules\ClinicalRecord\Models\Assessment;
use Modules\ClinicalRecord\Models\PatientEvolution;
use Modules\ClinicalRecord\Models\PatientFile;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicFinance\Models\PeriodOpeningBalance;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Models\ClinicProgramDraft;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Relações de histórico para ClinicUser enxergam quem foi excluído (soft
 * delete, ADR 022): o nome de quem atendeu, criou ou assinou continua.
 */
class ClinicUserHistoryRelationsTest extends TestCase
{
    public static function historyRelations(): array
    {
        return [
            'agenda'                 => [Appointment::class, 'clinicUser'],
            'programa'               => [TreatmentPlan::class, 'clinicUser'],
            'rascunho de programa'   => [ClinicProgramDraft::class, 'clinicUser'],
            'paciente responsável'   => [Patient::class, 'clinicUser'],
            'evolução'               => [PatientEvolution::class, 'clinicUser'],
            'avaliação'              => [Assessment::class, 'clinicUser'],
            'arquivo do paciente'    => [PatientFile::class, 'clinicUser'],
            'questionário'           => [PatientQuestionnaire::class, 'clinicUser'],
            'lançamento criado por'  => [FinancialTransaction::class, 'createdBy'],
            'lançamento apagado por' => [FinancialTransaction::class, 'deletedBy'],
            'saldo inicial'          => [PeriodOpeningBalance::class, 'updatedBy'],
            'exercício enviado'      => [Exercise::class, 'submittedByClinicUser'],
            'atividade da clínica'   => [ClinicActivity::class, 'actor'],
        ];
    }

    #[DataProvider('historyRelations')]
    public function test_history_relation_includes_deleted_users(string $model, string $relation): void
    {
        $query = (new $model)->{$relation}()->getQuery();

        $this->assertContains(SoftDeletingScope::class, $query->removedScopes());
    }
}
