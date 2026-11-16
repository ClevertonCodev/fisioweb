<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Tests\TestCase;

class ExerciseReviewTest extends TestCase
{
    use RefreshDatabase;

    private AdminUser $admin;

    private PhysioArea $physioArea;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin      = AdminUser::factory()->create();
        $this->physioArea = PhysioArea::create(['name' => 'Ortopedia']);
    }

    private function pendingExercise(): Exercise
    {
        $clinic     = Clinic::factory()->create();
        $clinicUser = ClinicUser::factory()->create(['clinic_id' => $clinic->id]);

        return Exercise::create([
            'name'                        => 'Enviado pela clínica',
            'physio_area_id'              => $this->physioArea->id,
            'difficulty_level'            => Exercise::DIFFICULTY_EASY,
            'clinic_id'                   => $clinic->id,
            'submitted_by_clinic_user_id' => $clinicUser->id,
            'review_status'               => Exercise::REVIEW_PENDING,
            'is_active'                   => true,
        ]);
    }

    public function test_pending_count_returns_number_of_pending_exercises(): void
    {
        $this->pendingExercise();
        $this->pendingExercise();

        $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/exercises/pending-count')
            ->assertOk()
            ->assertJsonPath('data.pending_count', 2);
    }

    public function test_admin_can_approve_exercise(): void
    {
        $exercise = $this->pendingExercise();

        $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.review_status', Exercise::REVIEW_APPROVED);

        $this->assertDatabaseHas('admin_exercises', [
            'id'            => $exercise->id,
            'review_status' => Exercise::REVIEW_APPROVED,
            'reviewed_by'   => $this->admin->id,
        ]);
        $this->assertNotNull($exercise->fresh()->reviewed_at);
    }

    public function test_admin_can_reject_exercise(): void
    {
        $exercise = $this->pendingExercise();

        $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/reject")
            ->assertOk()
            ->assertJsonPath('data.review_status', Exercise::REVIEW_REJECTED);
    }

    public function test_admin_cannot_reject_exercise_already_approved(): void
    {
        $exercise = $this->pendingExercise();
        $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/approve")
            ->assertOk();
        $reviewedAt = $exercise->fresh()->reviewed_at;

        $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/reject")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Exercício já aprovado. Para tirar do catálogo, desative-o.');

        $this->assertSame(Exercise::REVIEW_APPROVED, $exercise->fresh()->review_status);
        $this->assertEquals($reviewedAt, $exercise->fresh()->reviewed_at);
    }

    public function test_reject_does_not_overwrite_an_approval_that_lands_after_the_status_was_read(): void
    {
        $exercise       = $this->pendingExercise();
        $approvalLanded = false;
        Exercise::retrieved(function (Exercise $retrieved) use ($exercise, &$approvalLanded) {
            if ($approvalLanded || $retrieved->id !== $exercise->id) {
                return;
            }
            $approvalLanded = true;
            Exercise::query()->whereKey($exercise->id)->toBase()->update(['review_status' => Exercise::REVIEW_APPROVED]);
        });

        $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/reject");

        $this->assertTrue($approvalLanded);
        $this->assertSame(Exercise::REVIEW_APPROVED, $exercise->fresh()->review_status);
    }

    public function test_admin_can_reject_exercise_that_was_rejected_before(): void
    {
        $exercise = $this->pendingExercise();
        $exercise->update(['review_status' => Exercise::REVIEW_REJECTED]);

        $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/reject")
            ->assertOk()
            ->assertJsonPath('data.review_status', Exercise::REVIEW_REJECTED);
    }

    public function test_review_requires_admin_guard(): void
    {
        $exercise = $this->pendingExercise();

        $this->putJson("/api/admin/exercises/{$exercise->id}/approve")
            ->assertUnauthorized();
    }
}
