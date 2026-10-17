<?php

namespace Modules\TreatmentProgram\Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanGroup;

/**
 * Massa de dados para a aba Histórico de Programas: ~40 programas por clínica,
 * com pacientes, profissionais, status e validades variados, criados ao longo
 * dos últimos seis meses. Só fora de produção.
 *
 * php artisan db:seed --class="Modules\TreatmentProgram\Database\Seeders\TreatmentPlanHistoryDemoSeeder"
 *
 * Rodar de novo apaga e recria só os programas desta seeder (marcados em `notes`).
 */
class TreatmentPlanHistoryDemoSeeder extends Seeder
{
    private const MARK = 'seed:historico-demo';

    private const TOTAL = 40;

    private const TITLES = [
        'Reabilitação Lombar — Fase 2',
        'Fortalecimento de Quadril',
        'Alongamento Global — Cadeia Posterior',
        'Estabilização Escapular',
        'Pós-Operatório LCA — Semana 4',
        'Mobilidade Torácica',
        'Fascite Plantar — Alívio e Fortalecimento',
        'Tendinopatia Patelar — Isometria',
        'Core e Postura para Home Office',
        'Epicondilite Lateral',
        'Reabilitação de Tornozelo — Entorse',
        'Condicionamento para Corrida',
        'Gestante — Dor Lombar',
        'Idoso Ativo — Força e Equilíbrio',
        'Ombro Congelado — Fase 1',
        'Síndrome do Túnel do Carpo',
        'Cervicalgia — Controle Motor',
        'Prótese de Joelho — Ganho de ADM',
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $clinics   = Clinic::whereIn('email', ['clevertonsantoscodev@gmail.com', 'performance@fisioweb.local'])->get();
        $exercises = Exercise::take(10)->get();
        if ($clinics->isEmpty() || $exercises->isEmpty()) {
            $this->command->warn('Rode DatabaseSeeder e ExerciseSeeder antes.');

            return;
        }

        // Mesma massa a cada execução.
        mt_srand(2026);

        foreach ($clinics as $clinic) {
            $this->seedForClinic($clinic, $exercises);
        }
    }

    private function seedForClinic(Clinic $clinic, Collection $exercises): void
    {
        TreatmentPlan::where('clinic_id', $clinic->id)->where('notes', self::MARK)->get()
            ->each(function (TreatmentPlan $plan) {
                $plan->exercises()->delete();
                TreatmentPlanGroup::where('treatment_plan_id', $plan->id)->delete();
                $plan->delete();
            });

        $professionals = ClinicUser::where('clinic_id', $clinic->id)
            ->whereIn('role', [ClinicUser::ROLE_ADMIN, ClinicUser::ROLE_PHYSIOTHERAPIST])
            ->get();
        $patients = Patient::where('clinic_id', $clinic->id)->take(30)->get();
        if ($professionals->isEmpty() || $patients->isEmpty()) {
            $this->command->warn("Clínica {$clinic->id}: sem profissional ou paciente, pulando.");

            return;
        }

        $today = Carbon::today();
        for ($i = 0; $i < self::TOTAL; $i++) {
            // Espalha a criação pelos últimos ~180 dias, mais densa no último mês.
            $createdDaysAgo = $i < 12 ? mt_rand(0, 30) : mt_rand(31, 180);
            $createdAt      = $today->copy()->subDays($createdDaysAgo)->setTime(mt_rand(8, 18), mt_rand(0, 59));
            $start          = $createdAt->copy()->startOfDay()->addDays(mt_rand(0, 3));
            $duration       = [14, 21, 30, 45, 60][mt_rand(0, 4)];
            $end            = $start->copy()->addDays($duration);

            $status        = $this->statusFor($i, $end, $today);
            $viewedAt      = null;
            $completed     = 0;
            $patient       = $patients->get($i % $patients->count());
            $hasDates      = true;

            if ($status === 'completed') {
                $viewedAt  = $start->copy()->addDays(1);
                $completed = mt_rand(1, 20);
            } elseif ($status === 'viewed') {
                $viewedAt  = $start->copy()->addDays(mt_rand(0, 2))->min($today);
                $completed = mt_rand(0, 3);
            } elseif ($status === 'draft') {
                // Metade dos rascunhos ainda sem paciente e sem datas.
                if ($i % 2 === 0) {
                    $patient  = null;
                    $hasDates = false;
                }
            }

            $plan = TreatmentPlan::create([
                'clinic_id'               => $clinic->id,
                'clinic_user_id'          => $professionals->get($i % $professionals->count())->id,
                'patient_id'              => $patient?->id,
                'title'                   => self::TITLES[$i % count(self::TITLES)],
                'message'                 => 'Faça os exercícios no horário combinado. Em caso de dor, pare e me avise.',
                'start_date'              => $hasDates ? $start : null,
                'end_date'                => $hasDates ? $end : null,
                'status'                  => match ($status) {
                    'completed' => TreatmentPlan::STATUS_COMPLETED,
                    'draft'     => TreatmentPlan::STATUS_DRAFT,
                    default     => TreatmentPlan::STATUS_ACTIVE,
                },
                'patient_viewed_at'       => $viewedAt,
                'patient_completed_count' => $completed,
                'notes'                   => self::MARK,
            ]);
            $plan->forceFill(['created_at' => $createdAt, 'updated_at' => $createdAt])->saveQuietly();

            $group = TreatmentPlanGroup::create([
                'treatment_plan_id' => $plan->id,
                'name'              => 'Principal',
                'sort_order'        => 0,
            ]);
            foreach ($exercises->take(mt_rand(3, $exercises->count()))->values() as $index => $exercise) {
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

        $this->command->info("Clínica {$clinic->id} ({$clinic->name}): " . self::TOTAL . ' programas de demonstração criados.');
    }

    /** completed | viewed | not_viewed | draft, numa proporção realista. */
    private function statusFor(int $i, Carbon $end, Carbon $today): string
    {
        if ($i % 9 === 4) {
            return 'draft';
        }
        // Já terminou: quase sempre concluído.
        if ($end->lt($today)) {
            return $i % 5 === 0 ? 'viewed' : 'completed';
        }

        return $i % 3 === 0 ? 'not_viewed' : 'viewed';
    }
}
