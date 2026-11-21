<?php

namespace Modules\Email\Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\MailManager;
use Illuminate\Mail\Markdown;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Events\AppointmentReminderDue;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Email\Contracts\AppointmentReminderSenderInterface;
use Modules\Email\Listeners\SendAppointmentReminder;
use Modules\Email\Mail\AppointmentReminderMail;
use Modules\Patient\Models\Patient;
use Monolog\Handler\TestHandler;
use Monolog\Logger;
use RuntimeException;
use Tests\TestCase;

class SendAppointmentReminderTest extends TestCase
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

        $this->now = CarbonImmutable::parse('2026-11-23 15:00:00', 'UTC');
        $this->travelTo($this->now);

        config([
            'app.timezone'      => 'UTC',
            'app.url'           => 'https://app.ivsmed.test',
            'mail.from.address' => 'naoresponda@ivsmed.com',
        ]);

        $this->clinic = Clinic::factory()->create([
            'name'                               => 'Clínica Movimento',
            'phone'                              => '(11) 4000-1234',
            'address'                            => 'Rua das Flores',
            'number'                             => '120',
            'city'                               => 'São Paulo',
            'state'                              => 'SP',
            'timezone'                           => 'America/Sao_Paulo',
            'appointment_reminder_email_enabled' => true,
        ]);
        $this->physio = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'name'      => 'Rafael Lima',
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);
        $this->patient = Patient::factory()->forClinic($this->clinic)->create([
            'name'                                => 'Ana Paula Silva',
            'email'                               => 'ana@example.test',
            'use_apelido'                         => false,
            'receives_appointment_reminder_email' => true,
        ]);
    }

    private function appointmentIn(int $hours, int $minutes = 0, array $overrides = []): Appointment
    {
        $startsAt = $this->now->addHours($hours)->addMinutes($minutes);

        return Appointment::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physio->id,
            'patient_id'     => $this->patient->id,
            'status'         => AppointmentStatus::Scheduled,
            'starts_at'      => $startsAt,
            'ends_at'        => $startsAt->addHour(),
            'location'       => null,
        ], $overrides));
    }

    private function dispatchDue(Appointment $appointment, ?int $clinicId = null, ?int $patientId = null, ?CarbonImmutable $startsAt = null): void
    {
        Event::dispatch(new AppointmentReminderDue(
            version: 1,
            clinicId: $clinicId ?? (int) $appointment->clinic_id,
            appointmentId: $appointment->id,
            patientId: $patientId ?? (int) $appointment->patient_id,
            startsAt: $startsAt ?? CarbonImmutable::instance($appointment->starts_at),
            occurredAt: CarbonImmutable::now(),
        ));
    }

    public function test_reminder_reaches_the_patient_with_time_in_clinic_timezone_professional_and_place(): void
    {
        Mail::fake();
        $this->appointmentIn(23, 30);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertSent(AppointmentReminderMail::class, function (AppointmentReminderMail $mail): bool {
            $envelope = $mail->envelope();
            $html     = $mail->render();

            $this->assertTrue($mail->hasTo('ana@example.test'));
            $this->assertSame('Clínica Movimento via IVS MED', $envelope->from?->name);
            $this->assertSame([], $envelope->replyTo);
            $this->assertSame('Lembrete: consulta amanhã às 11:30 · Clínica Movimento', $envelope->subject);
            $this->assertSame([
                ['Data', 'Amanhã, terça-feira, 24/11/2026'],
                ['Horário', '11:30 às 12:30'],
                ['Profissional', 'Rafael Lima'],
                ['Local', 'Rua das Flores, 120 · São Paulo/SP'],
            ], $mail->detailsRows);
            $this->assertStringContainsString('Sua consulta é amanhã', $html);
            $this->assertStringContainsString('Olá, Ana!', $html);
            $this->assertStringContainsString('Não vai conseguir ir? Avise a clínica pelo (11) 4000-1234.', $html);
            $this->assertStringNotContainsString('14:30', $html);

            return true;
        });
        Mail::assertSentCount(1);
    }

    public function test_clinic_with_reminder_switched_off_sends_nothing(): void
    {
        Mail::fake();
        $this->clinic->forceFill(['appointment_reminder_email_enabled' => false])->save();
        $this->appointmentIn(23, 30);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_patient_with_reminder_switched_off_receives_nothing(): void
    {
        Mail::fake();
        $this->patient->forceFill(['receives_appointment_reminder_email' => false])->save();
        $this->appointmentIn(23, 30);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_patient_without_a_valid_email_receives_nothing(): void
    {
        Mail::fake();
        $withoutEmail = Patient::factory()->forClinic($this->clinic)->create(['email' => '']);
        $invalidEmail = Patient::factory()->forClinic($this->clinic)->create(['email' => 'sem-arroba']);
        $this->appointmentIn(23, 30, ['patient_id' => $withoutEmail->id]);
        $this->appointmentIn(23, 30, ['patient_id' => $invalidEmail->id]);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_running_again_in_the_same_window_does_not_send_a_second_reminder(): void
    {
        Mail::fake();
        $this->appointmentIn(23, 50);

        $this->artisan(self::COMMAND)->assertSuccessful();
        $this->travel(10)->minutes();
        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertSentCount(1);
    }

    public function test_rescheduling_to_another_time_sends_a_new_reminder_in_the_new_window(): void
    {
        Mail::fake();
        $appointment = $this->appointmentIn(23, 30);

        $this->artisan(self::COMMAND)->assertSuccessful();

        $newStart = $this->now->addHours(47)->addMinutes(30);
        $appointment->update(['starts_at' => $newStart, 'ends_at' => $newStart->addHour()]);
        $this->travel(24)->hours();
        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertSentCount(2);
        $this->assertDatabaseCount('email_appointment_reminders', 2);
    }

    public function test_event_with_a_start_time_that_is_no_longer_the_appointment_time_sends_nothing(): void
    {
        Mail::fake();
        $appointment = $this->appointmentIn(30);

        $this->dispatchDue($appointment, startsAt: $this->now->addHours(23)->addMinutes(30));

        Mail::assertNothingSent();
        $this->assertDatabaseCount('email_appointment_reminders', 0);
    }

    public function test_event_for_an_appointment_cancelled_after_the_run_sends_nothing(): void
    {
        Mail::fake();
        $appointment = $this->appointmentIn(23, 30, ['status' => AppointmentStatus::Cancelled]);

        $this->dispatchDue($appointment);

        Mail::assertNothingSent();
    }

    public function test_does_not_send_when_the_appointment_is_not_from_the_event_clinic_and_log_omits_email(): void
    {
        Mail::fake();
        $handler = new TestHandler;
        $logger  = Log::channel('dated')->getLogger();
        $this->assertInstanceOf(Logger::class, $logger);
        $logger->pushHandler($handler);

        $clinicB     = Clinic::factory()->create(['appointment_reminder_email_enabled' => true]);
        $patientB    = Patient::factory()->forClinic($clinicB)->create(['email' => 'paciente-b@example.test']);
        $appointment = $this->appointmentIn(23, 30);

        $this->dispatchDue($appointment, clinicId: $clinicB->id, patientId: $patientB->id);

        Mail::assertNothingSent();
        $this->assertDatabaseCount('email_appointment_reminders', 0);

        $record = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'appointment_reminder'
        );
        $this->assertNotNull($record);
        $this->assertSame($clinicB->id, $record->context['clinic_id']);
        $this->assertStringNotContainsString('paciente-b@example.test', json_encode($record->toArray()));
        $this->assertStringNotContainsString('ana@example.test', json_encode($record->toArray()));
    }

    public function test_does_not_send_when_the_event_patient_is_not_the_appointment_patient(): void
    {
        Mail::fake();
        $other       = Patient::factory()->forClinic($this->clinic)->create(['email' => 'outro@example.test']);
        $appointment = $this->appointmentIn(23, 30);

        $this->dispatchDue($appointment, patientId: $other->id);

        Mail::assertNothingSent();
    }

    public function test_cancelled_clinic_sends_nothing_even_with_reminder_switched_on(): void
    {
        Mail::fake();
        $this->clinic->forceFill(['status' => Clinic::STATUS_CANCELLED])->save();
        $this->appointmentIn(23, 30);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_how_to_get_there_appears_only_with_clinic_address(): void
    {
        Mail::fake();
        $this->appointmentIn(23, 30);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertSent(AppointmentReminderMail::class, function (AppointmentReminderMail $mail): bool {
            $expected = 'https://www.google.com/maps/search/?api=1&query='
                . rawurlencode('Rua das Flores, 120, São Paulo, SP');

            $this->assertSame($expected, $mail->mapsUrl);
            $this->assertStringContainsString('Como chegar', $mail->render());

            return true;
        });
    }

    public function test_how_to_get_there_is_hidden_without_clinic_address(): void
    {
        Mail::fake();
        $this->clinic->forceFill(['address' => null, 'number' => null, 'city' => null, 'state' => null])->save();
        $this->appointmentIn(23, 30);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertSent(AppointmentReminderMail::class, function (AppointmentReminderMail $mail): bool {
            $html = $mail->render();

            $this->assertNull($mail->mapsUrl);
            $this->assertStringNotContainsString('Como chegar', $html);
            $this->assertStringNotContainsString('google.com/maps', $html);

            return true;
        });
    }

    public function test_footer_links_to_leave_reminders_with_a_token_signed_for_clinic_and_patient(): void
    {
        Mail::fake();
        $this->appointmentIn(23, 30);

        $this->artisan(self::COMMAND)->assertSuccessful();

        $signature = hash_hmac(
            'sha256',
            "appointment-reminder-unsubscribe|{$this->clinic->id}|{$this->patient->id}",
            (string) config('app.key'),
        );
        $expectedUrl = 'https://app.ivsmed.test/lembretes/sair?token='
            . rawurlencode("{$this->clinic->id}.{$this->patient->id}.{$signature}");

        Mail::assertSent(AppointmentReminderMail::class, function (AppointmentReminderMail $mail) use ($expectedUrl): bool {
            $this->assertSame($expectedUrl, $mail->unsubscribeUrl);

            $html = $mail->render();
            $this->assertMatchesRegularExpression(
                '#<a href="' . preg_quote(e($expectedUrl), '#') . '"[^>]*>Não quero mais receber lembretes</a>#',
                $html,
            );

            $text = (string) app(Markdown::class)->renderText('email::mail.appointment-reminder', $mail->buildViewData());
            $this->assertStringContainsString("Não quero mais receber lembretes: {$expectedUrl}", $text);

            return true;
        });
    }

    public function test_appointment_late_tonight_reminded_after_midnight_says_today(): void
    {
        Mail::fake();
        $this->travelTo(CarbonImmutable::parse('2026-11-24 03:10:00', 'UTC'));
        $startsAt = CarbonImmutable::parse('2026-11-25 02:40:00', 'UTC');
        Appointment::factory()->create([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physio->id,
            'patient_id'     => $this->patient->id,
            'status'         => AppointmentStatus::Confirmed,
            'starts_at'      => $startsAt,
            'ends_at'        => $startsAt->addHour(),
        ]);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertSent(AppointmentReminderMail::class, function (AppointmentReminderMail $mail): bool {
            $this->assertSame('Lembrete: consulta hoje às 23:40 · Clínica Movimento', $mail->envelope()->subject);
            $this->assertSame(['Data', 'Hoje, terça-feira, 24/11/2026'], $mail->detailsRows[0]);
            $this->assertStringContainsString('Sua consulta é hoje', $mail->render());

            return true;
        });
    }

    public function test_a_failed_send_releases_the_reminder_so_the_next_attempt_sends_it(): void
    {
        $appointment = $this->appointmentIn(23, 30);
        $event       = new AppointmentReminderDue(
            version: 1,
            clinicId: $this->clinic->id,
            appointmentId: $appointment->id,
            patientId: $this->patient->id,
            startsAt: CarbonImmutable::instance($appointment->starts_at),
            occurredAt: CarbonImmutable::now(),
        );
        $sender = app(AppointmentReminderSenderInterface::class);

        Mail::shouldReceive('to')->once()->andThrow(new RuntimeException('SMTP fora do ar'));

        try {
            $sender->send($event);
            $this->fail('O envio deveria ter falhado.');
        } catch (RuntimeException) {
        }

        $this->assertDatabaseCount('email_appointment_reminders', 0);

        Mail::swap(new MailManager($this->app));
        Mail::fake();
        $sender->send($event);

        Mail::assertSent(AppointmentReminderMail::class);
        $this->assertDatabaseCount('email_appointment_reminders', 1);
    }

    public function test_listener_is_queued_with_three_attempts_and_logs_failure_without_email(): void
    {
        $handler = new TestHandler;
        $logger  = Log::channel('dated')->getLogger();
        $this->assertInstanceOf(Logger::class, $logger);
        $logger->pushHandler($handler);

        $listener    = app(SendAppointmentReminder::class);
        $appointment = $this->appointmentIn(23, 30);

        $this->assertInstanceOf(ShouldQueue::class, $listener);
        $this->assertSame(3, $listener->tries);
        $this->assertSame([10, 30, 60], $listener->backoff);

        $listener->failed(new AppointmentReminderDue(
            version: 1,
            clinicId: $this->clinic->id,
            appointmentId: $appointment->id,
            patientId: $this->patient->id,
            startsAt: CarbonImmutable::instance($appointment->starts_at),
            occurredAt: CarbonImmutable::now(),
        ), new RuntimeException('SMTP rejected ana@example.test'));

        $failed = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'appointment_reminder'
                && $record->level->getName() === 'ERROR'
        );
        $this->assertNotNull($failed);
        $this->assertSame($appointment->id, $failed->context['appointment_id']);
        $this->assertStringNotContainsString('ana@example.test', json_encode($failed->toArray()));
    }

    public function test_event_handled_after_the_appointment_started_sends_nothing(): void
    {
        Mail::fake();
        $appointment = $this->appointmentIn(23, 30);
        $this->travel(24)->hours();

        $this->dispatchDue($appointment);

        Mail::assertNothingSent();
    }

    public function test_does_not_send_when_the_event_clinic_differs_even_with_the_appointment_patient(): void
    {
        Mail::fake();
        $clinicB     = Clinic::factory()->create(['appointment_reminder_email_enabled' => true]);
        $appointment = $this->appointmentIn(23, 30);

        $this->dispatchDue($appointment, clinicId: $clinicB->id);

        Mail::assertNothingSent();
        $this->assertDatabaseCount('email_appointment_reminders', 0);
    }

    public function test_does_not_send_when_an_inconsistent_appointment_points_to_a_patient_of_the_event_clinic(): void
    {
        Mail::fake();
        $clinicB     = Clinic::factory()->create(['appointment_reminder_email_enabled' => true]);
        $patientB    = Patient::factory()->forClinic($clinicB)->create(['email' => 'paciente-b@example.test']);
        $appointment = $this->appointmentIn(23, 30, ['patient_id' => $patientB->id]);

        $this->dispatchDue($appointment, clinicId: $clinicB->id, patientId: $patientB->id);

        Mail::assertNothingSent();
        $this->assertDatabaseCount('email_appointment_reminders', 0);
    }

    public function test_patient_with_death_discharge_or_cancelled_status_receives_nothing(): void
    {
        Mail::fake();

        foreach (Patient::INACTIVE_STATUSES as $status) {
            $inactive = Patient::factory()->forClinic($this->clinic)->create([
                'status'                              => $status,
                'receives_appointment_reminder_email' => true,
            ]);
            $this->appointmentIn(23, 30, ['patient_id' => $inactive->id]);
        }

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_patient_inactivated_by_the_clinic_receives_nothing(): void
    {
        Mail::fake();
        $this->patient->forceFill(['is_active' => false])->save();
        $this->appointmentIn(23, 30);

        $this->artisan(self::COMMAND)->assertSuccessful();

        Mail::assertNothingSent();
    }
}
