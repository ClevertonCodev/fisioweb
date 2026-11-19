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
use Modules\Email\Listeners\SendTreatmentPlanEmail;
use Modules\Email\Mail\TreatmentPlanSentMail;
use Modules\TreatmentProgram\Events\TreatmentPlanEmailRequested;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Monolog\Handler\TestHandler;
use Monolog\Logger;
use RuntimeException;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class SendTreatmentPlanEmailTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpPatientProgramFixtures();
    }

    public function test_listener_is_queued_with_three_attempts_and_exponential_backoff(): void
    {
        $listener = app(SendTreatmentPlanEmail::class);

        $this->assertInstanceOf(ShouldQueue::class, $listener);
        $this->assertSame(3, $listener->tries);
        $this->assertSame([10, 30, 60], $listener->backoff);
    }

    public function test_sends_program_email_with_ivs_med_layout_clinic_sender_and_no_reply_to(): void
    {
        Mail::fake();

        config([
            'app.timezone'      => 'UTC',
            'mail.from.address' => 'naoresponda@ivsmed.com',
            'mail.from.name'    => 'IVS MED',
        ]);

        Clinic::query()->whereKey($this->clinicUser->clinic_id)->update([
            'name'     => 'Clínica Movimento',
            'phone'    => '(11) 4000-1234',
            'address'  => 'Rua das Flores',
            'number'   => '120',
            'city'     => 'São Paulo',
            'state'    => 'SP',
            'timezone' => 'America/Sao_Paulo',
        ]);

        $this->clinicUser->update([
            'name' => 'Rafael Lima',
            'role' => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        $patient = $this->createPatient([
            'name'        => 'Ana Paula Silva',
            'email'       => 'ana@example.test',
            'apelido'     => 'Aninha',
            'use_apelido' => false,
        ]);

        $startDate = now()->addDay();
        $endDate   = now()->addDays(30);

        $fixture = $this->createActiveProgram($patient, [
            'title'      => 'Fortalecimento de joelho · fase 1',
            'message'    => 'Faça os exercícios 3 vezes por semana.',
            'start_date' => $startDate->toDateString(),
            'end_date'   => $endDate->toDateString(),
        ]);

        $plan = $fixture['plan'];

        Event::dispatch(new TreatmentPlanEmailRequested(
            version: 1,
            clinicId: $this->clinicUser->clinic_id,
            treatmentPlanId: $plan->id,
            patientId: $patient->id,
            actorId: $this->clinicUser->id,
            occurredAt: CarbonImmutable::now(),
        ));

        Mail::assertSent(TreatmentPlanSentMail::class, function (TreatmentPlanSentMail $mail) use ($plan, $startDate, $endDate): bool {
            $envelope = $mail->envelope();
            $html     = $mail->render();
            $text     = (string) app(\Illuminate\Mail\Markdown::class)->renderText(
                $mail->content()->markdown,
                $mail->buildViewData(),
            );

            $expectedUrl = rtrim((string) config('app.url'), '/')
                . '/clinica-teste/paciente/programas/'
                . $plan->public_token;

            $this->assertTrue($mail->hasTo('ana@example.test'));
            $this->assertSame('naoresponda@ivsmed.com', $envelope->from?->address);
            $this->assertSame('Clínica Movimento via IVS MED', $envelope->from?->name);
            $this->assertSame([], $envelope->replyTo);
            $this->assertSame('Seu programa de exercícios está disponível · Clínica Movimento', $envelope->subject);
            $this->assertStringNotContainsString('Fortalecimento de joelho', (string) $envelope->subject);

            $this->assertStringContainsString('src="cid:ivsmed-logo"', $html);
            $this->assertStringContainsString('Olá, Ana!', $html);
            $this->assertStringContainsString('Fortalecimento de joelho · fase 1', $html);
            $this->assertStringContainsString($startDate->format('d/m/Y'), $html);
            $this->assertStringContainsString($endDate->format('d/m/Y'), $html);
            $this->assertSame([
                ['Início', $startDate->format('d/m/Y')],
                ['Válido até', $endDate->format('d/m/Y')],
                ['Exercícios', '1'],
            ], $mail->detailsRows);
            $this->assertMatchesRegularExpression('/Exercícios<\/td>\s*<td[^>]*>1<\/td>/', $html);
            $this->assertStringContainsString('Faça os exercícios 3 vezes por semana.', $html);
            $this->assertStringContainsString('Rafael Lima · Fisioterapeuta', $html);
            $this->assertStringContainsString('Abrir meu programa', $html);
            $this->assertStringContainsString($expectedUrl, $html);
            $this->assertStringContainsString('Este link é só seu.', $html);
            $this->assertStringContainsString('(11) 4000-1234', $html);
            $this->assertStringContainsString('Rua das Flores, 120 · São Paulo/SP', $html);
            $this->assertStringContainsString('Enviado pela IVS MED em nome da Clínica Movimento. Este endereço não recebe respostas.', $html);

            $this->assertStringContainsString('Clínica Movimento via IVS MED', $text);
            $this->assertStringContainsString('Olá, Ana!', $text);
            $this->assertStringContainsString('Exercícios: 1', $text);
            $this->assertStringContainsString($expectedUrl, $text);
            $this->assertStringContainsString('(11) 4000-1234', $text);
            $this->assertStringContainsString('Rua das Flores, 120 · São Paulo/SP', $text);

            return true;
        });
    }

    public function test_uses_apelido_in_greeting_when_patient_uses_apelido(): void
    {
        Mail::fake();

        $patient = $this->createPatient([
            'name'        => 'Ana Paula Silva',
            'apelido'     => 'Aninha',
            'use_apelido' => true,
            'email'       => 'aninha@example.test',
        ]);
        $fixture = $this->createActiveProgram($patient);

        Event::dispatch(new TreatmentPlanEmailRequested(
            version: 1,
            clinicId: $this->clinicUser->clinic_id,
            treatmentPlanId: $fixture['plan']->id,
            patientId: $patient->id,
            actorId: $this->clinicUser->id,
            occurredAt: CarbonImmutable::now(),
        ));

        Mail::assertSent(TreatmentPlanSentMail::class, function (TreatmentPlanSentMail $mail): bool {
            $html = $mail->render();
            $this->assertStringContainsString('Olá, Aninha!', $html);
            $this->assertStringNotContainsString('Olá, Ana!', $html);

            return true;
        });
    }

    public function test_external_text_never_turns_into_markdown_or_raw_html(): void
    {
        Mail::fake();

        Clinic::query()->whereKey($this->clinicUser->clinic_id)->update([
            'name'    => 'Clínica [X](https://evil.test/clinic)',
            'address' => "Rua A & B\n\n# Título",
        ]);

        $this->clinicUser->update([
            'name' => "Dr\n\n[autor](https://evil.test/author)\n\n# AutorEvil",
        ]);

        $patient = $this->createPatient([
            'name'        => 'Ana',
            'apelido'     => '[Aninha](https://evil.test/apelido)',
            'use_apelido' => true,
            'email'       => 'seguro@example.test',
        ]);

        $fixture = $this->createActiveProgram($patient, [
            'title'   => "Joelho <b>1</b>\n\n# Injetado [clique](https://evil.test/title)",
            'message' => "Faça [isto](https://evil.test/msg)\n\n# Outro &amp; teste",
        ]);

        Event::dispatch(new TreatmentPlanEmailRequested(
            version: 1,
            clinicId: $this->clinicUser->clinic_id,
            treatmentPlanId: $fixture['plan']->id,
            patientId: $patient->id,
            actorId: $this->clinicUser->id,
            occurredAt: CarbonImmutable::now(),
        ));

        Mail::assertSent(TreatmentPlanSentMail::class, function (TreatmentPlanSentMail $mail): bool {
            $html = $mail->render();

            $this->assertStringNotContainsString('href="https://evil.test', $html);
            $this->assertStringNotContainsString('<b>1</b>', $html);
            $this->assertStringNotContainsString('<h1>Injetado', $html);
            $this->assertStringNotContainsString('<h1>Outro', $html);
            $this->assertStringNotContainsString('<h1>AutorEvil', $html);

            return true;
        });

        $directMail = new TreatmentPlanSentMail(
            clinicName: 'Clínica',
            clinicPhone: null,
            clinicAddress: null,
            greetingName: 'Ana',
            programTitle: 'Programa',
            detailsRows: [['Exercícios', '1']],
            message: 'Mensagem',
            authorName: "Dr\n\n[clique](https://evil.test/direct-author)",
            authorRole: "Fisio\n\n[papel](https://evil.test/direct-role)\n\n# PapelEvil",
            shareUrl: 'https://app.test/clinica/paciente/programas/abc',
        );
        $directHtml = $directMail->render();
        $this->assertStringNotContainsString('href="https://evil.test', $directHtml);
        $this->assertStringNotContainsString('<h1>PapelEvil', $directHtml);
    }

    public function test_does_not_send_when_program_does_not_belong_to_event_clinic(): void
    {
        Mail::fake();

        $handler = new TestHandler;
        $logger  = Log::channel('dated')->getLogger();
        $this->assertInstanceOf(Logger::class, $logger);
        $logger->pushHandler($handler);

        $patient = $this->createPatient(['email' => 'paciente-a@example.test']);
        $fixture = $this->createActiveProgram($patient);
        $clinicB = Clinic::factory()->create();

        Event::dispatch(new TreatmentPlanEmailRequested(
            version: 1,
            clinicId: $clinicB->id,
            treatmentPlanId: $fixture['plan']->id,
            patientId: $patient->id,
            actorId: null,
            occurredAt: CarbonImmutable::now(),
        ));

        Mail::assertNothingSent();

        $warning = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'treatment_plan_sent'
                && $record->level->getName() === 'WARNING'
        );

        $this->assertNotNull($warning);
        $this->assertSame($clinicB->id, $warning->context['clinic_id']);
        $this->assertSame($fixture['plan']->id, $warning->context['treatment_plan_id']);
        $this->assertStringNotContainsString('paciente-a@example.test', json_encode($warning->toArray()));
    }

    public function test_omits_quote_and_optional_dates_when_not_set(): void
    {
        Mail::fake();

        $patient = $this->createPatient(['email' => 'sem-msg@example.test']);
        $fixture = $this->createActiveProgram($patient, [
            'message'    => null,
            'start_date' => null,
            'end_date'   => null,
        ]);

        Event::dispatch(new TreatmentPlanEmailRequested(
            version: 1,
            clinicId: $this->clinicUser->clinic_id,
            treatmentPlanId: $fixture['plan']->id,
            patientId: $patient->id,
            actorId: $this->clinicUser->id,
            occurredAt: CarbonImmutable::now(),
        ));

        Mail::assertSent(TreatmentPlanSentMail::class, function (TreatmentPlanSentMail $mail): bool {
            $html = $mail->render();
            $text = (string) app(\Illuminate\Mail\Markdown::class)->renderText(
                $mail->content()->markdown,
                $mail->buildViewData(),
            );

            $this->assertStringNotContainsString('class="quote"', $html);
            $this->assertStringNotContainsString('Válido até', $html);
            $this->assertSame([['Exercícios', '1']], $mail->detailsRows);
            $this->assertStringContainsString('Exercícios: 1', $text);

            return true;
        });
    }

    public function test_logs_sent_and_failed_with_ids_and_never_logs_patient_email(): void
    {
        Mail::fake();

        $handler = new TestHandler;
        Log::setDefaultDriver('dated');
        $channel = Log::channel('dated');
        $logger  = $channel->getLogger();
        $this->assertInstanceOf(Logger::class, $logger);
        $logger->pushHandler($handler);

        $patientEmail = 'sigiloso-paciente@example.test';
        $patient      = $this->createPatient(['email' => $patientEmail]);
        $fixture      = $this->createActiveProgram($patient);
        $plan         = $fixture['plan'];

        $event = new TreatmentPlanEmailRequested(
            version: 1,
            clinicId: $this->clinicUser->clinic_id,
            treatmentPlanId: $plan->id,
            patientId: $patient->id,
            actorId: $this->clinicUser->id,
            occurredAt: CarbonImmutable::now(),
        );

        Event::dispatch($event);

        $sentRecord = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'treatment_plan_sent'
                && $record->level->getName() === 'INFO'
        );

        $this->assertNotNull($sentRecord);
        $this->assertSame($this->clinicUser->clinic_id, $sentRecord->context['clinic_id']);
        $this->assertSame($plan->id, $sentRecord->context['treatment_plan_id']);
        $this->assertSame($patient->id, $sentRecord->context['patient_id']);
        $this->assertStringNotContainsString($patientEmail, json_encode($sentRecord->toArray()));

        $listener = app(SendTreatmentPlanEmail::class);
        $listener->failed($event, new RuntimeException("SMTP rejected {$patientEmail}"));

        $failedRecord = collect($handler->getRecords())->last(
            fn ($record) => ($record->context['type'] ?? null) === 'treatment_plan_sent'
                && $record->level->getName() === 'ERROR'
        );

        $this->assertNotNull($failedRecord);
        $this->assertSame($this->clinicUser->clinic_id, $failedRecord->context['clinic_id']);
        $this->assertSame($plan->id, $failedRecord->context['treatment_plan_id']);
        $this->assertSame($patient->id, $failedRecord->context['patient_id']);
        $this->assertStringNotContainsString($patientEmail, json_encode($failedRecord->toArray()));
    }

    public function test_sent_program_email_embeds_inline_logo_and_has_no_reply_to(): void
    {
        config([
            'mail.default'      => 'array',
            'mail.from.address' => 'naoresponda@ivsmed.com',
            'mail.from.name'    => 'IVS MED',
        ]);

        $patient = $this->createPatient(['email' => 'inline@example.test']);
        $fixture = $this->createActiveProgram($patient);

        Event::dispatch(new TreatmentPlanEmailRequested(
            version: 1,
            clinicId: $this->clinicUser->clinic_id,
            treatmentPlanId: $fixture['plan']->id,
            patientId: $patient->id,
            actorId: $this->clinicUser->id,
            occurredAt: CarbonImmutable::now(),
        ));

        $sent = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(1, $sent);

        /** @var Email $email */
        $email  = $sent[0]->getOriginalMessage();
        $inline = collect($email->getAttachments())
            ->filter(fn ($part) => $part->getDisposition() === 'inline' && $part->getMediaSubtype() === 'png');

        $this->assertCount(1, $inline);
        $this->assertSame([], $email->getReplyTo());
    }
}
