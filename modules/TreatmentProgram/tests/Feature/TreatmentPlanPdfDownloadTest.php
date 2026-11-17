<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\ExerciseMedia;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanExercise;
use Modules\TreatmentProgram\Models\TreatmentPlanGroup;
use Modules\TreatmentProgram\Services\ProgramPdfQrCodeGenerator;
use Modules\TreatmentProgram\Services\ProgramPdfViewModelBuilder;
use Tests\TestCase;

class TreatmentPlanPdfDownloadTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $clinicUser;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();

        $this->clinicUser = ClinicUser::factory()->create([
            'name'       => 'Dra. Ana PDF',
            'document'   => '12345-F',
            'photo_path' => 'clinic-users/photos/ana.jpg',
        ]);

        Clinic::query()->whereKey($this->clinicUser->clinic_id)->update([
            'slug'  => 'clinica-pdf',
            'phone' => '+55 11 99999-0000',
            'email' => 'contato@clinica.test',
        ]);
    }

    public function test_download_pdf_returns_application_pdf_for_own_clinic(): void
    {
        $plan = $this->makePlanWithPatient();

        $response = $this->actingAs($this->clinicUser, 'clinic')
            ->get("/api/clinic/treatment-plans/{$plan->id}/pdf");

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_download_pdf_returns_404_for_other_clinic(): void
    {
        $plan  = $this->makePlanWithPatient();
        $other = ClinicUser::factory()->create();

        $this->actingAs($other, 'clinic')
            ->get("/api/clinic/treatment-plans/{$plan->id}/pdf")
            ->assertNotFound();
    }

    public function test_pdf_html_uses_signed_media_and_hides_the_public_host(): void
    {
        $plan = $this->makePlanWithPatient();
        $plan->load([
            'groups.exercises.exercise.videos',
            'groups.exercises.exercise.media',
            'patient',
            'clinic',
            'clinicUser',
        ]);

        $html = view('pdf.clinic.treatment.treatment-plan', [
            'plan'       => $plan,
            'pdfMeta'    => app(ProgramPdfViewModelBuilder::class)->build($plan),
            'qrImageSrc' => null,
            'groupLabel' => fn (?string $name) => $name ?? '',
        ])->render();

        preg_match('/<img class="avatar" src="([^"]+)"/', $html, $photo);
        $this->assertSignedImageUrl(
            html_entity_decode($photo[1] ?? '', ENT_QUOTES),
            'clinic-users/photos/ana.jpg',
        );
        $this->assertStringNotContainsString('cdn-dev.ivsmed.com', $html);
        preg_match_all('/<img src="([^"]+)"/', $html, $images);
        $exerciseSrc = null;
        foreach ($images[1] as $src) {
            $decoded = html_entity_decode($src, ENT_QUOTES);
            if (!str_contains($decoded, 'clinic-users/photos/ana.jpg')) {
                $exerciseSrc = $decoded;
                break;
            }
        }
        $this->assertIsString($exerciseSrc);
        $this->assertStringContainsString('X-Amz-Expires=300', $exerciseSrc);
        $this->assertStringContainsString('a.jpeg', $exerciseSrc);
        $this->assertStringNotContainsString('cdn-dev.ivsmed.com', $exerciseSrc);
    }

    public function test_qr_failure_does_not_call_the_network_or_log_the_link(): void
    {
        $generator = new class extends ProgramPdfQrCodeGenerator
        {
            protected function renderLocal(string $url): ?string
            {
                throw new \RuntimeException('qr indisponível');
            }
        };

        \Illuminate\Support\Facades\Http::fake();
        \Illuminate\Support\Facades\Log::shouldReceive('warning')
            ->once()
            ->withArgs(function (string $message, array $context = []) {
                $encoded = json_encode($context);

                return $message === 'QR do programa não gerado'
                    && is_string($encoded)
                    && !str_contains($encoded, 'token-secreto');
            });

        $this->assertNull($generator->imageSrc('https://app.test/paciente/programas/token-secreto'));
        \Illuminate\Support\Facades\Http::assertNothingSent();
    }

    public function test_download_pdf_works_without_patient(): void
    {
        $plan = TreatmentPlan::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'title'          => 'Modelo sem paciente',
            'status'         => 'draft',
        ]);

        $this->actingAs($this->clinicUser, 'clinic')
            ->get("/api/clinic/treatment-plans/{$plan->id}/pdf")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    private function makePlanWithPatient(): TreatmentPlan
    {
        $admin = AdminUser::factory()->create();
        $area  = PhysioArea::create(['name' => 'Ortopedia PDF']);

        $exercise = Exercise::create([
            'name'           => 'Exercício PDF',
            'physio_area_id' => $area->id,
            'created_by'     => $admin->id,
            'is_active'      => true,
            'description'    => 'Descrição do exercício',
        ]);

        ExerciseMedia::create([
            'exercise_id'       => $exercise->id,
            'type'              => ExerciseMedia::TYPE_IMAGE,
            'file_path'         => 'covers/videos/a.jpeg',
            'original_filename' => 'a.jpeg',
            'mime_type'         => 'image/jpeg',
            'size'              => 100,
            'sort_order'        => 0,
        ]);

        $patient = Patient::factory()->create([
            'clinic_id' => $this->clinicUser->clinic_id,
            'name'      => 'Paciente PDF',
        ]);

        $plan = TreatmentPlan::create([
            'clinic_id'        => $this->clinicUser->clinic_id,
            'clinic_user_id'   => $this->clinicUser->id,
            'patient_id'       => $patient->id,
            'title'            => 'Programa PDF Teste',
            'status'           => 'active',
            'start_date'       => '2026-07-10',
            'end_date'         => '2026-08-10',
            'duration_minutes' => 40,
            'notes'            => 'Obs do plano',
        ]);

        $group = TreatmentPlanGroup::create([
            'treatment_plan_id' => $plan->id,
            'name'              => '   ',
            'sort_order'        => 0,
        ]);

        TreatmentPlanExercise::create([
            'treatment_plan_id'       => $plan->id,
            'treatment_plan_group_id' => $group->id,
            'exercise_id'             => $exercise->id,
            'sort_order'              => 0,
            'sets_min'                => 3,
            'sets_max'                => 3,
            'repetitions_min'         => 10,
            'repetitions_max'         => 12,
            'rest_time'               => 30,
        ]);

        return $plan;
    }
}
