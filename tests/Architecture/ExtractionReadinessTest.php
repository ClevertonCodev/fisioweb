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

    /**
     * @return array<string, mixed>
     */
    private function readinessFixture(): array
    {
        return require dirname(__DIR__, 2) . '/tests/Architecture/fixtures/extraction-readiness.php';
    }
}
