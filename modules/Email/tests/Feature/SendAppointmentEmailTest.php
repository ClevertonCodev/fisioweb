<?php

namespace Modules\Email\Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Events\AppointmentEmailRequested;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Email\Listeners\SendAppointmentEmail;
use Modules\Email\Mail\AppointmentScheduledMail;
use Modules\Patient\Models\Patient;
use Monolog\Handler\TestHandler;
use Monolog\Logger;
use RuntimeException;
use Tests\TestCase;

class SendAppointmentEmailTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $physio;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-11-23 12:00:00', 'UTC'));

        config([
            'app.timezone'      => 'UTC',
            'mail.from.address' => 'naoresponda@ivsmed.com',
        ]);

        $this->clinic = Clinic::factory()->create([
            'name'     => 'Clínica Movimento',
            'phone'    => '(11) 4000-1234',
            'address'  => 'Rua das Flores',
            'number'   => '120',
            'city'     => 'São Paulo',
            'state'    => 'SP',
            'timezone' => 'America/Sao_Paulo',
        ]);
        $this->physio = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'name'      => 'Rafael Lima',
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);
        $this->patient = Patient::factory()->forClinic($this->clinic)->create([
            'name'        => 'Ana Paula Silva',
            'email'       => 'ana@example.test',
            'use_apelido' => false,
        ]);
    }

    private function makeAppointment(array $overrides = []): Appointment
    {
        return Appointment::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physio->id,
            'patient_id'     => $this->patient->id,
            'status'         => AppointmentStatus::Scheduled,
            'starts_at'      => CarbonImmutable::now('UTC')->addDays(3)->setTime(17, 0),
            'ends_at'        => CarbonImmutable::now('UTC')->addDays(3)->setTime(18, 0),
            'location'       => null,
        ], $overrides));
    }

    private function dispatchRequested(Appointment $appointment, string $kind = 'scheduled', ?int $clinicId = null): void
    {
        Event::dispatch(new AppointmentEmailRequested(
            version: 1,
            clinicId: $clinicId ?? $this->clinic->id,
            appointmentId: $appointment->id,
            patientId: $this->patient->id,
            actorId: $this->physio->id,
            kind: $kind,
            occurredAt: CarbonImmutable::now(),
        ));
    }

    public function test_scheduled_email_shows_date_and_time_in_clinic_timezone_professional_place_and_phone(): void
    {
        Mail::fake();
        $appointment = $this->makeAppointment();

        $this->dispatchRequested($appointment);

        Mail::assertSent(AppointmentScheduledMail::class, function (AppointmentScheduledMail $mail): bool {
            $envelope = $mail->envelope();
            $html     = $mail->render();

            $this->assertTrue($mail->hasTo('ana@example.test'));
            $this->assertSame('naoresponda@ivsmed.com', $envelope->from?->address);
            $this->assertSame('Clínica Movimento via IVS MED', $envelope->from?->name);
            $this->assertSame([], $envelope->replyTo);
            $this->assertSame('Consulta marcada para 26/11 às 14:00 · Clínica Movimento', $envelope->subject);
            $this->assertSame([
                ['Data', 'Quinta-feira, 26/11/2026'],
                ['Horário', '14:00 às 15:00'],
                ['Profissional', 'Rafael Lima'],
                ['Local', 'Rua das Flores, 120 · São Paulo/SP'],
            ], $mail->detailsRows);
            $this->assertStringContainsString('Olá, Ana!', $html);
            $this->assertStringContainsString('Sua consulta está marcada', $html);
            $this->assertStringContainsString('14:00 às 15:00', $html);
            $this->assertStringNotContainsString('17:00', $html);
            $this->assertStringContainsString('Precisa remarcar? Ligue para a clínica: (11) 4000-1234', $html);

            return true;
        });
    }

    public function test_how_to_get_there_button_appears_with_clinic_address_and_links_to_google_maps(): void
    {
        Mail::fake();
        $appointment = $this->makeAppointment();

        $this->dispatchRequested($appointment);

        Mail::assertSent(AppointmentScheduledMail::class, function (AppointmentScheduledMail $mail): bool {
            $expected = 'https://www.google.com/maps/search/?api=1&query='
                . rawurlencode('Rua das Flores, 120, São Paulo, SP');

            $this->assertSame($expected, $mail->mapsUrl);
            $html = $mail->render();
            $this->assertStringContainsString('Como chegar', $html);
            $this->assertStringContainsString(e($expected), $html);

            return true;
        });
    }

    public function test_how_to_get_there_button_is_hidden_without_clinic_address(): void
    {
        Mail::fake();
        $this->clinic->forceFill(['address' => null, 'number' => null, 'city' => null, 'state' => null])->save();
        $appointment = $this->makeAppointment();

        $this->dispatchRequested($appointment);

        Mail::assertSent(AppointmentScheduledMail::class, function (AppointmentScheduledMail $mail): bool {
            $html = $mail->render();

            $this->assertNull($mail->mapsUrl);
            $this->assertStringNotContainsString('Como chegar', $html);
            $this->assertStringNotContainsString('google.com/maps', $html);
            $this->assertNotContains('Local', array_column($mail->detailsRows, 0));

            return true;
        });
    }

    public function test_does_not_send_when_appointment_does_not_belong_to_event_clinic_and_log_omits_email(): void
    {
        Mail::fake();
        $handler = new TestHandler;
        $logger  = Log::channel('dated')->getLogger();
        $this->assertInstanceOf(Logger::class, $logger);
        $logger->pushHandler($handler);

        $clinicB     = Clinic::factory()->create();
        $patientB    = Patient::factory()->forClinic($clinicB)->create(['email' => 'paciente-b@example.test']);
        $appointment = $this->makeAppointment(['patient_id' => $patientB->id]);

        Event::dispatch(new AppointmentEmailRequested(
            version: 1,
            clinicId: $clinicB->id,
            appointmentId: $appointment->id,
            patientId: $patientB->id,
            actorId: null,
            kind: 'scheduled',
            occurredAt: CarbonImmutable::now(),
        ));

        Mail::assertNothingSent();

        $warning = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'appointment_scheduled'
                && $record->level->getName() === 'WARNING'
        );

        $this->assertNotNull($warning);
        $this->assertSame($clinicB->id, $warning->context['clinic_id']);
        $this->assertSame($appointment->id, $warning->context['appointment_id']);
        $this->assertStringNotContainsString('paciente-b@example.test', json_encode($warning->toArray()));
    }

    public function test_does_not_send_scheduled_email_for_cancelled_appointment(): void
    {
        Mail::fake();
        $appointment = $this->makeAppointment(['status' => AppointmentStatus::Cancelled]);

        $this->dispatchRequested($appointment);

        Mail::assertNothingSent();
    }

    public function test_external_text_does_not_become_markdown_or_html(): void
    {
        Mail::fake();
        $this->clinic->forceFill(['name' => 'Clínica [x](https://evil.test) <b>'])->save();
        $this->physio->forceFill(['name' => "Rafael\n\n# Título <script>"])->save();
        $appointment = $this->makeAppointment(['location' => 'Sala [2](https://evil.test)']);

        $this->dispatchRequested($appointment);

        Mail::assertSent(AppointmentScheduledMail::class, function (AppointmentScheduledMail $mail): bool {
            $html = $mail->render();

            $this->assertStringNotContainsString('href="https://evil.test"', $html);
            $this->assertStringNotContainsString('<script>', $html);
            $this->assertStringNotContainsString('<b>', $html);
            $this->assertStringNotContainsString('<h1>Título', $html);

            return true;
        });
    }

    public function test_logs_sent_and_failed_with_ids_and_never_logs_patient_email(): void
    {
        Mail::fake();
        $handler = new TestHandler;
        Log::setDefaultDriver('dated');
        $logger = Log::channel('dated')->getLogger();
        $this->assertInstanceOf(Logger::class, $logger);
        $logger->pushHandler($handler);

        $appointment = $this->makeAppointment();
        $event       = new AppointmentEmailRequested(
            version: 1,
            clinicId: $this->clinic->id,
            appointmentId: $appointment->id,
            patientId: $this->patient->id,
            actorId: null,
            kind: 'scheduled',
            occurredAt: CarbonImmutable::now(),
        );

        Event::dispatch($event);

        $sent = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'appointment_scheduled'
                && $record->level->getName() === 'INFO'
        );
        $this->assertNotNull($sent);
        $this->assertSame($appointment->id, $sent->context['appointment_id']);
        $this->assertSame($this->patient->id, $sent->context['patient_id']);
        $this->assertStringNotContainsString('ana@example.test', json_encode($sent->toArray()));

        app(SendAppointmentEmail::class)->failed($event, new RuntimeException('SMTP rejected ana@example.test'));

        $failed = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'appointment_scheduled'
                && $record->level->getName() === 'ERROR'
        );
        $this->assertNotNull($failed);
        $this->assertSame($this->clinic->id, $failed->context['clinic_id']);
        $this->assertStringNotContainsString('ana@example.test', json_encode($failed->toArray()));
    }

    public function test_listener_is_queued_with_three_attempts_and_backoff(): void
    {
        $listener = app(SendAppointmentEmail::class);

        $this->assertInstanceOf(ShouldQueue::class, $listener);
        $this->assertSame(3, $listener->tries);
        $this->assertSame([10, 30, 60], $listener->backoff);
    }

    public function test_home_visit_shows_home_place_without_clinic_address_or_directions(): void
    {
        Mail::fake();
        $appointment = $this->makeAppointment(['location' => 'Domicílio do paciente']);

        $this->dispatchRequested($appointment);

        Mail::assertSent(AppointmentScheduledMail::class, function (AppointmentScheduledMail $mail): bool {
            $html = $mail->render();

            $this->assertContains(['Local', 'Atendimento em domicílio'], $mail->detailsRows);
            $this->assertNull($mail->mapsUrl);
            $this->assertStringNotContainsString('Como chegar', $html);

            return true;
        });
    }

    public function test_clinic_room_is_shown_before_clinic_address(): void
    {
        Mail::fake();
        $withRoom    = $this->makeAppointment(['location' => 'Clínica · Sala 3']);
        $withoutRoom = $this->makeAppointment(['location' => 'Clínica']);

        $this->dispatchRequested($withRoom);
        $this->dispatchRequested($withoutRoom);

        $places = Mail::sent(AppointmentScheduledMail::class)
            ->map(fn (AppointmentScheduledMail $mail) => collect($mail->detailsRows)->firstWhere(0, 'Local')[1] ?? null)
            ->all();

        $this->assertSame([
            'Sala 3 · Rua das Flores, 120 · São Paulo/SP',
            'Rua das Flores, 120 · São Paulo/SP',
        ], $places);
    }

    public function test_does_not_send_when_event_points_to_another_patient_of_the_same_clinic(): void
    {
        Mail::fake();
        $otherPatient = Patient::factory()->forClinic($this->clinic)->create(['email' => 'outro@example.test']);
        $appointment  = $this->makeAppointment();

        Event::dispatch(new AppointmentEmailRequested(
            version: 1,
            clinicId: $this->clinic->id,
            appointmentId: $appointment->id,
            patientId: $otherPatient->id,
            actorId: null,
            kind: 'scheduled',
            occurredAt: CarbonImmutable::now(),
        ));

        Mail::assertNothingSent();
    }

    public function test_does_not_send_when_patient_email_is_malformed(): void
    {
        Mail::fake();
        $this->patient->forceFill(['email' => 'sem-arroba'])->save();
        $appointment = $this->makeAppointment();

        $this->dispatchRequested($appointment);

        Mail::assertNothingSent();
    }
}
