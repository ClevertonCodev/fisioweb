<?php

namespace Modules\Clinic\Database\Seeders;

use Illuminate\Database\Seeder;

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
        ]);
    }
}
