<?php

namespace Modules\TreatmentProgram\Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanGroup;

class TreatmentPlanSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        // Programas e Exercícios fazem parte dos planos Performance e Premium; Start fica de fora
        $clinics = Clinic::whereIn('email', ['clevertonsantoscodev@gmail.com', 'performance@fisioweb.local'])->get();
        if ($clinics->isEmpty()) {
            $this->command->warn('Nenhuma clínica encontrada. Rode DatabaseSeeder antes.');

            return;
        }

        $exercises = Exercise::take(10)->get();
        if ($exercises->isEmpty()) {
            $this->command->warn('Nenhum exercício encontrado. Rode ExerciseSeeder antes.');

            return;
        }

        foreach ($clinics as $clinic) {
            $this->seedForClinic($clinic, $exercises);
        }
    }

    private function seedForClinic(Clinic $clinic, $exercises): void
    {
        $professional = ClinicUser::where('clinic_id', $clinic->id)->first()
            ?? ClinicUser::factory()->create([
                'clinic_id' => $clinic->id,
                'name'      => 'Ricardo Vinicius Silva De Souza',
                'email'     => 'ricardo.' . $clinic->id . '@fisioelite.com',
                'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
            ]);

        $patients = Patient::where('clinic_id', $clinic->id)->take(8)->get();
        if ($patients->isEmpty()) {
            $this->command->warn("Clínica {$clinic->id}: nenhum paciente encontrado, pulando.");

            return;
        }

        $today     = Carbon::today();
        $scenarios = [
            // 1. Ativo — nunca visualizado pelo paciente
            [
                'title'                   => 'Reabilitação Lombar — Fase 1',
                'status'                  => TreatmentPlan::STATUS_ACTIVE,
                'patient_viewed_at'       => null,
                'patient_completed_count' => 0,
                'start_date'              => $today->copy()->subDays(5),
                'end_date'                => $today->copy()->addDays(25),
                'patient_index'           => 0,
                'exercise_count'          => 5,
            ],
            // 2. Ativo — nunca visualizado (outro paciente)
            [
                'title'                   => 'Fortalecimento de Joelho — IVS',
                'status'                  => TreatmentPlan::STATUS_ACTIVE,
                'patient_viewed_at'       => null,
                'patient_completed_count' => 0,
                'start_date'              => $today->copy()->subDays(3),
                'end_date'                => $today->copy()->addDays(17),
                'patient_index'           => 1,
                'exercise_count'          => 6,
            ],
            // 3. Ativo — visualizado pelo paciente mas não concluído
            [
                'title'                   => 'Reabilitação Cervical Postural',
                'status'                  => TreatmentPlan::STATUS_ACTIVE,
                'patient_viewed_at'       => $today->copy()->subDays(2),
                'patient_completed_count' => 0,
                'start_date'              => $today->copy()->subDays(10),
                'end_date'                => $today->copy()->addDays(20),
                'patient_index'           => 2,
                'exercise_count'          => 4,
            ],
            // 4. Ativo — visualizado (outro paciente)
            [
                'title'                   => 'Mobilização de Ombro — Fase 2',
                'status'                  => TreatmentPlan::STATUS_ACTIVE,
                'patient_viewed_at'       => $today->copy()->subDays(1),
                'patient_completed_count' => 0,
                'start_date'              => $today->copy()->subDays(7),
                'end_date'                => $today->copy()->addDays(23),
                'patient_index'           => 3,
                'exercise_count'          => 7,
            ],
            // 5. Concluído — paciente completou 6x
            [
                'title'                   => 'Mão e Dedos — Osteoartrite',
                'status'                  => TreatmentPlan::STATUS_COMPLETED,
                'patient_viewed_at'       => $today->copy()->subDays(30),
                'patient_completed_count' => 6,
                'start_date'              => $today->copy()->subDays(40),
                'end_date'                => $today->copy()->subDays(10),
                'patient_index'           => 4,
                'exercise_count'          => 7,
            ],
            // 6. Concluído — paciente completou 3x
            [
                'title'                   => 'Prevenção de Quedas — Equilíbrio e Marcha',
                'status'                  => TreatmentPlan::STATUS_COMPLETED,
                'patient_viewed_at'       => $today->copy()->subDays(20),
                'patient_completed_count' => 3,
                'start_date'              => $today->copy()->subDays(35),
                'end_date'                => $today->copy()->subDays(5),
                'patient_index'           => 5,
                'exercise_count'          => 5,
            ],
            // 7. Concluído — paciente completou 12x
            [
                'title'                   => 'Retorno Esportivo — Joelho e Tornozelo',
                'status'                  => TreatmentPlan::STATUS_COMPLETED,
                'patient_viewed_at'       => $today->copy()->subDays(60),
                'patient_completed_count' => 12,
                'start_date'              => $today->copy()->subDays(70),
                'end_date'                => $today->copy()->subDays(20),
                'patient_index'           => 6,
                'exercise_count'          => 8,
            ],
            // 8. Rascunho — sem paciente vinculado
            [
                'title'                   => 'Programa Pós-Operatório Ombro (modelo)',
                'status'                  => TreatmentPlan::STATUS_DRAFT,
                'patient_viewed_at'       => null,
                'patient_completed_count' => 0,
                'start_date'              => null,
                'end_date'                => null,
                'patient_index'           => null,
                'exercise_count'          => 6,
            ],
        ];

        foreach ($scenarios as $scenario) {
            $patient = $scenario['patient_index'] !== null
                ? $patients->get($scenario['patient_index'])
                : null;

            $plan = TreatmentPlan::create([
                'clinic_id'               => $clinic->id,
                'clinic_user_id'          => $professional->id,
                'patient_id'              => $patient?->id,
                'title'                   => $scenario['title'],
                'message'                 => 'Realize os exercícios conforme orientado. Em caso de dor, interrompa e entre em contato.',
                'start_date'              => $scenario['start_date'],
                'end_date'                => $scenario['end_date'],
                'status'                  => $scenario['status'],
                'patient_viewed_at'       => $scenario['patient_viewed_at'],
                'patient_completed_count' => $scenario['patient_completed_count'],
            ]);

            $group = TreatmentPlanGroup::create([
                'treatment_plan_id' => $plan->id,
                'name'              => 'Principal',
                'sort_order'        => 0,
            ]);

            $count = min($scenario['exercise_count'], $exercises->count());
            foreach ($exercises->take($count) as $index => $exercise) {
                $plan->exercises()->create([
                    'treatment_plan_group_id' => $group->id,
                    'exercise_id'             => $exercise->id,
                    'sets_min'                => 3,
                    'sets_max'                => 3,
                    'repetitions_min'         => 10,
                    'repetitions_max'         => 15,
                    'period'                  => 'morning',
                    'sort_order'              => $index,
                ]);
            }
        }

        $this->command->info("Clínica {$clinic->id} ({$clinic->name}): " . count($scenarios) . ' programas criados.');
    }
}
