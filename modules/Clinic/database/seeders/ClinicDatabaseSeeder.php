<?php

namespace Modules\Clinic\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\ClinicFinance\Database\Seeders\FinancialDemoSeeder;

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
