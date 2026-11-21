<?php

namespace Modules\ClinicScheduling\Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Events\AppointmentReminderDue;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class AppointmentReminderCommandTest extends TestCase
{
    use RefreshDatabase;

    private const COMMAND = 'clinic-scheduling:send-appointment-reminders';

    private Clinic $clinic;

    private ClinicUser $physio;

    private Patient $patient;

    private CarbonImmutable $now;

    protected function setUp(): void
    {
        parent::setUp();

        $this->now = CarbonImmutable::parse('2026-11-23 10:00:00', 'UTC');
        $this->travelTo($this->now);

        $this->clinic  = Clinic::factory()->create();
        $this->physio  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->patient = Patient::factory()->forClinic($this->clinic)->create();
    }

    private function appointmentAt(CarbonImmutable $startsAt, array $overrides = []): Appointment
    {
        return Appointment::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physio->id,
            'patient_id'     => $this->patient->id,
            'status'         => AppointmentStatus::Scheduled,
            'starts_at'      => $startsAt,
            'ends_at'        => $startsAt->addHour(),
        ], $overrides));
    }

    /**
     * @return list<int>
     */
    private function remindedAppointmentIds(): array
    {
        return Event::dispatched(AppointmentReminderDue::class)
            ->map(fn (array $args) => $args[0]->appointmentId)
            ->sort()
            ->values()
            ->all();
    }

    public function test_dispatches_only_for_appointments_starting_between_23_and_24_hours_ahead(): void
    {
        Event::fake([AppointmentReminderDue::class]);

        $at23h    = $this->appointmentAt($this->now->addHours(23));
        $at23h59  = $this->appointmentAt($this->now->addHours(23)->addMinutes(59));
        $this->appointmentAt($this->now->addHours(22)->addMinutes(59));
        $this->appointmentAt($this->now->addHours(24));
        $this->appointmentAt($this->now->addHours(2));

        $this->artisan(self::COMMAND)->assertSuccessful();

        $this->assertSame([$at23h->id, $at23h59->id], $this->remindedAppointmentIds());

        $event = Event::dispatched(AppointmentReminderDue::class)
            ->first(fn (array $args) => $args[0]->appointmentId === $at23h->id)[0];

        $this->assertSame(1, $event->version);
        $this->assertSame($this->clinic->id, $event->clinicId);
        $this->assertSame($this->patient->id, $event->patientId);
        $this->assertTrue($event->startsAt->equalTo($this->now->addHours(23)));
        $this->assertTrue($event->occurredAt->equalTo($this->now));
    }

    public function test_a_run_delayed_within_the_hour_still_covers_the_on_the_hour_appointments(): void
    {
        Event::fake([AppointmentReminderDue::class]);

        $onTheHour = $this->appointmentAt($this->now->addHours(24));

        $this->artisan(self::COMMAND)->assertSuccessful();
        $this->assertSame([], $this->remindedAppointmentIds());

        $lateRun = $this->now->addHour()->addMinute()->addSeconds(5);
        $this->travelTo($lateRun);
        $this->artisan(self::COMMAND)->assertSuccessful();

        $this->assertSame([$onTheHour->id], $this->remindedAppointmentIds());
        $this->assertTrue(Event::dispatched(AppointmentReminderDue::class)->first()[0]->occurredAt->equalTo($lateRun));
    }

    public function test_dispatches_only_for_scheduled_or_confirmed_appointments_with_patient(): void
    {
        Event::fake([AppointmentReminderDue::class]);
        $startsAt = $this->now->addHours(23)->addMinutes(30);

        $scheduled = $this->appointmentAt($startsAt);
        $confirmed = $this->appointmentAt($startsAt, ['status' => AppointmentStatus::Confirmed]);
        $this->appointmentAt($startsAt, ['status' => AppointmentStatus::Cancelled]);
        $this->appointmentAt($startsAt, ['status' => AppointmentStatus::Completed]);
        $this->appointmentAt($startsAt, ['status' => AppointmentStatus::NoShow]);
        $this->appointmentAt($startsAt, ['patient_id' => null]);

        $this->artisan(self::COMMAND)->assertSuccessful();

        $this->assertSame([$scheduled->id, $confirmed->id], $this->remindedAppointmentIds());
    }

    public function test_each_event_carries_the_clinic_of_its_own_appointment(): void
    {
        Event::fake([AppointmentReminderDue::class]);
        $startsAt = $this->now->addHours(23)->addMinutes(30);

        $clinicB      = Clinic::factory()->create();
        $patientB     = Patient::factory()->forClinic($clinicB)->create();
        $appointmentA = $this->appointmentAt($startsAt);
        $appointmentB = $this->appointmentAt($startsAt, [
            'clinic_id'      => $clinicB->id,
            'clinic_user_id' => ClinicUser::factory()->create(['clinic_id' => $clinicB->id])->id,
            'patient_id'     => $patientB->id,
        ]);

        $this->artisan(self::COMMAND)->assertSuccessful();

        $byAppointment = Event::dispatched(AppointmentReminderDue::class)
            ->mapWithKeys(fn (array $args) => [$args[0]->appointmentId => [$args[0]->clinicId, $args[0]->patientId]])
            ->all();

        $this->assertSame([
            $appointmentA->id => [$this->clinic->id, $this->patient->id],
            $appointmentB->id => [$clinicB->id, $patientB->id],
        ], $byAppointment);
    }

    public function test_the_command_is_scheduled_hourly_without_overlapping_on_one_server(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->filter(fn ($e) => str_contains((string) $e->command, 'clinic-scheduling:send-appointment-reminders'))
            ->sole();

        $this->assertSame('0 * * * *', $event->expression);
        $this->assertTrue($event->withoutOverlapping);
        $this->assertSame(55, $event->expiresAt);
        $this->assertTrue($event->onOneServer);
    }
}
