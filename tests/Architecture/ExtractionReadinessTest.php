<?php

namespace Tests\Architecture;

use PHPUnit\Framework\TestCase;

class ExtractionReadinessTest extends TestCase
{
    public function test_clinic_finance_has_all_required_extraction_readiness_criteria(): void
    {
        $readiness        = $this->readinessFixture();
        $requiredCriteria = $readiness['required_criteria'];
        $clinicFinance    = $readiness['modules']['ClinicFinance']['criteria'] ?? [];
        $missing          = array_values(array_diff($requiredCriteria, array_keys($clinicFinance)));

        $this->assertSame([], $missing, 'Missing readiness criteria: ' . implode(', ', $missing));
    }

    public function test_readiness_criteria_have_evidence_and_next_steps_when_not_ready(): void
    {
        $criteria   = $this->readinessFixture()['modules']['ClinicFinance']['criteria'];
        $violations = [];

        foreach ($criteria as $name => $definition) {
            if (!in_array($definition['status'], ['ready', 'partial', 'deferred'], true)) {
                $violations[] = "{$name} has invalid status {$definition['status']}";
            }

            if (($definition['evidence'] ?? '') === '') {
                $violations[] = "{$name} is missing evidence";
            }

            if ($definition['status'] !== 'ready' && ($definition['next_step'] ?? '') === '') {
                $violations[] = "{$name} is not ready and is missing next_step";
            }
        }

        $this->assertSame([], $violations, implode(PHP_EOL, $violations));
    }

    public function test_clinic_finance_migrations_live_in_the_owner_module(): void
    {
        $projectRoot       = dirname(__DIR__, 2);
        $clinicMigrations  = glob($projectRoot . '/modules/Clinic/database/migrations/*clinic_financial*.php') ?: [];
        $financeMigrations = glob($projectRoot . '/modules/ClinicFinance/database/migrations/*clinic_financial*.php') ?: [];

        $this->assertSame([], $clinicMigrations, 'Financial migrations must not live in modules/Clinic.');
        $this->assertCount(4, $financeMigrations, 'ClinicFinance must own the four clinic_financial_* migrations.');
    }

    public function test_clinic_scheduling_has_all_required_extraction_readiness_criteria(): void
    {
        $readiness         = $this->readinessFixture();
        $requiredCriteria  = $readiness['required_criteria'];
        $clinicScheduling  = $readiness['modules']['ClinicScheduling']['criteria'] ?? [];
        $missing           = array_values(array_diff($requiredCriteria, array_keys($clinicScheduling)));

        $this->assertSame([], $missing, 'Missing readiness criteria: ' . implode(', ', $missing));
    }

    public function test_clinic_scheduling_migrations_live_in_the_owner_module(): void
    {
        $projectRoot          = dirname(__DIR__, 2);
        $clinicMigrations     = glob($projectRoot . '/modules/Clinic/database/migrations/*clinic_appointments*.php') ?: [];
        $schedulingMigrations = glob($projectRoot . '/modules/ClinicScheduling/database/migrations/*clinic_appointments*.php') ?: [];

        $this->assertSame([], $clinicMigrations, 'Appointment migrations must not live in modules/Clinic.');
        $this->assertCount(1, $schedulingMigrations, 'ClinicScheduling must own the clinic_appointments migration.');
    }

    public function test_clinical_record_has_all_required_extraction_readiness_criteria(): void
    {
        $readiness        = $this->readinessFixture();
        $requiredCriteria = $readiness['required_criteria'];
        $clinicalRecord   = $readiness['modules']['ClinicalRecord']['criteria'] ?? [];
        $missing          = array_values(array_diff($requiredCriteria, array_keys($clinicalRecord)));

        $this->assertSame([], $missing, 'Missing readiness criteria: ' . implode(', ', $missing));
    }

    public function test_clinical_record_migrations_live_in_the_owner_module(): void
    {
        $projectRoot       = dirname(__DIR__, 2);
        $clinicGlobs       = [
            '*clinic_assessments*.php',
            '*clinic_assessment_answers*.php',
            '*clinic_assessment_answer_options*.php',
            '*clinic_evolution_templates*.php',
            '*clinic_evolution_template_sections*.php',
            '*clinic_evolution_template_items*.php',
            '*clinic_patient_evolutions*.php',
            '*clinic_patient_evolution_checked_items*.php',
            '*clinic_patient_files*.php',
        ];
        $clinicMigrations  = [];
        $ownerMigrations   = [];

        foreach ($clinicGlobs as $globPattern) {
            $clinicMigrations = array_merge(
                $clinicMigrations,
                glob($projectRoot . '/modules/Clinic/database/migrations/' . $globPattern) ?: [],
            );
            $ownerMigrations = array_merge(
                $ownerMigrations,
                glob($projectRoot . '/modules/ClinicalRecord/database/migrations/' . $globPattern) ?: [],
            );
        }

        $this->assertSame([], $clinicMigrations, 'Clinical record migrations must not live in modules/Clinic.');
        $this->assertCount(10, array_unique($ownerMigrations), 'ClinicalRecord must own the ten clinical record migrations.');
    }

    public function test_clinical_record_events_do_not_reference_models(): void
    {
        $eventFiles = glob(dirname(__DIR__, 2) . '/modules/ClinicalRecord/app/Events/*.php') ?: [];
        $violations = [];

        foreach ($eventFiles as $file) {
            $contents = (string) file_get_contents($file);
            if (preg_match('/Modules\\\\ClinicalRecord\\\\Models\\\\/', $contents) === 1) {
                $violations[] = basename($file);
            }
        }

        $this->assertSame([], $violations, 'Events must not reference Eloquent models: ' . implode(', ', $violations));
    }

    /**
     * @return array<string, mixed>
     */
    private function readinessFixture(): array
    {
        return require dirname(__DIR__, 2) . '/tests/Architecture/fixtures/extraction-readiness.php';
    }
}
