<?php

namespace Modules\Clinic\Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\Clinic\Enums\ActivityType;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;

/**
 * Popula os dados que alimentam o Dashboard da clínica e seus widgets
 * (consultas de hoje, taxa de ocupação, aniversariantes, captação por origem
 * e atividades recentes). Apenas desenvolvimento.
 */
class DashboardDemoSeeder extends Seeder
{
    private const REFERRAL_SOURCES = [
        'indicacao_medica',
        'indicacao_amigo',
        'redes_sociais',
        'google',
        'convenio',
        null, // "Não informado"
    ];

    private const APPOINTMENT_TITLES = [
        'Avaliação',
        'Retorno',
        'Sessão',
        'Sessão de Pilates',
        'Reavaliação',
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        // Agenda faz parte dos planos Performance e Premium; a clínica Start fica de fora
        $clinics = Clinic::whereIn('email', ['clevertonsantoscodev@gmail.com', 'performance@fisioweb.local'])->get();

        foreach ($clinics as $clinic) {
            $this->seedForClinic($clinic);
        }
    }

    private function seedForClinic(Clinic $clinic): void
    {
        $physios = ClinicUser::where('clinic_id', $clinic->id)
            ->whereIn('role', [ClinicUser::ROLE_PHYSIOTHERAPIST, ClinicUser::ROLE_ADMIN])
            ->get();

        $patients = Patient::where('clinic_id', $clinic->id)->get();

        if ($physios->isEmpty() || $patients->isEmpty()) {
            $this->command->warn("Clínica {$clinic->id}: sem fisioterapeutas ou pacientes — pulando dashboard demo.");

            return;
        }

        $tz  = $clinic->timezone ?: config('app.timezone');
        $now = Carbon::now($tz);

        $this->spreadPatientRegistrationAndBirthdays($patients, $now);
        $appointments = $this->seedAppointments($clinic, $physios, $patients, $now);
        $this->seedTodayActivities($clinic, $physios, $patients, $now);

        $this->command->info("Clínica {$clinic->id} ({$clinic->name}): {$appointments} consultas + aniversariantes + captação + atividades.");
    }

    /**
     * Distribui a data de cadastro dos pacientes pelos últimos 3 anos (captação)
     * e força ~1/3 a fazer aniversário no mês corrente (widget aniversariantes).
     */
    private function spreadPatientRegistrationAndBirthdays($patients, Carbon $now): void
    {
        foreach ($patients->values() as $index => $patient) {
            // Captação: ano corrente, -1 e -2, alternando origem.
            $yearsAgo   = $index % 3;
            $createdAt  = $now->copy()->subYears($yearsAgo)->subDays(($index * 7) % 330);
            $attributes = [
                'created_at'      => $createdAt,
                'referral_source' => self::REFERRAL_SOURCES[$index % count(self::REFERRAL_SOURCES)],
            ];

            // Aniversariantes do mês: a cada 2 pacientes, joga o nascimento para o mês corrente.
            if ($index % 2 === 0) {
                $day                      = ($index % 28) + 1;
                $birthYear                = $now->year - (25 + ($index % 30));
                $attributes['birth_date'] = Carbon::create($birthYear, $now->month, $day)->toDateString();
            }

            $patient->forceFill($attributes)->save();
        }
    }

