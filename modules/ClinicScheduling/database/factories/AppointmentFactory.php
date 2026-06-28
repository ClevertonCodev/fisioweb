<?php

namespace Modules\Clinic\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Clinic\Enums\AppointmentStatus;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        $clinic   = Clinic::factory();
        $startsAt = fake()->dateTimeBetween('-1 week', '+1 week');
        $endsAt   = (clone $startsAt)->modify('+1 hour');

        return [
            'clinic_id'       => $clinic,
            'patient_id'      => Patient::factory(),
            'clinic_user_id'  => ClinicUser::factory(),
            'title'           => fake()->randomElement(['Avaliação inicial', 'Sessão de RPG', 'Retorno', 'Pilates clínico']),
            'description'     => fake()->optional()->sentence(),
            'location'        => fake()->optional()->randomElement(['Sala 1', 'Sala 2', 'Sala 3']),
            'starts_at'       => $startsAt,
            'ends_at'         => $endsAt,
            'status'          => AppointmentStatus::Scheduled,
            'google_event_id' => null,
            'source'          => Appointment::SOURCE_SYSTEM,
        ];
    }

    public function status(AppointmentStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }

    public function forClinic(Clinic $clinic): static
    {
        return $this->state(fn () => ['clinic_id' => $clinic->id]);
    }
}
