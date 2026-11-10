<?php

namespace Modules\GoogleCalendar\Tests\Feature;

use Carbon\CarbonImmutable;
use Google\Service\Calendar\Event as GoogleEvent;
use Google\Service\Calendar\EventDateTime;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Contracts\Public\AppointmentCancelFromExternalSourceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Jobs\PullGoogleCalendarJob;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class GooglePullCrossUserTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $physioA;

    private ClinicUser $physioB;

    private Patient $patientB;

    private Appointment $appointmentB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic  = Clinic::factory()->create();
        $this->physioA = $this->connectedPhysio($this->clinic);
        $this->physioB = $this->connectedPhysio($this->clinic);

        $this->patientB     = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->appointmentB = Appointment::factory()->forClinic($this->clinic)->create([
            'clinic_user_id'  => $this->physioB->id,
            'patient_id'      => $this->patientB->id,
            'title'           => 'Sessão do paciente do B',
            'starts_at'       => now()->addDays(2)->startOfMinute(),
            'ends_at'         => now()->addDays(2)->addHour()->startOfMinute(),
            'google_event_id' => 'evento-colidido',
            'source'          => Appointment::SOURCE_SYSTEM,
            'status'          => AppointmentStatus::Scheduled,
        ]);
    }

    public function test_pull_of_physio_a_does_not_touch_appointment_of_physio_b_with_same_event_id(): void
    {
        $before = $this->appointmentB->fresh()->getAttributes();

        $this->pullForA([$this->googleEvent('evento-colidido', 'Evento da agenda do A')]);

        $this->assertSame($before, $this->appointmentB->fresh()->getAttributes());
        $this->assertSame(1, Appointment::count());
    }

    public function test_cancellation_from_google_of_physio_a_does_not_cancel_appointment_of_physio_b(): void
    {
        $before = $this->appointmentB->fresh()->getAttributes();

        $this->pullForA([$this->googleEvent('evento-colidido', 'Evento da agenda do A', 'cancelled')]);

        $this->assertSame($before, $this->appointmentB->fresh()->getAttributes());
        $this->assertSame(AppointmentStatus::Scheduled, $this->appointmentB->fresh()->status);
    }

    public function test_cancel_contract_ignores_appointment_of_another_professional(): void
    {
        app(AppointmentCancelFromExternalSourceInterface::class)
            ->cancelFromExternalSource($this->appointmentB->id, $this->physioA->id, CarbonImmutable::now());

        $this->assertSame(AppointmentStatus::Scheduled, $this->appointmentB->fresh()->status);
        $this->assertNull($this->appointmentB->fresh()->last_synced_at);
    }

    public function test_read_contract_finds_event_only_in_appointments_of_the_given_professional(): void
    {
        $reader = app(AppointmentReadServiceInterface::class);

        $this->assertNull($reader->findIdByExternalEventId($this->clinic->id, $this->physioA->id, 'evento-colidido'));
        $this->assertSame($this->appointmentB->id, $reader->findIdByExternalEventId($this->clinic->id, $this->physioB->id, 'evento-colidido'));
    }

    public function test_pull_of_physio_a_still_creates_and_updates_his_own_appointments(): void
    {
        $ownAppointment = Appointment::factory()->forClinic($this->clinic)->create([
            'clinic_user_id'  => $this->physioA->id,
            'title'           => 'Título antigo',
            'google_event_id' => 'evento-do-a',
            'source'          => Appointment::SOURCE_SYSTEM,
            'status'          => AppointmentStatus::Scheduled,
        ]);

        $this->pullForA([
            $this->googleEvent('evento-do-a', 'Título novo vindo do Google'),
            $this->googleEvent('evento-novo-do-a', 'Evento novo do A'),
        ]);

        $this->assertSame('Título novo vindo do Google', $ownAppointment->fresh()->title);
        $this->assertDatabaseHas('clinic_appointments', [
            'clinic_id'       => $this->clinic->id,
            'clinic_user_id'  => $this->physioA->id,
            'google_event_id' => 'evento-novo-do-a',
            'title'           => 'Evento novo do A',
            'source'          => 'google',
        ]);
    }

    public function test_pull_updates_own_appointment_even_when_physio_b_has_one_with_same_event_id(): void
    {
        $ownAppointment = Appointment::factory()->forClinic($this->clinic)->create([
            'clinic_user_id'  => $this->physioA->id,
            'title'           => 'Título antigo do A',
            'google_event_id' => 'evento-colidido',
            'status'          => AppointmentStatus::Scheduled,
        ]);
        $before = $this->appointmentB->fresh()->getAttributes();

        $this->pullForA([$this->googleEvent('evento-colidido', 'Título novo do A')]);

        $this->assertSame('Título novo do A', $ownAppointment->fresh()->title);
        $this->assertSame($before, $this->appointmentB->fresh()->getAttributes());
    }

    public function test_pull_does_not_touch_appointment_of_another_clinic_with_same_event_id(): void
    {
        $otherClinic       = Clinic::factory()->create();
        $physioOtherClinic = $this->connectedPhysio($otherClinic);
        $otherAppointment  = Appointment::factory()->forClinic($otherClinic)->create([
            'clinic_user_id'  => $physioOtherClinic->id,
            'google_event_id' => 'evento-de-outra-clinica',
            'status'          => AppointmentStatus::Scheduled,
        ]);
        $before = $otherAppointment->fresh()->getAttributes();

        $this->pullForA([$this->googleEvent('evento-de-outra-clinica', 'Evento do A', 'cancelled')]);
        $this->pullForA([$this->googleEvent('evento-de-outra-clinica', 'Evento do A')]);

        $this->assertSame($before, $otherAppointment->fresh()->getAttributes());
        $this->assertDatabaseHas('clinic_appointments', [
            'clinic_id'       => $this->clinic->id,
            'clinic_user_id'  => $this->physioA->id,
            'google_event_id' => 'evento-de-outra-clinica',
        ]);
    }

    /**
     * @param  array<int, GoogleEvent>  $events
     */
    private function pullForA(array $events): void
    {
        $this->mock(GoogleCalendarServiceInterface::class, function ($mock) use ($events) {
            $mock->shouldReceive('pullChanges')->once()->andReturn(['events' => $events, 'nextSyncToken' => null]);
        });

        PullGoogleCalendarJob::dispatchSync($this->physioA->id);
    }

    private function connectedPhysio(Clinic $clinic): ClinicUser
    {
        $user = ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $user->forceFill([
            'google_access_token'  => 'tok',
            'google_refresh_token' => 'ref',
            'google_connected_at'  => now(),
            'google_calendar_id'   => 'primary',
        ])->save();

        return $user;
    }

    private function googleEvent(string $id, string $summary, string $status = 'confirmed'): GoogleEvent
    {
        $event = new GoogleEvent;
        $event->setId($id);
        $event->setStatus($status);
        $event->setSummary($summary);

        $start = new EventDateTime;
        $start->setDateTime(now()->addDays(3)->setTime(10, 0)->toRfc3339String());
        $event->setStart($start);

        $end = new EventDateTime;
        $end->setDateTime(now()->addDays(3)->setTime(11, 0)->toRfc3339String());
        $event->setEnd($end);

        return $event;
    }
}
