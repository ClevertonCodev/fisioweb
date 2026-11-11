<?php

namespace Modules\Admin\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Models\Video;
use Tests\TestCase;

class ExerciseOptionsVideoSelectorTest extends TestCase
{
    use RefreshDatabase;

    public function test_operator_video_selector_lists_only_catalog_videos(): void
    {
        $clinic   = Clinic::factory()->create();
        $catalog  = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);
        $ofClinic = Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => Video::STATUS_COMPLETED,
        ]);

        $ids = collect($this->actingAs(AdminUser::factory()->create(), 'admin')
            ->getJson('/api/admin/exercises/options')
            ->assertOk()
            ->json('data.videos'))
            ->pluck('id')
            ->all();

        $this->assertSame([$catalog->id], $ids);
        $this->assertNotContains($ofClinic->id, $ids);
    }

    public function test_operator_editing_clinic_exercise_sees_its_linked_video_and_no_other_clinic_video(): void
    {
        $clinic      = Clinic::factory()->create();
        $otherClinic = Clinic::factory()->create();
        $area        = PhysioArea::create(['name' => 'Ortopedia']);
        $catalog     = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);
        $linked      = Video::factory()->create(['clinic_id' => $clinic->id, 'status' => Video::STATUS_COMPLETED]);
        $unlinked    = Video::factory()->create(['clinic_id' => $clinic->id, 'status' => Video::STATUS_COMPLETED]);
        $ofOther     = Video::factory()->create(['clinic_id' => $otherClinic->id, 'status' => Video::STATUS_COMPLETED]);
        $failed      = Video::factory()->create(['clinic_id' => $clinic->id, 'status' => Video::STATUS_FAILED]);
        $exercise    = $this->exercise($clinic->id, $area);
        $exercise->videos()->attach([$linked->id, $failed->id]);
        $this->exercise($otherClinic->id, $area)->videos()->attach($ofOther->id);

        $ids = collect($this->actingAs(AdminUser::factory()->create(), 'admin')
            ->getJson("/api/admin/exercises/options?exercise_id={$exercise->id}")
            ->assertOk()
            ->json('data.videos'))
            ->pluck('id')
            ->sort()
            ->values()
            ->all();

        $this->assertSame([$catalog->id, $linked->id], $ids);
        $this->assertNotContains($unlinked->id, $ids);
        $this->assertNotContains($ofOther->id, $ids);
        $this->assertNotContains($failed->id, $ids);
    }

    public function test_operator_options_reject_exercise_id_that_is_not_a_positive_integer(): void
    {
        $this->actingAs(AdminUser::factory()->create(), 'admin')
            ->getJson('/api/admin/exercises/options?exercise_id=abc')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('exercise_id');
    }

    private function exercise(int $clinicId, PhysioArea $area): Exercise
    {
        return Exercise::create([
            'name'           => 'Exercício da clínica ' . $clinicId,
            'physio_area_id' => $area->id,
            'clinic_id'      => $clinicId,
            'review_status'  => Exercise::REVIEW_PENDING,
            'is_active'      => true,
        ]);
    }

    public function test_clinic_user_cannot_read_operator_video_selector(): void
    {
        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        Video::factory()->create([
            'clinic_id' => Clinic::factory()->create()->id,
            'status'    => Video::STATUS_COMPLETED,
        ]);

        $this->actingAs($user, 'clinic')
            ->getJson('/api/admin/exercises/options')
            ->assertUnauthorized();
    }
}