    /**
     * Cria consultas do início do ano até +7 dias, em dias úteis dentro da janela
     * 08–18, garantindo um bloco variado para hoje (consultas de hoje / próximas).
     */
    private function seedAppointments(Clinic $clinic, $physios, $patients, Carbon $now): int
    {
        $rows    = [];
        $start   = $now->copy()->startOfYear();
        $endDate = $now->copy()->addDays(7)->endOfDay();
        $cursor  = $start->copy();

        while ($cursor->lte($endDate)) {
            $isToday  = $cursor->isSameDay($now);
            $isFuture = $cursor->gt($now);

            // Só dias úteis (seg–sex) e fora "hoje" (hoje tem bloco dedicado).
            if ($cursor->isWeekday() && !$isToday) {
                foreach ($physios as $physio) {
                    $slots = random_int(0, 3); // ocupação variável por dia/profissional
                    $hours = $this->pickHours($slots);
                    foreach ($hours as $hour) {
                        $startsAt = $cursor->copy()->setTime($hour, 0);
                        $status   = $isFuture
                            ? collect([AppointmentStatus::Scheduled, AppointmentStatus::Confirmed])->random()
                            : collect([AppointmentStatus::Completed, AppointmentStatus::Completed, AppointmentStatus::NoShow])->random();

                        $rows[] = $this->appointmentRow($clinic, $physio, $patients->random(), $startsAt, $status);
                    }
                }
            }

            $cursor->addDay();
        }

        // Bloco dedicado de hoje (consultas de hoje + próximas consultas).
        $todayHours = [9, 10, 11, 14, 15, 16, 17];
        foreach ($todayHours as $i => $hour) {
            $physio   = $physios[$i % $physios->count()];
            $startsAt = $now->copy()->setTime($hour, 0);
            // Passadas hoje → concluídas/confirmadas; futuras → agendada/confirmada.
            $status = $startsAt->lt($now)
                ? collect([AppointmentStatus::Completed, AppointmentStatus::Confirmed])->random()
                : collect([AppointmentStatus::Scheduled, AppointmentStatus::Confirmed])->random();

            $rows[] = $this->appointmentRow($clinic, $physio, $patients->random(), $startsAt, $status);
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            Appointment::insert($chunk);
        }

        return count($rows);
    }

    /** Seleciona horários distintos dentro da janela de atendimento (08–17). */
    private function pickHours(int $count): array
    {
        if ($count <= 0) {
            return [];
        }

        $pool = range(8, 17);
        shuffle($pool);

        return array_slice($pool, 0, $count);
    }

    /** @return array<string,mixed> */
    private function appointmentRow(Clinic $clinic, ClinicUser $physio, Patient $patient, Carbon $startsAt, AppointmentStatus $status): array
    {
        return [
            'clinic_id'      => $clinic->id,
            'patient_id'     => $patient->id,
            'clinic_user_id' => $physio->id,
            'title'          => self::APPOINTMENT_TITLES[array_rand(self::APPOINTMENT_TITLES)],
            'starts_at'      => $startsAt->copy()->utc(),
            'ends_at'        => $startsAt->copy()->addHour()->utc(),
            'status'         => $status->value,
            'source'         => Appointment::SOURCE_SYSTEM,
            'created_at'     => now(),
            'updated_at'     => now(),
        ];
    }

    /** Insere atividades de hoje para o feed (admin/secretário). */
    private function seedTodayActivities(Clinic $clinic, $physios, $patients, Carbon $now): void
    {
        $samples = [
            [ActivityType::ProgramCreated, 'Programa criado — Reabilitação de Joelho · ' . $patients->random()->name, 10],
            [ActivityType::AppointmentCompleted, 'Consulta concluída — ' . $patients->random()->name, 60],
            [ActivityType::PatientCreated, 'Novo paciente cadastrado — ' . $patients->random()->name, 120],
            [ActivityType::ExercisesAdded, '5 exercício(s) adicionado(s) — Alongamento', 180],
            [ActivityType::AppointmentScheduled, 'Consulta agendada — ' . $patients->random()->name, 220],
            [ActivityType::AppointmentCancelled, 'Consulta cancelada — ' . $patients->random()->name, 300],
        ];

        $rows = [];
        foreach ($samples as [$type, $description, $minutesAgo]) {
            $rows[] = [
                'clinic_id'      => $clinic->id,
                'clinic_user_id' => $physios->random()->id,
                'type'           => $type->value,
                'description'    => $description,
                'created_at'     => $now->copy()->subMinutes($minutesAgo)->utc(),
                'updated_at'     => $now->copy()->subMinutes($minutesAgo)->utc(),
            ];
        }

        DB::table('clinic_activities')->insert($rows);
    }
}
