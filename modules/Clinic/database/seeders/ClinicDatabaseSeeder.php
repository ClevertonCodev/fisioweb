<?php

namespace Modules\Clinic\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\ClinicalRecord\Database\Seeders\EvolutionTemplateSeeder;
use Modules\ClinicFinance\Database\Seeders\FinancialDemoSeeder;
use Modules\TreatmentProgram\Database\Seeders\TreatmentPlanSeeder;

class ClinicDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            ClinicUserSeeder::class,
            TreatmentPlanSeeder::class,
            EvolutionTemplateSeeder::class,
            ClinicPatientDataSeeder::class,
            DashboardDemoSeeder::class,
            FinancialDemoSeeder::class,
        ]);
    }
}
