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
use Modules\ClinicQuestionnaire\Events\QuestionnaireEmailRequested;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\QuestionnaireQuestion;
use Modules\ClinicQuestionnaire\Models\QuestionnaireSection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\Email\Listeners\SendQuestionnaireEmail;
use Modules\Email\Mail\QuestionnaireSentMail;
use Modules\Patient\Models\Patient;
use Monolog\Handler\TestHandler;
use Monolog\Logger;
use RuntimeException;
use Tests\TestCase;

class SendQuestionnaireEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_sends_questionnaire_email_with_clinic_sender_deadline_in_clinic_timezone_and_share_url(): void
    {
        Mail::fake();

        config([
            'app.timezone'      => 'UTC',
            'mail.from.address' => 'naoresponda@ivsmed.com',
            'mail.from.name'    => 'IVS MED',
        ]);

        $clinic = Clinic::factory()->create([
            'name'     => 'Clínica Movimento',
            'slug'     => 'clinica-movimento',
            'phone'    => '(11) 4000-1234',
            'address'  => 'Rua das Flores',
            'number'   => '120',
            'city'     => 'São Paulo',
            'state'    => 'SP',
            'timezone' => 'America/Sao_Paulo',
        ]);
        $user = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);
        $patient = Patient::factory()->forClinic($clinic)->create([
            'name'        => 'Ana Paula Silva',
            'email'       => 'ana@example.test',
            'use_apelido' => false,
        ]);
        $template = QuestionnaireTemplate::factory()->forClinic($clinic)->create([
            'title' => 'Avaliação de dor e função',
        ]);
        $section = QuestionnaireSection::query()->create([
            'questionnaire_template_id' => $template->id,
            'title'                     => 'Dor',
            'sort_order'                => 0,
        ]);
        for ($i = 0; $i < 8; $i++) {
            QuestionnaireQuestion::query()->create([
                'questionnaire_section_id' => $section->id,
                'label'                    => "Pergunta {$i}",
                'type'                     => QuestionnaireQuestion::TYPE_TEXT,
                'required'                 => true,
                'sort_order'               => $i,
            ]);
        }

        $expiresAt = CarbonImmutable::now('UTC')->addDay()->setTime(2, 0);
        $deadline  = $expiresAt->setTimezone('America/Sao_Paulo')->format('d/m/Y');
        $this->assertNotSame($expiresAt->format('d/m/Y'), $deadline);

        $questionnaire = PatientQuestionnaire::factory()->forPatient($patient, $clinic)->create([
            'clinic_user_id'            => $user->id,
            'questionnaire_template_id' => $template->id,
            'modality'                  => PatientQuestionnaire::MODALITY_REMOTO,
            'status'                    => PatientQuestionnaire::STATUS_PENDING,
            'expires_at'                => $expiresAt,
        ]);

        Event::dispatch(new QuestionnaireEmailRequested(
            version: 1,
            clinicId: $clinic->id,
            patientQuestionnaireId: $questionnaire->id,
            patientId: $patient->id,
            actorId: $user->id,
            occurredAt: CarbonImmutable::now(),
        ));

        $expectedUrl = rtrim((string) config('app.url'), '/')
            . '/clinica-movimento/paciente/questionarios/'
            . $questionnaire->public_token;

        Mail::assertSent(QuestionnaireSentMail::class, function (QuestionnaireSentMail $mail) use ($deadline, $expectedUrl): bool {
            $envelope = $mail->envelope();
            $html     = $mail->render();

            $this->assertTrue($mail->hasTo('ana@example.test'));
            $this->assertSame('naoresponda@ivsmed.com', $envelope->from?->address);
            $this->assertSame('Clínica Movimento via IVS MED', $envelope->from?->name);
            $this->assertSame([], $envelope->replyTo);
            $this->assertSame(
                'Você tem um questionário para responder · Clínica Movimento',
                $envelope->subject,
            );
            $this->assertStringNotContainsString('Avaliação de dor e função', (string) $envelope->subject);
            $this->assertStringContainsString('Olá, Ana!', $html);
            $this->assertStringContainsString('Avaliação de dor e função', $html);
            $this->assertStringContainsString('Responder até', $html);
            $this->assertStringContainsString($deadline, $html);
            $this->assertSame([
                ['Responder até', $deadline],
                ['Tempo', 'cerca de 2 minutos'],
                ['Perguntas', '8'],
            ], $mail->detailsRows);
            $this->assertStringContainsString('Responder questionário', $html);
            $this->assertStringContainsString($expectedUrl, $html);
            $this->assertStringContainsString('Suas respostas vão direto para a clínica', $html);

            return true;
        });
    }

    public function test_does_not_send_when_questionnaire_does_not_belong_to_event_clinic_and_log_omits_email(): void
    {
        Mail::fake();

        $handler = new TestHandler;
        $logger  = Log::channel('dated')->getLogger();
        $this->assertInstanceOf(Logger::class, $logger);
        $logger->pushHandler($handler);

        $clinic  = Clinic::factory()->create(['slug' => 'clinica-a']);
        $patient = Patient::factory()->forClinic($clinic)->create([
            'email' => 'paciente-a@example.test',
        ]);
        $template = QuestionnaireTemplate::factory()->forClinic($clinic)->create([
            'title' => 'Questionário da clínica A',
        ]);
        $questionnaire = PatientQuestionnaire::factory()->forPatient($patient, $clinic)->create([
            'questionnaire_template_id' => $template->id,
            'status'                    => PatientQuestionnaire::STATUS_PENDING,
            'expires_at'                => now()->addDays(2),
        ]);
        $clinicB = Clinic::factory()->create();

        Event::dispatch(new QuestionnaireEmailRequested(
            version: 1,
            clinicId: $clinicB->id,
            patientQuestionnaireId: $questionnaire->id,
            patientId: $patient->id,
            actorId: null,
            occurredAt: CarbonImmutable::now(),
        ));

        Mail::assertNothingSent();

        $warning = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'questionnaire_sent'
                && $record->level->getName() === 'WARNING'
        );

        $this->assertNotNull($warning);
        $this->assertSame($clinicB->id, $warning->context['clinic_id']);
        $this->assertSame($questionnaire->id, $warning->context['patient_questionnaire_id']);
        $this->assertSame($patient->id, $warning->context['patient_id']);
        $this->assertStringNotContainsString('paciente-a@example.test', json_encode($warning->toArray()));
    }

    public function test_omits_deadline_when_questionnaire_has_no_expiry(): void
    {
        Mail::fake();

        $clinic  = Clinic::factory()->create(['slug' => 'clinica-sem-prazo', 'timezone' => 'America/Sao_Paulo']);
        $patient = Patient::factory()->forClinic($clinic)->create([
            'email' => 'sem-prazo@example.test',
        ]);
        $template = QuestionnaireTemplate::factory()->forClinic($clinic)->create([
            'title' => 'Sem prazo',
        ]);
        $section = QuestionnaireSection::query()->create([
            'questionnaire_template_id' => $template->id,
            'title'                     => 'Única',
            'sort_order'                => 0,
        ]);
        QuestionnaireQuestion::query()->create([
            'questionnaire_section_id' => $section->id,
            'label'                    => 'Uma pergunta',
            'type'                     => QuestionnaireQuestion::TYPE_TEXT,
            'required'                 => true,
            'sort_order'               => 0,
        ]);
        $questionnaire = PatientQuestionnaire::factory()->forPatient($patient, $clinic)->create([
            'questionnaire_template_id' => $template->id,
            'status'                    => PatientQuestionnaire::STATUS_PENDING,
            'expires_at'                => null,
        ]);

        Event::dispatch(new QuestionnaireEmailRequested(
            version: 1,
            clinicId: $clinic->id,
            patientQuestionnaireId: $questionnaire->id,
            patientId: $patient->id,
            actorId: null,
            occurredAt: CarbonImmutable::now(),
        ));

        Mail::assertSent(QuestionnaireSentMail::class, function (QuestionnaireSentMail $mail): bool {
            $html = $mail->render();

            $this->assertSame([
                ['Tempo', 'cerca de 1 minuto'],
                ['Perguntas', '1'],
            ], $mail->detailsRows);
            $this->assertStringNotContainsString('Responder até', $html);

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

        $patientEmail = 'sigiloso-paciente@example.test';
        $clinic       = Clinic::factory()->create(['slug' => 'clinica-log', 'timezone' => 'America/Sao_Paulo']);
        $patient      = Patient::factory()->forClinic($clinic)->create([
            'email' => $patientEmail,
        ]);
        $template      = QuestionnaireTemplate::factory()->forClinic($clinic)->create();
        $questionnaire = PatientQuestionnaire::factory()->forPatient($patient, $clinic)->create([
            'questionnaire_template_id' => $template->id,
            'status'                    => PatientQuestionnaire::STATUS_PENDING,
            'expires_at'                => now()->addDay(),
        ]);

        $event = new QuestionnaireEmailRequested(
            version: 1,
            clinicId: $clinic->id,
            patientQuestionnaireId: $questionnaire->id,
            patientId: $patient->id,
            actorId: null,
            occurredAt: CarbonImmutable::now(),
        );

        Event::dispatch($event);

        $sentRecord = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'questionnaire_sent'
                && $record->level->getName() === 'INFO'
        );

        $this->assertNotNull($sentRecord);
        $this->assertSame($clinic->id, $sentRecord->context['clinic_id']);
        $this->assertSame($questionnaire->id, $sentRecord->context['patient_questionnaire_id']);
        $this->assertSame($patient->id, $sentRecord->context['patient_id']);
        $this->assertStringNotContainsString($patientEmail, json_encode($sentRecord->toArray()));

        $listener = app(SendQuestionnaireEmail::class);
        $listener->failed($event, new RuntimeException("SMTP rejected {$patientEmail}"));

        $failedRecord = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'questionnaire_sent'
                && $record->level->getName() === 'ERROR'
        );

        $this->assertNotNull($failedRecord);
        $this->assertSame($clinic->id, $failedRecord->context['clinic_id']);
        $this->assertSame($questionnaire->id, $failedRecord->context['patient_questionnaire_id']);
        $this->assertSame($patient->id, $failedRecord->context['patient_id']);
        $this->assertStringNotContainsString($patientEmail, json_encode($failedRecord->toArray()));
    }

    public function test_listener_is_queued_with_three_attempts_and_exponential_backoff(): void
    {
        $listener = app(SendQuestionnaireEmail::class);

        $this->assertInstanceOf(ShouldQueue::class, $listener);
        $this->assertSame(3, $listener->tries);
        $this->assertSame([10, 30, 60], $listener->backoff);
    }
}
